import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../types/auth.types';

/** req.user — disponible para guards, interceptores y controllers. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  /** Nombre completo desde la persona vinculada (para auditoría). */
  nombre?: string;
  jti: string;
  sessionId?: string;
  /** Claim del token: debe crear su PIN propio antes de usar el resto de la API (PR #18 #4). */
  requierePinCambio?: boolean;
  /** "Issued at" del token (epoch segundos) — para trazabilidad en auditoría. */
  iat?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    // El check de presencia/corte lo hace main.ts antes de arrancar la app.
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET!,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // 1. Verificar que el access token no esté en la blacklist (revocado por logout)
    const blacklisted = await this.prisma.token_blacklist.findUnique({
      where: { jti: payload.jti },
    });

    if (blacklisted) {
      throw new UnauthorizedException('Token de acceso revocado');
    }

    // 2. Verificar que el usuario exista y esté activo (con nombre de su persona)
    const user = await this.prisma.users.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        activo: true,
        eliminado_en: true,
        personas_users_persona_idTopersonas: {
          select: { nombre: true, apellido_paterno: true, apellido_materno: true },
        },
      },
    });

    if (!user || !user.activo || user.eliminado_en) {
      throw new UnauthorizedException('Usuario no válido o deshabilitado');
    }

    // 3. Nombre completo para trazabilidad de auditoría
    const p = user.personas_users_persona_idTopersonas;
    const nombre = [p?.nombre, p?.apellido_paterno, p?.apellido_materno]
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      id: user.id,
      email: user.email,
      nombre: nombre || undefined,
      jti: payload.jti,
      sessionId: payload.sessionId,
      ...(payload.rpc === true && { requierePinCambio: true }),
      iat: payload.iat,
    };
  }
}
