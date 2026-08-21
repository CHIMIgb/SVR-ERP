import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const MAX_INTENTOS = 5;

@Injectable()
export class BloqueoService {
  private readonly logger = new Logger(BloqueoService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verifica si un usuario está bloqueado.
   */
  async verificarBloqueo(
    userId: string,
  ): Promise<{ bloqueado: boolean; minutosRestantes?: number }> {
    const bloqueo = await this.prisma.usuarios_bloqueados.findFirst({
      where: {
        user_id: userId,
        activo: true,
        bloqueado_hasta: { gt: new Date() },
      },
      orderBy: { creado_en: 'desc' },
    });

    if (!bloqueo) {
      return { bloqueado: false };
    }

    const ahora = new Date();
    const minutosRestantes = Math.ceil(
      (bloqueo.bloqueado_hasta.getTime() - ahora.getTime()) / 60000,
    );

    return { bloqueado: true, minutosRestantes };
  }

  /**
   * Registra un intento fallido. Si alcanza MAX_INTENTOS, crea bloqueo escalonado.
   */
  async registrarIntentoFallido(
    userId: string,
    _ip?: string,
  ): Promise<{
    bloqueado: boolean;
    intentosRestantes: number;
    minutosBloqueo?: number;
  }> {
    const registro = await this.prisma.usuarios_bloqueados.findFirst({
      where: {
        user_id: userId,
        activo: true,
      },
      orderBy: { creado_en: 'desc' },
    });

    const intentosActuales = registro?.intentos_fallidos_consecutivos || 0;
    const nuevosIntentos = intentosActuales + 1;

    if (nuevosIntentos >= MAX_INTENTOS) {
      const nivel = await this.determinarNivelBloqueo(
        registro?.nivel_numero || 0,
      );

      const bloqueadoDesde = new Date();
      const bloqueadoHasta = new Date(
        bloqueadoDesde.getTime() + nivel.duracion_minutos * 60000,
      );

      if (registro) {
        await this.prisma.usuarios_bloqueados.update({
          where: { id: registro.id },
          data: {
            intentos_fallidos_consecutivos: nuevosIntentos,
            nivel_id: nivel.id,
            nivel_numero: nivel.nivel,
            bloqueado_desde: bloqueadoDesde,
            bloqueado_hasta: bloqueadoHasta,
            desbloqueado_en: null,
            motivo: `Bloqueo automático: ${nuevosIntentos} intentos fallidos consecutivos`,
            actualizado_en: new Date(),
          },
        });
      } else {
        await this.prisma.usuarios_bloqueados.create({
          data: {
            id: randomUUID(),
            user_id: userId,
            nivel_id: nivel.id,
            nivel_numero: nivel.nivel,
            intentos_fallidos_consecutivos: nuevosIntentos,
            bloqueado_desde: bloqueadoDesde,
            bloqueado_hasta: bloqueadoHasta,
            motivo: `Bloqueo automático: ${nuevosIntentos} intentos fallidos consecutivos`,
            actualizado_en: new Date(),
          },
        });
      }

      this.logger.warn(
        `Usuario ${userId} bloqueado por ${nivel.duracion_minutos} minutos (nivel ${nivel.nivel})`,
      );

      return {
        bloqueado: true,
        intentosRestantes: 0,
        minutosBloqueo: nivel.duracion_minutos,
      };
    }

    // Incrementar intentos sin bloquear
    if (registro) {
      await this.prisma.usuarios_bloqueados.update({
        where: { id: registro.id },
        data: {
          intentos_fallidos_consecutivos: nuevosIntentos,
          actualizado_en: new Date(),
        },
      });
    } else {
      await this.prisma.usuarios_bloqueados.create({
        data: {
          id: randomUUID(),
          user_id: userId,
          nivel_numero: 0,
          intentos_fallidos_consecutivos: nuevosIntentos,
          bloqueado_desde: new Date(),
          bloqueado_hasta: new Date(),
          actualizado_en: new Date(),
        },
      });
    }

    return {
      bloqueado: false,
      intentosRestantes: MAX_INTENTOS - nuevosIntentos,
    };
  }

  /**
   * Resetea intentos fallidos tras login exitoso.
   */
  async resetearIntentos(userId: string): Promise<void> {
    const registro = await this.prisma.usuarios_bloqueados.findFirst({
      where: {
        user_id: userId,
        activo: true,
        intentos_fallidos_consecutivos: { gt: 0 },
      },
      orderBy: { creado_en: 'desc' },
    });

    if (registro && registro.intentos_fallidos_consecutivos > 0) {
      await this.prisma.usuarios_bloqueados.update({
        where: { id: registro.id },
        data: {
          intentos_fallidos_consecutivos: 0,
          desbloqueado_en: new Date(),
          actualizado_en: new Date(),
        },
      });
    }
  }

  /**
   * Desbloquea manualmente un usuario (para uso admin).
   */
  async desbloquear(userId: string, adminId: string): Promise<void> {
    await this.prisma.usuarios_bloqueados.updateMany({
      where: {
        user_id: userId,
        activo: true,
        bloqueado_hasta: { gt: new Date() },
      },
      data: {
        activo: false,
        desbloqueado_en: new Date(),
        desbloqueado_manualmente_por: adminId,
        actualizado_en: new Date(),
      },
    });
  }

  /**
   * Determina el siguiente nivel de bloqueo (escalonado).
   */
  private async determinarNivelBloqueo(
    nivelActual: number,
  ): Promise<{ id: string; nivel: number; duracion_minutos: number }> {
    const siguienteNivel = await this.prisma.niveles_bloqueo.findFirst({
      where: {
        nivel: { gt: nivelActual },
        activo: true,
      },
      orderBy: { nivel: 'asc' },
    });

    if (siguienteNivel) {
      return {
        id: siguienteNivel.id,
        nivel: siguienteNivel.nivel,
        duracion_minutos: siguienteNivel.duracion_minutos,
      };
    }

    // Si no hay siguiente nivel, usar el máximo existente
    const maxNivel = await this.prisma.niveles_bloqueo.findFirst({
      where: { activo: true },
      orderBy: { nivel: 'desc' },
    });

    return {
      id: maxNivel!.id,
      nivel: maxNivel!.nivel,
      duracion_minutos: maxNivel!.duracion_minutos,
    };
  }
}
