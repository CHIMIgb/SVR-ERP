import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface RegistrarIntentoParams {
  email: string;
  userId?: string;
  exitoso: boolean;
  motivoFallo?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class IntentosLoginService {
  private readonly logger = new Logger(IntentosLoginService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra un intento de login/logout en la bitácora.
   * No lanza errores — es fire-and-forget para no bloquear la autenticación.
   */
  async registrar(params: RegistrarIntentoParams): Promise<void> {
    try {
      await this.prisma.intentos_login.create({
        data: {
          id: randomUUID(),
          user_id: params.userId || null,
          email_intentado: params.email,
          exitoso: params.exitoso,
          motivo_fallo: params.motivoFallo || null,
          ip_address: params.ip || null,
          user_agent: params.userAgent || null,
        },
      });

      this.logger.debug(
        `Intento registrado: ${params.email} | éxito=${params.exitoso} | ip=${params.ip || 'N/A'}`,
      );
    } catch (error) {
      // No bloquear la autenticación si falla el logging
      this.logger.warn(
        `Error al registrar intento de login para ${params.email}: ${error}`,
      );
    }
  }

  /**
   * Cuenta los intentos fallidos recientes de un email.
   * Útil para detectar fuerza bruta antes de llegar al bloqueo.
   */
  async contarFallidosRecientes(
    email: string,
    minutos: number = 15,
  ): Promise<number> {
    const desde = new Date(Date.now() - minutos * 60000);

    const count = await this.prisma.intentos_login.count({
      where: {
        email_intentado: email,
        exitoso: false,
        creado_en: { gte: desde },
      },
    });

    return count;
  }

  /**
   * Obtiene los últimos intentos de un usuario por su ID.
   */
  async buscarPorUsuario(userId: string, limit: number = 20) {
    return this.prisma.intentos_login.findMany({
      where: { user_id: userId },
      orderBy: { creado_en: 'desc' },
      take: limit,
      select: {
        id: true,
        email_intentado: true,
        exitoso: true,
        motivo_fallo: true,
        ip_address: true,
        user_agent: true,
        creado_en: true,
      },
    });
  }

  /**
   * Obtiene los últimos intentos por email (incluso si el usuario no existe).
   */
  async buscarPorEmail(email: string, limit: number = 20) {
    return this.prisma.intentos_login.findMany({
      where: { email_intentado: email },
      orderBy: { creado_en: 'desc' },
      take: limit,
      select: {
        id: true,
        email_intentado: true,
        exitoso: true,
        motivo_fallo: true,
        ip_address: true,
        user_agent: true,
        creado_en: true,
      },
    });
  }
}
