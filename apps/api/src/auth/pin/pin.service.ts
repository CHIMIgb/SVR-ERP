import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
  HttpException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult, users } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuthService } from '../auth.service';
import { BloqueoService } from '../../bloqueo/bloqueo.service';
import { IntentosLoginService } from '../intentos-login.service';
import { LoginPinDto, PinCambioDto } from './dto/pin.dto';
import { normalizarPin, validarPinNuevo, generarPinTemporal } from './pin.validator';

const SALT_ROUNDS = 12;
const MAX_INTENTOS_PIN = 5;
const PIN_CADUCIDAD_DIAS = 30;
const PIN_TEMPORAL_HORAS = 24;
const PIN_AVISO_DIAS = 25;
/** Bloqueo de cuenta por PINs fallidos: TEMPORAL con auto-desbloqueo (PR #18 #3) */
const PIN_BLOQUEO_MINUTOS = Number(process.env.PIN_BLOQUEO_MINUTOS || 15);

/** Usuario con los campos de PIN (select fijo). */
const PIN_SELECT = {
  id: true,
  email: true,
  numero_empleado: true,
  pin_hash: true,
  pin_temporal_hasta: true,
  pin_cambiado_en: true,
  pin_historial: true,
  intentos_pin: true,
  cuenta_bloqueada_en: true,
  activo: true,
  eliminado_en: true,
} as const;

type UserPin = Pick<users, keyof typeof PIN_SELECT>;

@Injectable()
export class PinService {
  private readonly logger = new Logger(PinService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly authService: AuthService,
    private readonly bloqueoService: BloqueoService,
    private readonly intentosLoginService: IntentosLoginService,
  ) {}

