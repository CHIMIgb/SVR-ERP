import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  AuditAction,
  AuditResult,
  CategoriaReporte,
  TipoNotificacion,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

/** Placeholder para auditoría de fallos donde aún no hay entidad conocida. */
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

/**
 * Destinatarios explícitos (B5.8): la notificación declara PARA QUIÉN es al
 * emitir — a un usuario, a un área/torre, a un rol o a todos. NO depende de
 * menús ni de vistas.
 */

/** Entrada para emitir una notificación desde cualquier service del ERP. */
export interface EmitirNotificacionInput {
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string;
  referenciaTipo?: string;
  referenciaId?: string;
  /** Rol destinatario; undefined/null = visible a TODOS los roles. */
  audienciaRolId?: string;
  /** Área/torre destinataria (ej. "se creó un reporte de tu área"). */
  audienciaTorre?: CategoriaReporte;
  /** Usuario destinatario PERSONAL (ej. "te asignaron el reporte"). */
  destinatarioUserId?: string;
  /** Usuario que disparó el evento (trazabilidad; NO recibe su propio aviso). */
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
          audiencia_torre: input.audienciaTorre ?? null,
          destinatario_user_id: input.destinatarioUserId ?? null,
          creado_por: input.creadoPor ?? null,
        },
      });
    } catch (error) {
      this.logger.warn(
        `No se pudo emitir la notificación "${input.titulo}": ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /**
   * Emite a un USUARIO PERSONAL (ej. el creador de un reporte). Destinatario
   * explícito: la recibe aunque el actor sea de otro rol; si es el actor
   * mismo, la excluye el filtro (no se avisa a sí mismo).
   */
  async emitirAUsuario(userIdDestinatario: string, input: Omit<EmitirNotificacionInput, 'destinatarioUserId'>): Promise<void> {
    await this.emitir({ ...input, destinatarioUserId: userIdDestinatario });
  }

  /**
   * Emite al TRABAJADOR asignado (es Trabajador, no User). Los trabajadores
   * NO tienen FK a cuentas de usuario: se resuelve su cuenta por nombre
   * contra `personas` (best-effort; sin match único, no se emite y queda
   * loggeado).
   */
  async emitirATrabajador(trabajadorId: string, input: Omit<EmitirNotificacionInput, 'destinatarioUserId'>): Promise<void> {
    try {
      const trabajador = await this.prisma.trabajadores.findUnique({
        where: { id: trabajadorId },
        select: { nombre: true },
      });
      if (!trabajador) {
        this.logger.warn(`No se emitió "${input.titulo}": trabajador ${trabajadorId} no encontrado`);
        return;
      }
      // Match por nombre completo (nombre + apellidos de la persona).
      const primeraPalabra = trabajador.nombre.split(' ')[0];
      const candidatos = await this.prisma.personas.findMany({
        where: { nombre: { contains: primeraPalabra, mode: 'insensitive' } },
        select: { id: true, nombre: true, apellido_paterno: true, apellido_materno: true },
      });
      const coincidencias = candidatos.filter(
        (p) =>
          [p.nombre, p.apellido_paterno, p.apellido_materno]
            .filter(Boolean)
            .join(' ')
            .toLowerCase() === trabajador.nombre.trim().toLowerCase(),
      );
      if (coincidencias.length !== 1) {
        this.logger.warn(
          `No se emitió "${input.titulo}": no se identificó una cuenta única para el trabajador "${trabajador.nombre}" (${coincidencias.length} coincidencias)`,
        );
        return;
      }
      const user = await this.prisma.users.findFirst({
        where: { persona_id: coincidencias[0].id },
        select: { id: true },
      });
      if (!user) {
        this.logger.warn(
          `No se emitió "${input.titulo}": el trabajador "${trabajador.nombre}" no tiene cuenta de usuario`,
        );
        return;
      }
      await this.emitirAUsuario(user.id, input);
    } catch (error) {
      this.logger.warn(
        `No se pudo resolver el trabajador ${trabajadorId} para "${input.titulo}": ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /**
   * Emite a TODA UN ÁREA (torre): la reciben los usuarios con ese `torre`.
   * Si la torre es null no se emite nada.
   */
  async emitirATorre(torre: CategoriaReporte | null, input: Omit<EmitirNotificacionInput, 'audienciaTorre'>): Promise<void> {
    if (!torre) {
      this.logger.warn(`No se emitió "${input.titulo}": el evento no tiene torre definida`);
      return;
    }
    await this.emitir({ ...input, audienciaTorre: torre });
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

  /**
   * Visibilidad del buzón de un usuario (compartida por TODOS los endpoints):
   *  1. no descartada por él (tabla `notificaciones_lecturas`),
   *  2. no la disparó él (el actor no recibe su propio aviso),
   *  3. dirigida A ÉL: personal, su área/torre, sus roles activos o "todos".
   */
  private async filtroDeBuzon(userId: string) {
    const [user, roles] = await Promise.all([
      this.prisma.users.findUnique({
        where: { id: userId },
        select: { torre: true },
      }),
      this.prisma.users_roles.findMany({
        where: { user_id: userId, activo: true },
        select: { rol_id: true },
      }),
    ]);
    const roleIds = roles.map((r) => r.rol_id);

    const where = {
      AND: [
        // El actor no recibe su propio aviso (system-only si fuera necesario
        // se emite con creadoPor null).
        { OR: [{ creado_por: null }, { creado_por: { not: userId } }] },
        // Destinatarios explícitos: personal, su torre, sus roles o todos.
        {
          OR: [
            { destinatario_user_id: userId },
            ...(user?.torre ? [{ audiencia_torre: user.torre }] : []),
            { audiencia_rol_id: null },
            ...(roleIds.length ? [{ audiencia_rol_id: { in: roleIds } }] : []),
          ],
        },
      ],
    };

    return { roleIds, where };
  }

  /** Buzón del usuario: merge del contenido visible con SU estado de lectura. */
  async findMine(userId: string, query: { page?: number; limit?: number } = {}) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const { where } = await this.filtroDeBuzon(userId);

    const [rows, total, lecturas] = await Promise.all([
      this.prisma.notificaciones.findMany({
        where,
        orderBy: { creado_en: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notificaciones.count({ where }),
      // Estado por usuario de TODO lo visible (para leida/noLeidas correctos).
      this.prisma.notificaciones_lecturas.findMany({
        where: { user_id: userId },
      }),
    ]);

    const lecturasPorId = new Map(lecturas.map((l) => [l.notificacion_id, l]));

    return {
      items: rows.map((n) => this.serialize(n, lecturasPorId.get(n.id))),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      noLeidas: total - lecturas.filter((l) => l.leido_en && !l.descartada).length,
    };
  }

  /** Marca UNA notificación como leída (estado POR USUARIO). */
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

    await this.prisma.notificaciones_lecturas.upsert({
      where: { notificacion_id_user_id: { notificacion_id: id, user_id: userId } },
      update: { leido_en: new Date() },
      create: { notificacion_id: id, user_id: userId, leido_en: new Date() },
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
        usuario: userId,
      },
    });

    return this.serialize(notificacion, {
      notificacion_id: id,
      user_id: userId,
      leido_en: new Date(),
      descartada: false,
      creado_en: new Date(),
    });
  }

  /** Marca TODAS las visibles del usuario como leídas (solo las que faltan). */
  async marcarTodas(userId: string) {
    const { where } = await this.filtroDeBuzon(userId);

    const visibles = await this.prisma.notificaciones.findMany({
      where,
      select: { id: true },
    });
    const lecturas = await this.prisma.notificaciones_lecturas.findMany({
      where: { user_id: userId, notificacion_id: { in: visibles.map((v) => v.id) } },
    });
    const yaLeidas = new Set(lecturas.filter((l) => l.leido_en).map((l) => l.notificacion_id));
    const faltantes = visibles.filter((v) => !yaLeidas.has(v.id));

    if (faltantes.length > 0) {
      await this.prisma.notificaciones_lecturas.createMany({
        data: faltantes.map((v) => ({
          notificacion_id: v.id,
          user_id: userId,
          leido_en: new Date(),
        })),
        skipDuplicates: true,
      });
    }

    await this.auditService.log({
      action: AuditAction.NOTIFICACION_LEIDA,
      entityType: 'notificaciones',
      entityId: ENTITY_PLACEHOLDER,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: { marcadas: faltantes.length, usuario: userId },
    });

    return { message: 'Notificaciones marcadas como leídas', marcadas: faltantes.length };
  }

  /**
   * Basura del centro: descarta SOLO para este usuario (estado por usuario) —
   * desaparecen y no vuelven para él; el resto del rol sigue viéndolas.
   */
  async descartarTodas(userId: string) {
    const { where } = await this.filtroDeBuzon(userId);

    const visibles = await this.prisma.notificaciones.findMany({
      where,
      select: { id: true },
    });

    if (visibles.length > 0) {
      await this.prisma.notificaciones_lecturas.createMany({
        data: visibles.map((v) => ({
          notificacion_id: v.id,
          user_id: userId,
          descartada: true,
        })),
        skipDuplicates: true,
      });
    }

    await this.auditService.log({
      action: AuditAction.NOTIFICACION_DESCARTADA,
      entityType: 'notificaciones',
      entityId: ENTITY_PLACEHOLDER,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: { descartadas: visibles.length, usuario: userId },
    });

    return { message: 'Notificaciones descartadas', descartadas: visibles.length };
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
  private serialize(n: any, lectura?: any) {
    return {
      id: n.id,
      tipo: n.tipo,
      titulo: n.titulo,
      cuerpo: n.cuerpo,
      referenciaTipo: n.referencia_tipo ?? null,
      referenciaId: n.referencia_id ?? null,
      audienciaRolId: n.audiencia_rol_id ?? null,
      leida: Boolean(lectura?.leido_en),
      leidoEn: lectura?.leido_en?.toISOString?.() ?? null,
      creadoEn: n.creado_en?.toISOString?.() ?? n.creado_en,
    };
  }
}
