import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../types/auth.types';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET || 'svr-erp-refresh-secret-dev',
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: JwtPayload,
  ): Promise<{ id: string; jti: string }> {
    // Verificar que el refresh token no esté en blacklist
    const blacklisted = await this.prisma.token_blacklist.findUnique({
      where: { jti: payload.jti },
    });

    if (blacklisted) {
      throw new UnauthorizedException('Token de refresco revocado');
    }

    // Verificar que la sesión esté activa
    const session = await this.prisma.sessions.findFirst({
      where: {
        user_id: payload.sub,
        activa: true,
        refresh_token_jti: payload.jti,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Sesión no válida o cerrada');
    }

    return { id: payload.sub, jti: payload.jti };
  }
}
