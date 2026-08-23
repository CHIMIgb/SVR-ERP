import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../types/auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'svr-erp-access-secret-dev',
    });
  }

  async validate(payload: JwtPayload): Promise<{
    id: string;
    email: string;
    jti: string;
    sessionId?: string;
  }> {
    // 1. Verificar que el access token no esté en la blacklist (revocado por logout)
    const blacklisted = await this.prisma.token_blacklist.findUnique({
      where: { jti: payload.jti },
    });

    if (blacklisted) {
      throw new UnauthorizedException('Token de acceso revocado');
    }

    // 2. Verificar que el usuario exista y esté activo
    const user = await this.prisma.users.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, activo: true, eliminado_en: true },
    });

    if (!user || !user.activo || user.eliminado_en) {
      throw new UnauthorizedException('Usuario no válido o deshabilitado');
    }

    return {
      id: user.id,
      email: user.email,
      jti: payload.jti,
      sessionId: payload.sessionId,
    };
  }
}
