import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { BloqueoService } from '../bloqueo/bloqueo.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse, JwtPayload } from './types/auth.types';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly bloqueoService: BloqueoService,
  ) {}

  /**
   * Login: valida credenciales, crea sesión y retorna tokens.
   */
  async login(
    dto: LoginDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    // 1. Buscar usuario por email
    const user = await this.prisma.users.findUnique({
      where: { email: dto.email },
      include: {
        personas_users_persona_idTopersonas: {
          select: {
            nombre: true,
            apellido_paterno: true,
            apellido_materno: true,
            correo: true,
          },
        },
      },
    });

    if (!user || !user.activo || user.eliminado_en) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Verificar si está bloqueado
    const bloqueo = await this.bloqueoService.verificarBloqueo(user.id);
    if (bloqueo.bloqueado) {
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
      expiresIn: ACCESS_TOKEN_EXPIRY,
      secret: process.env.JWT_ACCESS_SECRET || 'svr-erp-access-secret-dev',
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
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

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        persona: user.personas_users_persona_idTopersonas,
      },
      session: {
        id: session.id,
        iniciadaEn: session.iniciada_en,
        expiraEn: session.expira_en,
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

    const accessJti = randomUUID();

    const accessToken = this.jwtService.sign(
      { sub: userId, email: user!.email, jti: accessJti, tipo: 'access' },
      {
        expiresIn: ACCESS_TOKEN_EXPIRY,
        secret: process.env.JWT_ACCESS_SECRET || 'svr-erp-access-secret-dev',
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: userId,
        email: user!.email,
        jti: newRefreshJti,
        tipo: 'refresh',
      },
      {
        expiresIn: REFRESH_TOKEN_EXPIRY,
        secret: process.env.JWT_REFRESH_SECRET || 'svr-erp-refresh-secret-dev',
      },
    );

    this.logger.log(`Token rotado para usuario ${userId}`);

    return { accessToken, refreshToken };
  }

  /**
   * Logout: cierra sesión y revoca tokens.
   */
  async logout(userId: string, refreshJti?: string): Promise<void> {
    // Cerrar todas las sesiones activas del usuario (o una específica)
    const whereClause: Record<string, unknown> = {
      user_id: userId,
      activa: true,
    };

    if (refreshJti) {
      whereClause.refresh_token_jti = refreshJti;
    }

    await this.prisma.sessions.updateMany({
      where: whereClause,
      data: {
        activa: false,
        cerrada_en: new Date(),
        motivo_cierre: 'Logout manual',
        actualizado_en: new Date(),
      },
    });

    // Revocar refresh tokens activos de esas sesiones
    await this.prisma.refresh_tokens.updateMany({
      where: {
        sessions: { user_id: userId },
        activo: true,
      },
      data: {
        revocado_en: new Date(),
        motivo_revocado: 'Logout',
        activo: false,
      },
    });

    this.logger.log(`Logout exitoso: usuario ${userId}`);
  }

  /**
   * Obtiene el perfil del usuario con roles, vistas y permisos.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
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
      },
    });

    if (!user) return null;

    // Aplanar roles
    const roles = user.users_roles_users_roles_user_idTousers.map((ur) => ({
      id: ur.roles.id,
      nombre: ur.roles.nombre,
      nivel: ur.roles.nivel,
      es_principal: ur.es_principal,
    }));

    // Aplanar vistas (deduplicadas por vista_id, con OR lógico)
    const vistasMap = new Map<
      string,
      {
        id: string;
        nombre: string;
        ruta: string;
        icono: string | null;
        orden: number;
        puede_ver: boolean;
        puede_crear: boolean;
        puede_editar: boolean;
        puede_eliminar: boolean;
        puede_exportar: boolean;
      }
    >();

    user.users_roles_users_roles_user_idTousers.forEach((ur) => {
      ur.roles.role_vistas.forEach((rv) => {
        const existing = vistasMap.get(rv.vista_id);
        if (!existing) {
          vistasMap.set(rv.vista_id, {
            id: rv.vistas.id,
            nombre: rv.vistas.nombre,
            ruta: rv.vistas.ruta,
            icono: rv.vistas.icono,
            orden: rv.vistas.orden,
            puede_ver: rv.puede_ver,
            puede_crear: rv.puede_crear,
            puede_editar: rv.puede_editar,
            puede_eliminar: rv.puede_eliminar,
            puede_exportar: rv.puede_exportar,
          });
        } else {
          existing.puede_ver = existing.puede_ver || rv.puede_ver;
          existing.puede_crear = existing.puede_crear || rv.puede_crear;
          existing.puede_editar = existing.puede_editar || rv.puede_editar;
          existing.puede_eliminar =
            existing.puede_eliminar || rv.puede_eliminar;
          existing.puede_exportar =
            existing.puede_exportar || rv.puede_exportar;
        }
      });
    });

    const vistas = Array.from(vistasMap.values()).sort(
      (a, b) => a.orden - b.orden,
    );

    // Aplanar permisos (deduplicados)
    const permisosSet = new Set<string>();
    user.users_roles_users_roles_user_idTousers.forEach((ur) => {
      ur.roles.role_permissions.forEach((rp) => {
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
      persona: user.personas_users_persona_idTopersonas,
      roles,
      vistas,
      permisos,
    };
  }
}
