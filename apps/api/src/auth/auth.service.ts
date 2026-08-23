import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BloqueoService } from '../bloqueo/bloqueo.service';
import { IntentosLoginService } from './intentos-login.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse, JwtPayload } from './types/auth.types';

const ACCESS_TOKEN_EXPIRY_SECONDS = parseInt(
  process.env.ACCESS_TOKEN_EXPIRY_SECONDS || '900',
  10,
); // 900s = 15min
const REFRESH_TOKEN_EXPIRY_SECONDS = parseInt(
  process.env.REFRESH_TOKEN_EXPIRY_SECONDS || '604800',
  10,
); // 604800s = 7d
const REFRESH_TOKEN_EXPIRY_DAYS = REFRESH_TOKEN_EXPIRY_SECONDS / 86400;
const SALT_ROUNDS = 12;

const USER_INCLUDE = {
  personas_users_persona_idTopersonas: {
    select: {
      nombre: true,
      apellido_paterno: true,
      apellido_materno: true,
      correo: true,
      telefono: true,
    },
  },
  users_roles_users_roles_user_idTousers: {
    where: { activo: true },
    include: {
      roles: {
        include: {
          role_vistas: {
            where: { activo: true },
            include: { vistas: true },
          },
          role_permissions: {
            include: { permissions: true },
          },
        },
      },
    },
  },
} as const;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly bloqueoService: BloqueoService,
    private readonly intentosLoginService: IntentosLoginService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Login: valida credenciales, crea sesión y retorna tokens.
   */
  async login(
    dto: LoginDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    // 0. Verificar si la IP está bloqueada
    if (ip) {
      const ipBloqueada = await this.bloqueoService.verificarBloqueoPorIP(ip);
      if (ipBloqueada.bloqueado) {
        await this.intentosLoginService.registrar({
          email: dto.email,
          exitoso: false,
          motivoFallo: `IP bloqueada (${ipBloqueada.minutosRestantes} min restantes)`,
          ip,
          userAgent,
        });

        await this.auditService.logFailure({
          action: AuditAction.LOGIN_FALLIDO,
          entityType: 'users',
          entityId: '',
          errorCode: 'IP_BLOCKED',
          actorRole: 'sin_autenticar',
          ipAddress: ip,
          userAgent,
          metadata: {
            email: dto.email,
            minutosRestantes: ipBloqueada.minutosRestantes,
          },
        });

        throw new UnauthorizedException(
          `Demasiados intentos desde esta IP. Intenta de nuevo en ${ipBloqueada.minutosRestantes} minuto(s)`,
        );
      }
    }

    // 1. Buscar usuario por email
    const user = await this.prisma.users.findUnique({
      where: { email: dto.email },
      include: USER_INCLUDE,
    });

    if (!user || !user.activo || user.eliminado_en) {
      await this.intentosLoginService.registrar({
        email: dto.email,
        exitoso: false,
        motivoFallo: !user
          ? 'Usuario no encontrado'
          : !user.activo
            ? 'Usuario desactivado'
            : 'Usuario eliminado',
        ip,
        userAgent,
      });

      // Si la IP existe, también contamos este fallo para el bloqueo por IP
      if (ip) {
        await this.bloqueoService.registrarIntentoFallidoPorIP(ip);
      }

      await this.auditService.logFailure({
        action: AuditAction.LOGIN_FALLIDO,
        entityType: 'users',
        entityId: user?.id ?? '',
        actorUserId: user?.id,
        actorRole: 'sin_autenticar',
        errorCode: !user ? 'USER_NOT_FOUND' : !user.activo ? 'USER_INACTIVE' : 'USER_DELETED',
        ipAddress: ip,
        userAgent,
        metadata: { email: dto.email },
      });

      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Verificar si está bloqueado
    const bloqueo = await this.bloqueoService.verificarBloqueo(user.id);
    if (bloqueo.bloqueado) {
      await this.intentosLoginService.registrar({
        email: dto.email,
        userId: user.id,
        exitoso: false,
        motivoFallo: `Cuenta bloqueada (${bloqueo.minutosRestantes} min restantes)`,
        ip,
        userAgent,
      });

      await this.auditService.logFailure({
        action: AuditAction.LOGIN_FALLIDO,
        entityType: 'users',
        entityId: user.id,
        actorUserId: user.id,
        actorRole: 'sin_autenticar',
        errorCode: 'ACCOUNT_LOCKED',
        ipAddress: ip,
        userAgent,
        metadata: { email: dto.email, minutosRestantes: bloqueo.minutosRestantes },
      });

      throw new UnauthorizedException(
        `Cuenta bloqueada. Intenta de nuevo en ${bloqueo.minutosRestantes} minuto(s)`,
      );
    }

    // 3. Verificar password
    const passwordValido = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );

    if (!passwordValido) {
      const resultado = await this.bloqueoService.registrarIntentoFallido(
        user.id,
        ip,
      );

      await this.intentosLoginService.registrar({
        email: dto.email,
        userId: user.id,
        exitoso: false,
        motivoFallo: resultado.bloqueado
          ? `Contraseña incorrecta — cuenta bloqueada por ${resultado.minutosBloqueo} min`
          : `Contraseña incorrecta — ${resultado.intentosRestantes} intento(s) restante(s)`,
        ip,
        userAgent,
      });

      await this.auditService.logFailure({
        action: AuditAction.LOGIN_FALLIDO,
        entityType: 'users',
        entityId: user.id,
        actorUserId: user.id,
        actorRole: 'sin_autenticar',
        errorCode: resultado.bloqueado ? 'ACCOUNT_NOW_LOCKED' : 'INVALID_PASSWORD',
        ipAddress: ip,
        userAgent,
        metadata: {
          email: dto.email,
          intentosRestantes: resultado.intentosRestantes,
          bloqueado: resultado.bloqueado,
        },
      });

      if (resultado.bloqueado) {
        throw new UnauthorizedException(
          `Cuenta bloqueada por ${resultado.minutosBloqueo} minutos tras múltiples intentos fallidos`,
        );
      }

      throw new UnauthorizedException(
        `Credenciales inválidas. Te quedan ${resultado.intentosRestantes} intento(s)`,
      );
    }

    // 4. Login exitoso — resetear intentos
    await this.bloqueoService.resetearIntentos(user.id);

    await this.intentosLoginService.registrar({
      email: dto.email,
      userId: user.id,
      exitoso: true,
      ip,
      userAgent,
    });

    // 5. Crear sesión
    const accessJti = randomUUID();
    const refreshJti = randomUUID();

    const session = await this.prisma.sessions.create({
      data: {
        id: randomUUID(),
        user_id: user.id,
        refresh_token_jti: refreshJti,
        ip_address: ip || null,
        user_agent: userAgent || null,
        expira_en: new Date(
          Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
        ),
        actualizado_en: new Date(),
      },
    });

    // 6. Guardar refresh token en BD
    const refreshTokenHash = await bcrypt.hash(refreshJti, SALT_ROUNDS);
    await this.prisma.refresh_tokens.create({
      data: {
        id: randomUUID(),
        session_id: session.id,
        jti: refreshJti,
        token_hash: refreshTokenHash,
        expira_en: new Date(
          Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
        ),
      },
    });

    // 7. Generar tokens JWT
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      jti: accessJti,
      tipo: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      jti: refreshJti,
      tipo: 'refresh',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
      secret: process.env.JWT_ACCESS_SECRET || 'svr-erp-access-secret-dev',
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: REFRESH_TOKEN_EXPIRY_SECONDS,
      secret: process.env.JWT_REFRESH_SECRET || 'svr-erp-refresh-secret-dev',
    });

    // 8. Actualizar último login
    await this.prisma.users.update({
      where: { id: user.id },
      data: { ultimo_login: new Date(), actualizado_en: new Date() },
    });

    this.logger.log(
      `Login exitoso: ${user.email} desde IP ${ip || 'desconocida'}`,
    );

    await this.auditService.log({
      action: AuditAction.LOGIN_EXITOSO,
      entityType: 'sessions',
      entityId: session.id,
      result: AuditResult.SUCCESS,
      actorUserId: user.id,
      actorRole: 'autenticado',
      sessionId: session.id,
      ipAddress: ip,
      userAgent,
      newValue: { sessionId: session.id, userId: user.id, email: user.email },
    });

    return {
      accessToken,
      refreshToken,
      user: this.buildUserProfile(user),
      session: {
        id: session.id,
        iniciadaEn: session.iniciada_en.toISOString(),
        expiraEn: session.expira_en.toISOString(),
      },
    };
  }

  /**
   * Registro: crea persona + user + rol por defecto.
   */
  async register(
    dto: RegisterDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    // 1. Verificar que el email no esté en uso
    const existente = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (existente) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    // 2. Hash del password
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    // 3. Crear persona + user en transacción
    const result = await this.prisma.$transaction(async (tx) => {
      const personaId = randomUUID();
      const persona = await tx.personas.create({
        data: {
          id: personaId,
          nombre: dto.nombre,
          apellido_paterno: dto.apellido_paterno || null,
          apellido_materno: dto.apellido_materno || null,
          correo: dto.email,
          telefono: dto.telefono || null,
          actualizado_en: new Date(),
        },
      });

      const userId = randomUUID();
      const user = await tx.users.create({
        data: {
          id: userId,
          persona_id: personaId,
          email: dto.email,
          password_hash: passwordHash,
          actualizado_en: new Date(),
        },
      });

      // Asignar rol "Administrador" por defecto
      const adminRole = await tx.roles.findFirst({
        where: { nombre: 'Administrador', activo: true },
      });

      if (adminRole) {
        await tx.users_roles.create({
          data: {
            id: randomUUID(),
            user_id: userId,
            rol_id: adminRole.id,
            es_principal: true,
          },
        });
      }

      return { persona, user };
    });

    this.logger.log(`Registro exitoso: ${dto.email}`);

    // 4. Login automático después del registro
    return this.login(
      { email: dto.email, password: dto.password },
      ip,
      userAgent,
    );
  }

  /**
   * Refresh: rota el refresh token y genera nuevo access token.
   */
  async refresh(
    userId: string,
    oldRefreshJti: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // 1. Buscar la sesión activa con ese refresh token
    const session = await this.prisma.sessions.findFirst({
      where: {
        user_id: userId,
        activa: true,
        refresh_token_jti: oldRefreshJti,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Sesión no válida o cerrada');
    }

    // 2. Buscar el refresh token en BD
    const oldRefreshToken = await this.prisma.refresh_tokens.findFirst({
      where: {
        session_id: session.id,
        jti: oldRefreshJti,
        activo: true,
      },
    });

    if (!oldRefreshToken || oldRefreshToken.revocado_en) {
      throw new UnauthorizedException('Token de refresco revocado o inválido');
    }

    // 3. Rotar: crear nuevo refresh token
    const newRefreshJti = randomUUID();
    const newRefreshHash = await bcrypt.hash(newRefreshJti, SALT_ROUNDS);

    await this.prisma.$transaction(async (tx) => {
      // Marcar el token viejo como usado
      await tx.refresh_tokens.update({
        where: { id: oldRefreshToken.id },
        data: {
          usado_en: new Date(),
          activo: false,
        },
      });

      // Blacklistear el refresh token viejo (rotado = ya no válido)
      await tx.token_blacklist.create({
        data: {
          id: randomUUID(),
          jti: oldRefreshJti,
          token_hash: oldRefreshToken.token_hash,
          tipo: 'refresh',
          user_id: userId,
          razon: 'Rotación de token',
          expira_en: oldRefreshToken.expira_en,
        },
      });

      // Crear nuevo refresh token
      await tx.refresh_tokens.create({
        data: {
          id: randomUUID(),
          session_id: session.id,
          jti: newRefreshJti,
          token_hash: newRefreshHash,
          expira_en: new Date(
            Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
          ),
        },
      });

      // Actualizar sesión con nuevo JTI
      await tx.sessions.update({
        where: { id: session.id },
        data: {
          refresh_token_jti: newRefreshJti,
          ultima_actividad: new Date(),
          actualizado_en: new Date(),
        },
      });
    });

    // 4. Generar nuevos tokens
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const accessJti = randomUUID();

    const accessToken = this.jwtService.sign(
      { sub: userId, email: user.email, jti: accessJti, tipo: 'access' },
      {
        expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
        secret: process.env.JWT_ACCESS_SECRET || 'svr-erp-access-secret-dev',
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: userId,
        email: user.email,
        jti: newRefreshJti,
        tipo: 'refresh',
      },
      {
        expiresIn: REFRESH_TOKEN_EXPIRY_SECONDS,
        secret: process.env.JWT_REFRESH_SECRET || 'svr-erp-refresh-secret-dev',
      },
    );

    this.logger.log(`Token rotado para usuario ${userId}`);

    return { accessToken, refreshToken };
  }

  /**
   * Logout: cierra SOLO la sesión actual del usuario (identificada por el JTI del access token)
   * y escribe el access token a la blacklist para invalidarlo inmediatamente.
   */
  async logout(
    userId: string,
    accessJti: string,
    accessTokenHash: string,
  ): Promise<void> {
    // 1. Encontrar la sesión activa más reciente del usuario
    //    (el access token actual pertenece a alguna sesión activa)
    const session = await this.prisma.sessions.findFirst({
      where: { user_id: userId, activa: true },
      orderBy: { iniciada_en: 'desc' },
    });

    if (session) {
      // 2. Cerrar solo ESA sesión
      await this.prisma.sessions.update({
        where: { id: session.id },
        data: {
          activa: false,
          cerrada_en: new Date(),
          motivo_cierre: 'Logout manual',
          actualizado_en: new Date(),
        },
      });

      // 3. Revocar los refresh tokens de ESA sesión
      await this.prisma.refresh_tokens.updateMany({
        where: { session_id: session.id, activo: true },
        data: {
          revocado_en: new Date(),
          motivo_revocado: 'Logout',
          activo: false,
        },
      });
    }

    // 4. Blacklistear el access token actual (invalidación inmediata)
    if (accessJti && accessTokenHash) {
      await this.prisma.token_blacklist.create({
        data: {
          id: randomUUID(),
          jti: accessJti,
          token_hash: accessTokenHash,
          tipo: 'access',
          user_id: userId,
          razon: 'Logout manual',
          expira_en: new Date(
            Date.now() + ACCESS_TOKEN_EXPIRY_SECONDS * 1000,
          ),
        },
      });
    }

    this.logger.log(
      `Logout exitoso: usuario ${userId}, sesión ${session?.id ?? 'desconocida'}`,
    );

    await this.auditService.log({
      action: AuditAction.LOGOUT,
      entityType: 'sessions',
      entityId: userId,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorRole: 'autenticado',
      metadata: { motivo: 'Logout manual', sessionId: session?.id },
    });
  }

  /**
   * Obtiene el perfil del usuario con roles, vistas y permisos.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: USER_INCLUDE,
    });

    if (!user) return null;

    return this.buildUserProfile(user);
  }

  /**
   * Construye el objeto de perfil en camelCase a partir del raw user de Prisma.
   */
  private buildUserProfile(user: any): AuthResponse['user'] {
    const roles = user.users_roles_users_roles_user_idTousers.map((ur: any) => ({
      id: ur.roles.id,
      nombre: ur.roles.nombre,
      nivel: ur.roles.nivel,
      esPrincipal: ur.es_principal,
    }));

    const vistasMap = new Map<
      string,
      {
        id: string;
        nombre: string;
        ruta: string;
        icono: string | null;
        orden: number;
        puedeVer: boolean;
        puedeCrear: boolean;
        puedeEditar: boolean;
        puedeEliminar: boolean;
        puedeExportar: boolean;
      }
    >();

    user.users_roles_users_roles_user_idTousers.forEach((ur: any) => {
      ur.roles.role_vistas.forEach((rv: any) => {
        const existing = vistasMap.get(rv.vista_id);
        if (!existing) {
          vistasMap.set(rv.vista_id, {
            id: rv.vistas.id,
            nombre: rv.vistas.nombre,
            ruta: rv.vistas.ruta,
            icono: rv.vistas.icono,
            orden: rv.vistas.orden,
            puedeVer: rv.puede_ver,
            puedeCrear: rv.puede_crear,
            puedeEditar: rv.puede_editar,
            puedeEliminar: rv.puede_eliminar,
            puedeExportar: rv.puede_exportar,
          });
        } else {
          existing.puedeVer = existing.puedeVer || rv.puede_ver;
          existing.puedeCrear = existing.puedeCrear || rv.puede_crear;
          existing.puedeEditar = existing.puedeEditar || rv.puede_editar;
          existing.puedeEliminar = existing.puedeEliminar || rv.puede_eliminar;
          existing.puedeExportar = existing.puedeExportar || rv.puede_exportar;
        }
      });
    });

    const vistas = Array.from(vistasMap.values()).sort(
      (a, b) => a.orden - b.orden,
    );

    const permisosSet = new Set<string>();
    user.users_roles_users_roles_user_idTousers.forEach((ur: any) => {
      ur.roles.role_permissions.forEach((rp: any) => {
        if (rp.permissions.activo) {
          permisosSet.add(
            `${rp.permissions.modulo}.${rp.permissions.recurso}.${rp.permissions.accion}`,
          );
        }
      });
    });

    const permisos = Array.from(permisosSet).map((p) => {
      const parts = p.split('.');
      return { modulo: parts[0], recurso: parts[1], accion: parts[2] };
    });

    return {
      id: user.id,
      email: user.email,
      activo: user.activo,
      persona: {
        nombre: user.personas_users_persona_idTopersonas.nombre,
        apellidoPaterno:
          user.personas_users_persona_idTopersonas.apellido_paterno,
        apellidoMaterno:
          user.personas_users_persona_idTopersonas.apellido_materno,
        correo: user.personas_users_persona_idTopersonas.correo,
      },
      roles,
      vistas,
      permisos,
    };
  }
}
