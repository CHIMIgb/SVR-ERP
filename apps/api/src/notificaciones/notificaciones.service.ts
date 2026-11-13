import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult, TipoNotificacion } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

/** Placeholder para auditoría de fallos donde aún no hay entidad conocida. */
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

/** Entrada para emitir una notificación desde cualquier service del ERP. */
export interface EmitirNotificacionInput {
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string;
  referenciaTipo?: string;
  referenciaId?: string;
  /** Rol destinatario; undefined/null = visible a TODOS los roles. */
  audienciaRolId?: string;
  /** Usuario que disparó el evento (para trazabilidad creado_por). */
  creadoPor?: string;
}

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Emite una notificación de forma BEST-EFFORT: si falla (BD caída, datos
   * raros), se registra el warning y NUNCA revierte el evento de negocio que
   * la originó. Para uso interno de los services del ERP.
   */
  async emitir(input: EmitirNotificacionInput): Promise<void> {
    try {
      await this.prisma.notificaciones.create({
        data: {
          id: randomUUID(),
          tipo: input.tipo,
          titulo: input.titulo.slice(0, 200),
          cuerpo: input.cuerpo,
          referencia_tipo: input.referenciaTipo ?? null,
          referencia_id: input.referenciaId ?? null,
          audiencia_rol_id: input.audienciaRolId ?? null,
          creado_por: input.creadoPor ?? null,
        },
      });
    } catch (error) {
      this.logger.warn(
        `No se pudo emitir la notificación "${input.titulo}": ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /** Buzón del usuario: audiencia "todos" + los roles del usuario. */
  async findMine(userId: string, query: { page?: number; limit?: number } = {}) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const roles = await this.prisma.users_roles.findMany({
      where: { user_id: userId },
      select: { rol_id: true },
    });
    const roleIds = roles.map((r) => r.rol_id);

    const where = {
      descartada: false,
      OR: [
        { audiencia_rol_id: null },
        ...(roleIds.length ? [{ audiencia_rol_id: { in: roleIds } }] : []),
      ],
    };

    const [rows, total, noLeidas] = await Promise.all([
      this.prisma.notificaciones.findMany({
        where,
        orderBy: { creado_en: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notificaciones.count({ where }),
      this.prisma.notificaciones.count({ where: { ...where, leido_en: null } }),
    ]);

    return {
      items: rows.map((n) => this.serialize(n)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      noLeidas,
    };
  }

  /** Marca UNA notificación como leída (lectura compartida por rol). */
  async marcarLeida(id: string, userId: string) {
    const notificacion = await this.prisma.notificaciones.findUnique({
      where: { id },
    });

    if (!notificacion) {
      return this.fallir(
        AuditAction.NOTIFICACION_LEIDA,
        id,
        'NOTIFICACION_NO_ENCONTRADA',
        NotFoundException,
        `Notificación con id "${id}" no encontrada`,
        userId,
      );
    }

    const actualizada = await this.prisma.notificaciones.update({
      where: { id },
      data: { leido_en: new Date() },
    });

    await this.auditService.log({
      action: AuditAction.NOTIFICACION_LEIDA,
      entityType: 'notificaciones',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: {
        titulo: notificacion.titulo,
        yaLeida: Boolean(notificacion.leido_en),
      },
    });

    return this.serialize(actualizada);
  }

  /**
   * Emite para un ROL por su NOMBRE (evita UUIDs hardcodeados en los events).
   * Best-effort doble: si el rol no existe o la emisión falla, solo loggea.
   */
  async emitirARol(
    nombreRol: string,
    input: Omit<EmitirNotificacionInput, 'audienciaRolId'>,
  ): Promise<void> {
    try {
      const rol = await this.prisma.roles.findFirst({
        where: { nombre: nombreRol, eliminado_en: null },
        select: { id: true },
      });
      if (!rol) {
        this.logger.warn(
          `No se emitió la notificación "${input.titulo}": rol "${nombreRol}" no encontrado`,
        );
        return;
      }
      await this.emitir({ ...input, audienciaRolId: rol.id });
    } catch (error) {
      this.logger.warn(
        `No se pudo resolver el rol "${nombreRol}" para la notificación "${input.titulo}": ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /** Marca TODAS las notificaciones del buzón del usuario como leídas. */
  async marcarTodas(userId: string) {
    const roles = await this.prisma.users_roles.findMany({
      where: { user_id: userId },
      select: { rol_id: true },
    });
    const roleIds = roles.map((r) => r.rol_id);
    const where = {
      leido_en: null,
      descartada: false,
      OR: [
        { audiencia_rol_id: null },
        ...(roleIds.length ? [{ audiencia_rol_id: { in: roleIds } }] : []),
      ],
    };

    const resultado = await this.prisma.notificaciones.updateMany({
      where,
      data: { leido_en: new Date() },
    });

    await this.auditService.log({
      action: AuditAction.NOTIFICACION_LEIDA,
      entityType: 'notificaciones',
      entityId: ENTITY_PLACEHOLDER,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: { marcadas: resultado.count },
    });

    return { message: 'Notificaciones marcadas como leídas', marcadas: resultado.count };
  }

  /**
   * Descarta TODAS las notificaciones del buzón del usuario (icono de basura):
   * desaparecen del centro y NO vuelven a aparecer — la fila queda en BD con
   * `descartada = true` para auditoría/consultas.
   */
  async descartarTodas(userId: string) {
    const roles = await this.prisma.users_roles.findMany({
      where: { user_id: userId },
      select: { rol_id: true },
    });
    const roleIds = roles.map((r) => r.rol_id);
    const where = {
      descartada: false,
      OR: [
        { audiencia_rol_id: null },
        ...(roleIds.length ? [{ audiencia_rol_id: { in: roleIds } }] : []),
      ],
    };

    const resultado = await this.prisma.notificaciones.updateMany({
      where,
      data: { descartada: true },
    });

    await this.auditService.log({
      action: AuditAction.NOTIFICACION_DESCARTADA,
      entityType: 'notificaciones',
      entityId: ENTITY_PLACEHOLDER,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: { descartadas: resultado.count },
    });

    return { message: 'Notificaciones descartadas', descartadas: resultado.count };
  }

  /** Audita un fallo de negocio y lanza la excepción correspondiente. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async fallir<A extends new (message: string) => any>(
    action: AuditAction,
    entityId: string | null,
    errorCode: string,
    Excepcion: A,
    message: string,
    actorUserId?: string,
  ): Promise<never> {
    await this.auditService.log({
      action,
      entityType: 'notificaciones',
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
      ...(actorUserId && {
        actorUserId,
        actorType: 'USER',
        actorRole: 'autenticado',
      }),
    });
    throw new Excepcion(message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serialize(n: any) {
    return {
      id: n.id,
      tipo: n.tipo,
      titulo: n.titulo,
      cuerpo: n.cuerpo,
      referenciaTipo: n.referencia_tipo ?? null,
      referenciaId: n.referencia_id ?? null,
      audienciaRolId: n.audiencia_rol_id ?? null,
      leida: Boolean(n.leido_en),
      leidoEn: n.leido_en?.toISOString?.() ?? n.leido_en,
      creadoEn: n.creado_en?.toISOString?.() ?? n.creado_en,
    };
  }
}
