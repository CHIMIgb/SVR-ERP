import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

/** Intentos fallidos de USUARIO antes de bloqueo escalonado */
const MAX_INTENTOS_USUARIO = 5;

function envInt(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

const MAX_INTENTOS_IP = envInt('BLOQUEO_IP_MAX_INTENTOS', 10);
const BLOQUEO_IP_MINUTOS = envInt('BLOQUEO_IP_MINUTOS', 60);
const VENTANA_IP_MINUTOS = envInt('BLOQUEO_IP_VENTANA_MINUTOS', 15);

@Injectable()
export class BloqueoService {
  private readonly logger = new Logger(BloqueoService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────
  //  VERIFICACIONES
  // ─────────────────────────────────────────────────────

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
   * Verifica si una IP está bloqueada.
   */
  async verificarBloqueoPorIP(
    ip: string,
  ): Promise<{ bloqueado: boolean; minutosRestantes?: number }> {
    const bloqueo = await this.prisma.usuarios_bloqueados.findFirst({
      where: {
        ip_address: ip,
        user_id: null,
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

  // ─────────────────────────────────────────────────────
  //  REGISTRO DE INTENTOS
  // ─────────────────────────────────────────────────────

  /**
   * Registra un intento fallido de usuario. Si alcanza MAX_INTENTOS, crea bloqueo escalonado.
   * También verifica y crea bloqueo por IP si aplica.
   */
  async registrarIntentoFallido(
    userId: string,
    ip?: string,
  ): Promise<{
    bloqueado: boolean;
    bloqueadoPorIP?: boolean;
    intentosRestantes: number;
    minutosBloqueo?: number;
    minutosBloqueoIP?: number;
  }> {
    // 1. Tracking por usuario (escalonado)
    const resultadoUsuario = await this.registrarIntentoUsuario(userId);

    // 2. Tracking por IP (fijo)
    let minutosBloqueoIP: number | undefined;
    if (ip) {
      const resultadoIP = await this.verificarYBloquearIP(ip);
      if (resultadoIP.bloqueado) {
        minutosBloqueoIP = resultadoIP.minutosBloqueo;
      }
    }

    return {
      bloqueado: resultadoUsuario.bloqueado,
      bloqueadoPorIP: !!minutosBloqueoIP,
      intentosRestantes: resultadoUsuario.intentosRestantes,
      minutosBloqueo: resultadoUsuario.minutosBloqueo,
      minutosBloqueoIP,
    };
  }

  /**
   * Registra un intento fallido solo por IP (para intentos con email no encontrado).
   * Cuando el email no existe, no hay userId, pero sí bloqueamos la IP.
   */
  async registrarIntentoFallidoPorIP(
    ip: string,
  ): Promise<{ bloqueado: boolean; minutosBloqueo?: number }> {
    return this.verificarYBloquearIP(ip);
  }

  // ─────────────────────────────────────────────────────
  //  RESET Y DESBLOQUEO
  // ─────────────────────────────────────────────────────

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
   * Desbloquea una IP (para uso admin).
   */
  async desbloquearIP(ip: string, adminId: string): Promise<void> {
    await this.prisma.usuarios_bloqueados.updateMany({
      where: {
        ip_address: ip,
        user_id: null,
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

  // ─────────────────────────────────────────────────────
  //  LÓGICA INTERNA
  // ─────────────────────────────────────────────────────

  /**
   * Tracking por usuario — usa la tabla usuarios_bloqueados directamente.
   */
  private async registrarIntentoUsuario(
    userId: string,
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

    if (nuevosIntentos >= MAX_INTENTOS_USUARIO) {
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
      intentosRestantes: MAX_INTENTOS_USUARIO - nuevosIntentos,
    };
  }

  /**
   * Verifica si una IP excedió el máximo de intentos fallidos.
   * Usa la tabla intentos_login para contar fallos en la ventana de tiempo.
   * Si excede, crea (o reactiva) un registro de bloqueo en usuarios_bloqueados.
   */
  private async verificarYBloquearIP(
    ip: string,
  ): Promise<{ bloqueado: boolean; minutosBloqueo?: number }> {
    // Verificar si ya está bloqueada
    const yaBloqueada = await this.verificarBloqueoPorIP(ip);
    if (yaBloqueada.bloqueado) {
      return {
        bloqueado: true,
        minutosBloqueo: yaBloqueada.minutosRestantes,
      };
    }

    // Contar intentos fallidos recientes desde esta IP
    const desde = new Date(Date.now() - VENTANA_IP_MINUTOS * 60000);
    const intentosFallidos = await this.prisma.intentos_login.count({
      where: {
        ip_address: ip,
        exitoso: false,
        creado_en: { gte: desde },
      },
    });

    if (intentosFallidos < MAX_INTENTOS_IP) {
      return { bloqueado: false };
    }

    // Bloquear la IP
    const bloqueadoDesde = new Date();
    const bloqueadoHasta = new Date(
      bloqueadoDesde.getTime() + BLOQUEO_IP_MINUTOS * 60000,
    );

    await this.prisma.usuarios_bloqueados.create({
      data: {
        id: randomUUID(),
        user_id: null,
        ip_address: ip,
        nivel_numero: 0,
        intentos_fallidos_consecutivos: intentosFallidos,
        bloqueado_desde: bloqueadoDesde,
        bloqueado_hasta: bloqueadoHasta,
        motivo: `Bloqueo automático por IP: ${intentosFallidos} intentos fallidos desde ${ip} en los últimos ${VENTANA_IP_MINUTOS} min`,
        actualizado_en: new Date(),
      },
    });

    this.logger.warn(
      `IP ${ip} bloqueada por ${BLOQUEO_IP_MINUTOS} minutos (${intentosFallidos} fallos en ${VENTANA_IP_MINUTOS} min)`,
    );

    return { bloqueado: true, minutosBloqueo: BLOQUEO_IP_MINUTOS };
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