  /**
   * LOGIN-PIN: número de empleado + PIN (spec §6.4-6.6).
   * Reutiliza la maquinaria de sesión/tokens de AuthService (regla 12 de
   * AGENTS.md: una sola copia de la lógica crítica). Bloqueo TEMPORAL de
   * cuenta a los 5 intentos fallidos (15 min, auto-desbloqueo) + bloqueo
   * por IP con el mismo BloqueoService del login por email (PR #18 #3).
   */
  async loginPin(dto: LoginPinDto, ip?: string, userAgent?: string) {
    const numero = dto.numeroEmpleado.trim().toUpperCase();

    // 0. IP bloqueada — misma maquinaria por IP del login por email (PR #18 #3)
    if (ip) {
      const ipBloqueada = await this.bloqueoService.verificarBloqueoPorIP(ip);
      if (ipBloqueada.bloqueado) {
        await this.intentosLoginService.registrar({
          email: numero,
          exitoso: false,
          motivoFallo: `IP bloqueada (${ipBloqueada.minutosRestantes} min restantes)`,
          ip,
          userAgent,
        });
        await this.fallirLogin(numero, 'IP_BLOCKED', ip, userAgent);
        throw new UnauthorizedException(
          `Demasiados intentos desde esta IP. Intenta de nuevo en ${ipBloqueada.minutosRestantes} minuto(s)`,
        );
      }
    }

    const user = (await this.prisma.users.findFirst({
      where: { numero_empleado: numero, eliminado_en: null },
      select: { ...PIN_SELECT, email: true },
    })) as UserPin & { email: string } | null;

    // Mensaje ÚNICO anti-enumeración (review PR #18, mediano): inexistente/
    // inactivo/sin PIN, cuenta bloqueada y temporal expirado responden igual;
    // el detalle queda solo en el errorCode de la auditoría.
    const MENSAJE_GENERICO = 'Número de empleado o PIN incorrecto';

    if (!user || !user.activo || !user.pin_hash) {
      await this.registrarFalloPin(numero, user?.id, 'CREDENCIALES_INVALIDAS', ip, userAgent);
      throw new UnauthorizedException(MENSAJE_GENERICO);
    }

    // cuenta bloqueada: TEMPORAL (15 min, auto-desbloqueo — PR #18 #3); la
    // mesa de ayuda puede adelantarla con pin/desbloqueo
    const bloqueadaActiva =
      !!user.cuenta_bloqueada_en &&
      Date.now() - user.cuenta_bloqueada_en.getTime() < PIN_BLOQUEO_MINUTOS * 60_000;
    if (bloqueadaActiva) {
      await this.registrarFalloPin(numero, user.id, 'CUENTA_BLOQUEADA', ip, userAgent);
      throw new UnauthorizedException(MENSAJE_GENERICO);
    }

    // PIN temporal expirado (24 h): solo un reinicio lo re-activa
    if (user.pin_temporal_hasta && user.pin_temporal_hasta.getTime() < Date.now()) {
      await this.registrarFalloPin(numero, user.id, 'PIN_TEMPORAL_EXPIRADO', ip, userAgent);
      throw new UnauthorizedException(MENSAJE_GENERICO);
    }

    const ok = await bcrypt.compare(normalizarPin(dto.pin), user.pin_hash!);
    if (!ok) {
      // contador ATÓMICO (review PR #18, mediano): update condicional +
      // increment en una sola sentencia (row lock de Postgres); devuelve el
      // valor final y P2025 si ya estaba al tope — intentos en paralelo no
      // se saltan el bloqueo ni lo atrasan.
      let nuevosIntentos: number;
      try {
        const r = await this.prisma.users.update({
          where: { id: user.id, intentos_pin: { lt: MAX_INTENTOS_PIN } },
          data: { intentos_pin: { increment: 1 } },
        });
        nuevosIntentos = r.intentos_pin;
      } catch {
        nuevosIntentos = MAX_INTENTOS_PIN; // al tope (o el usuario desapareció)
      }
      const bloquear = nuevosIntentos >= MAX_INTENTOS_PIN;
      if (bloquear) {
        await this.prisma.users.update({
          where: { id: user.id },
          data: { intentos_pin: MAX_INTENTOS_PIN, cuenta_bloqueada_en: new Date() },
        });
      }
      await this.registrarFalloPin(
        numero,
        user.id,
        bloquear ? 'CUENTA_BLOQUEADA' : 'PIN_INVALIDO',
        ip,
        userAgent,
      );
      throw new UnauthorizedException(MENSAJE_GENERICO);
    }

    // éxito: resetea intentos y bloqueo (p. ej. uno vencido), crea sesión + tokens
    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        intentos_pin: 0,
        cuenta_bloqueada_en: null,
        ultimo_login: new Date(),
        actualizado_en: new Date(),
      },
    });
    await this.intentosLoginService.registrar({
      email: numero,
      userId: user.id,
      exitoso: true,
      ip,
      userAgent,
    });

    // estado del PIN (aviso 25 días / obligar cambio) — antes de firmar: alimenta el claim rpc
    const estado = this.estadoPin(user as unknown as users);

    const { accessToken, refreshToken, session } = await this.authService.crearSesionYTokens(
      { id: user.id, email: user.email },
      ip,
      userAgent,
      // el temporal/vencido viaja como claim rpc: el guard lo bloquea en TODO
      // salvo pin/cambio|estado, logout y profile (PR #18 #4)
      { requierePinCambio: estado.requiereCambio, pwaPin: true },
    );

    const profile = await this.authService.getProfile(user.id);

    await this.auditService.log({
      action: AuditAction.LOGIN_EXITOSO,
      entityType: 'sessions',
      entityId: session.id,
      result: AuditResult.SUCCESS,
      actorUserId: user.id,
      actorType: 'USER',
      actorRole: 'autenticado',
      sessionId: session.id,
      ipAddress: ip,
      userAgent,
      newValue: { modo: 'login-pin', numeroEmpleado: numero, userId: user.id },
    });

    return {
      accessToken,
      refreshToken,
      user: profile,
      session: { id: session.id, iniciadaEn: session.iniciadaEn.toISOString(), expiraEn: session.expiraEn.toISOString() },
      pinEstado: estado,
    };
  }

  /** Cambio de PIN propio: reautentica, valida, cierra OTRAS sesiones (§6.6-6). */
  async cambiarPin(dto: PinCambioDto, userId: string, sessionId: string, ip?: string, userAgent?: string) {
    const user = (await this.prisma.users.findUnique({
      where: { id: userId },
      select: { ...PIN_SELECT, email: true },
    })) as UserPin & { email: string } | null;

    if (!user || !user.pin_hash) {
      throw new UnauthorizedException();
    }

    const actualOk = await bcrypt.compare(normalizarPin(dto.pinActual), user.pin_hash);
    if (!actualOk) {
      await this.fallirCambio(user.id, 'PIN_INVALIDO', ip, userAgent);
      throw new BadRequestException('El PIN actual es incorrecto');
    }

    const hashesAnteriores = [
      ...(Array.isArray(user.pin_historial) ? (user.pin_historial as string[]) : []),
      user.pin_hash,
    ];
    const validacion = await validarPinNuevo(dto.pinNuevo, user.numero_empleado, hashesAnteriores);
    if (!validacion.valido) {
      await this.fallirCambio(user.id, validacion.errorCode!, ip, userAgent);
      throw new BadRequestException(this.mensajePin(validacion.errorCode!));
    }

    const nuevoHash = await bcrypt.hash(normalizarPin(dto.pinNuevo), SALT_ROUNDS);
    const historial = [...hashesAnteriores].slice(-3); // últimos 3 (sin el nuevo)

    await this.prisma.$transaction(async (tx) => {
      await tx.users.update({
        where: { id: user.id },
        data: {
          pin_hash: nuevoHash,
          pin_temporal_hasta: null,
          pin_cambiado_en: new Date(),
          pin_historial: historial,
          intentos_pin: 0,
          cuenta_bloqueada_en: null,
        },
      });
      // cierra las OTRAS sesiones (spec §6.6-6) — la maquinaria sessions/refresh_tokens
      const otras = await tx.sessions.findMany({
        where: { user_id: user.id, activa: true, id: { not: sessionId } },
        select: { id: true },
      });
      if (otras.length > 0) {
        await tx.sessions.updateMany({
          where: { id: { in: otras.map((s) => s.id) } },
          data: { activa: false },
        });
        await tx.refresh_tokens.updateMany({
          where: { session_id: { in: otras.map((s) => s.id) } },
          data: { activo: false, revocado_en: new Date(), motivo_revocado: 'Cambio de PIN' },
        });
      }
    });

    await this.auditService.log({
      action: AuditAction.PIN_CAMBIADO,
      entityType: 'users',
      entityId: user.id,
      result: AuditResult.SUCCESS,
      actorUserId: user.id,
      actorType: 'USER',
      actorRole: 'autenticado',
      sessionId,
      ipAddress: ip,
      userAgent,
      previousValue: { pinCambiadoEn: user.pin_cambiado_en?.toISOString() ?? null },
      newValue: { sesionesOtrasCerradas: true, pinCambiadoEn: new Date().toISOString() },
    });

    return { message: 'PIN actualizado. Tus otras sesiones fueron cerradas' };
  }

  /** Fallo de jerarquía (review PR #18 #5): a un Administrador solo lo toca otro Administrador. */
  private async fallirJerarquia(
    action: AuditAction,
    targetId: string,
    actorId: string,
    ip?: string,
    userAgent?: string,
  ): Promise<never> {
    await this.auditService.logFailure({
      action,
      entityType: 'users',
      entityId: targetId,
      actorUserId: actorId,
      actorType: 'USER',
      actorRole: 'autenticado',
      errorCode: 'JERARQUIA_INSUFICIENTE',
      ipAddress: ip,
      userAgent,
    });
    throw new ForbiddenException(
      'Solo otro Administrador puede reiniciar o desbloquear la cuenta de un Administrador',
    );
  }

  /** ¿El usuario tiene el rol Administrador activo? (jerarquía de reinicio/desbloqueo) */
  private async esAdministrador(userId: string): Promise<boolean> {
    const r = await this.prisma.users_roles.findFirst({
      where: { user_id: userId, activo: true, roles: { nombre: 'Administrador', activo: true } },
      select: { id: true },
    });
    return !!r;
  }

  /** Reinicio por mesa de ayuda: temporal de 24 h + cierre de TODAS las sesiones (§6.8). */
  async reiniciarPin(userId: string, actorUserId: string, ip?: string, userAgent?: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { ...PIN_SELECT, email: true },
    });
    if (!user || !user.activo) {
      return this.fallirAdmin(
        AuditAction.PIN_REINICIADO,
        userId,
        actorUserId,
        'USUARIO_NO_ENCONTRADO',
        ip,
        userAgent,
      );
    }

    // Jerarquía (PR #18 #5): un no-administrador no puede fabricarse el acceso de un Administrador.
    if ((await this.esAdministrador(userId)) && !(await this.esAdministrador(actorUserId))) {
      return this.fallirJerarquia(AuditAction.PIN_REINICIADO, userId, actorUserId, ip, userAgent);
    }

    const temporal = generarPinTemporal();
    const temporalHash = await bcrypt.hash(temporal, SALT_ROUNDS);
    const temporalHasta = new Date(Date.now() + PIN_TEMPORAL_HORAS * 60 * 60 * 1000);

    await this.prisma.$transaction(async (tx) => {
      await tx.users.update({
        where: { id: user.id },
        data: {
          pin_hash: temporalHash,
          pin_temporal_hasta: temporalHasta,
          pin_cambiado_en: new Date(),
          intentos_pin: 0,
          cuenta_bloqueada_en: null,
        },
      });
      // TODAS las sesiones del usuario se cierran (el PIN quedó comprometido)
      await tx.sessions.updateMany({
        where: { user_id: user.id, activa: true },
        data: { activa: false },
      });
      await tx.refresh_tokens.updateMany({
        where: { sessions: { user_id: user.id } },
        data: { activo: false, revocado_en: new Date(), motivo_revocado: 'Reinicio de PIN' },
      });
    });

    await this.auditService.log({
      action: AuditAction.PIN_REINICIADO,
      entityType: 'users',
      entityId: user.id,
      result: AuditResult.SUCCESS,
      actorUserId,
      actorType: 'USER',
      actorRole: 'autenticado',
      ipAddress: ip,
      userAgent,
      newValue: { temporalHasta: temporalHasta.toISOString() },
    });

    // el temporal se entrega UNA VEZ al ejecutante (nunca vuelve a mostrarse)
    return { message: 'PIN temporal generado (vence en 24 horas)', pinTemporal: temporal };
  }

  /** Desbloqueo por mesa de ayuda (§6.7). */
  async desbloquear(userId: string, actorUserId: string, ip?: string, userAgent?: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, cuenta_bloqueada_en: true, activo: true },
    });
    if (!user || !user.activo) {
      return this.fallirAdmin(
        AuditAction.CUENTA_DESBLOQUEADA,
        userId,
        actorUserId,
        'USUARIO_NO_ENCONTRADO',
        ip,
        userAgent,
      );
    }

    // Misma jerarquía que el reinicio (PR #18 #5).
    if ((await this.esAdministrador(userId)) && !(await this.esAdministrador(actorUserId))) {
      return this.fallirJerarquia(AuditAction.CUENTA_DESBLOQUEADA, userId, actorUserId, ip, userAgent);
    }

    await this.prisma.users.update({
      where: { id: user.id },
      data: { cuenta_bloqueada_en: null, intentos_pin: 0 },
    });

    await this.auditService.log({
      action: AuditAction.CUENTA_DESBLOQUEADA,
      entityType: 'users',
      entityId: user.id,
      result: AuditResult.SUCCESS,
      actorUserId,
      actorType: 'USER',
      actorRole: 'autenticado',
      ipAddress: ip,
      userAgent,
      previousValue: { bloqueada: !!user.cuenta_bloqueada_en },
      newValue: { bloqueada: false },
    });

    return { message: 'Cuenta desbloqueada' };
  }

  /** Estado del PIN para la app móvil: aviso a los 25 días + bloqueo si venció. */
  estadoPin(user: users) {
    const pinCambiadoEn = user.pin_cambiado_en ?? null;
    const diasDesdeCambio = pinCambiadoEn
      ? Math.floor((Date.now() - pinCambiadoEn.getTime()) / 86_400_000)
      : null;
    const diasRestantes = diasDesdeCambio == null ? null : Math.max(0, PIN_CADUCIDAD_DIAS - diasDesdeCambio);
    const temporalActivo = !!user.pin_temporal_hasta && user.pin_temporal_hasta.getTime() > Date.now();
    const vencido =
      diasDesdeCambio != null && diasDesdeCambio >= PIN_CADUCIDAD_DIAS;

    return {
      temporalActivo,
      temporalHasta: user.pin_temporal_hasta?.toISOString() ?? null,
      pinCambiadoEn: pinCambiadoEn?.toISOString() ?? null,
      diasDesdeCambio,
      diasRestantes,
      avisar: diasRestantes != null && diasRestantes <= PIN_CADUCIDAD_DIAS - PIN_AVISO_DIAS,
      vencido,
      // bloqueo TEMPORAL: cuenta solo si la ventana de 15 min sigue viva (PR #18 #3)
      bloqueada:
        !!user.cuenta_bloqueada_en &&
        Date.now() - user.cuenta_bloqueada_en.getTime() < PIN_BLOQUEO_MINUTOS * 60_000,
      // el temporal cuenta como "debe cambiar" (primer ingreso, paso 3 del ciclo)
      requiereCambio: temporalActivo || vencido,
    };
  }

  /** Estado self para el endpoint GET /auth/pin/estado. */
  async estado(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { ...PIN_SELECT },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.estadoPin(user as unknown as users);
  }

  // ── helpers privados ──────────────────────────────────────────

  private mensajePin(errorCode: string): string {
    switch (errorCode) {
      case 'PIN_SECUENCIA':
        return 'El PIN no debe tener caracteres repetidos ni secuencias (ej. AAA, ABC, 123)';
      case 'PIN_DEBIL':
        return 'El PIN debe tener al menos 1 letra y 1 número';
      case 'PIN_CONTIENE_EMPLEADO':
        return 'El PIN no debe contener tu número de empleado';
      case 'PIN_REPETIDO':
        return 'El PIN debe ser distinto a tus últimos 3 PINs';
      default:
        return 'El PIN no cumple las reglas';
    }
  }

  /**
   * Fallo de login-pin completo: bitácora intentos_login (alimenta el conteo
   * por IP del BloqueoService) + audit LOGIN_FALLIDO. Misma maquinaria del
   * login por email (PR #18 #3).
   */
  private async registrarFalloPin(
    numeroEmpleado: string,
    userId: string | undefined,
    errorCode: string,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.intentosLoginService.registrar({
      email: numeroEmpleado,
      userId,
      exitoso: false,
      motivoFallo: errorCode,
      ip,
      userAgent,
    });
    if (ip) {
      await this.bloqueoService.registrarIntentoFallidoPorIP(ip);
    }
    await this.fallirLogin(numeroEmpleado, errorCode, ip, userAgent);
  }

  /** FAIL de login-pin (los LOGIN_FALLIDO comparten shape con el login de email). */
  private async fallirLogin(
    numeroEmpleado: string,
    errorCode: string,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.auditService.logFailure({
      action: AuditAction.LOGIN_FALLIDO,
      entityType: 'users',
      entityId: '',
      actorType: 'USER',
      actorRole: 'sin_autenticar',
      errorCode,
      ipAddress: ip,
      userAgent,
      metadata: { modo: 'login-pin', numeroEmpleado },
    });
  }

  /** FAIL de cambio propio. */
  private async fallirCambio(
    userId: string,
    errorCode: string,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.auditService.logFailure({
      action: AuditAction.PIN_CAMBIADO,
      entityType: 'users',
      entityId: userId,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      errorCode,
      ipAddress: ip,
      userAgent,
    });
  }

  /** FAIL de reinicio/desbloqueo (acciones de mesa de ayuda). */
  private async fallirAdmin(
    action: AuditAction,
    userId: string,
    actorUserId: string,
    errorCode: string,
    ip?: string,
    userAgent?: string,
  ): Promise<never> {
    await this.auditService.logFailure({
      action,
      entityType: 'users',
      entityId: userId,
      actorUserId,
      actorType: 'USER',
      actorRole: 'autenticado',
      errorCode,
      ipAddress: ip,
      userAgent,
    });
    throw new NotFoundException('Usuario no encontrado o inactivo');
  }
}
