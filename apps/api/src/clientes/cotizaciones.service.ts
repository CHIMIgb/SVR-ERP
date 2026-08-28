import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  AuditAction,
  AuditResult,
  EstadoCotizacion,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';
import { QueryCotizacionesDto } from './dto/query-cotizaciones.dto';
import { QueryCotizacionesGlobalDto } from './dto/query-cotizaciones-global.dto';
import { CambiarEstadoCotizacionDto } from './dto/cambiar-estado-cotizacion.dto';

/** Placeholder para auditoría de fallos donde aún no hay entidad conocida. */
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

/** Etiqueta legible para cada estado de cotización. */
const ESTADO_LABELS: Record<EstadoCotizacion, string> = {
  [EstadoCotizacion.PENDIENTE]: 'Pendiente',
  [EstadoCotizacion.ACEPTADA]: 'Aceptada',
  [EstadoCotizacion.RECHAZADA]: 'Rechazada',
};

@Injectable()
export class CotizacionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Audita un fallo de negocio y lanza la excepción correspondiente.
   * El actorUserId cae automáticamente del JWT en el contexto de request.
   */
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
      entityType: 'cotizaciones',
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

  /** Valida que el cliente exista. Audita el fallo si no. */
  private async validarCliente(clienteId: string, action: AuditAction) {
    const cliente = await this.prisma.clientes.findFirst({
      where: { id: clienteId, eliminado_en: null },
      select: { id: true },
    });
    if (!cliente) {
      return this.fallir(
        action,
        clienteId,
        'CLIENTE_NO_ENCONTRADO',
        BadRequestException,
        `Cliente con id "${clienteId}" no encontrado`,
      );
    }
  }

  // ────────────────────────────────────────────
  //  HISTORIAL DE COTIZACIONES DEL CLIENTE
  // ────────────────────────────────────────────
  async findByCliente(clienteId: string, query: QueryCotizacionesDto = {}) {
    await this.validarCliente(clienteId, AuditAction.COTIZACION_CREADA);

    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const where = { cliente_id: clienteId, eliminado_en: null };

    const [items, total] = await Promise.all([
      this.prisma.cotizaciones.findMany({
        where,
        orderBy: [{ fecha: 'desc' }, { creado_en: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.cotizaciones.count({ where }),
    ]);

    return {
      items: items.map((item) => this.serialize(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  // ────────────────────────────────────────────
  //  CREAR COTIZACIÓN
  // ────────────────────────────────────────────
  async create(clienteId: string, dto: CreateCotizacionDto, userId: string) {
    await this.validarCliente(clienteId, AuditAction.COTIZACION_CREADA);

    const hoy = new Date(dto.fecha).toISOString().split('T')[0].replace(/-/g, '');
    const cotizacion = await this.prisma.cotizaciones.create({
      data: {
        id: randomUUID(),
        codigo: `COT-${hoy}-${randomUUID().slice(0, 6).toUpperCase()}`,
        cliente_id: clienteId,
        descripcion: dto.descripcion.trim(),
        monto: dto.monto,
        fecha: new Date(dto.fecha),
        estado: EstadoCotizacion.PENDIENTE,
        creado_por: userId,
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
    });

    const serialized = this.serialize(cotizacion);

    await this.auditService.log({
      action: AuditAction.COTIZACION_CREADA,
      entityType: 'cotizaciones',
      entityId: cotizacion.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: serialized,
    });

    return serialized;
  }

  // ────────────────────────────────────────────
  //  LISTADO GLOBAL (vista /cotizaciones)
  // ────────────────────────────────────────────
  async findAll(query: QueryCotizacionesGlobalDto = {}) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const where: Prisma.cotizacionesWhereInput = {
      eliminado_en: null,
    };

    if (query.search) {
      where.OR = [
        { descripcion: { contains: query.search, mode: 'insensitive' } },
        ...(query.search.length >= 4
          ? [{ codigo: { contains: query.search, mode: Prisma.QueryMode.insensitive } }]
          : []),
        {
          clientes: {
            OR: [
              { empresa: { contains: query.search, mode: 'insensitive' } },
              { nombre: { contains: query.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (query.estado) {
      where.estado = query.estado;
    }

    if (query.clienteId) {
      where.cliente_id = query.clienteId;
    }

    const [rows, total] = await Promise.all([
      this.prisma.cotizaciones.findMany({
        where,
        orderBy: [{ fecha: 'desc' }, { creado_en: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          clientes: { select: { id: true, nombre: true, empresa: true } },
        },
      }),
      this.prisma.cotizaciones.count({ where }),
    ]);

    return {
      items: rows.map((row) => this.serializeGlobal(row)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  // ────────────────────────────────────────────
  //  OBTENER DETALLE
  // ────────────────────────────────────────────
  async findOne(id: string) {
    const row = await this.prisma.cotizaciones.findFirst({
      where: { id, eliminado_en: null },
      include: {
        clientes: { select: { id: true, nombre: true, empresa: true, telefono: true, correo: true } },
      },
    });

    if (!row) {
      return this.fallir(
        AuditAction.COTIZACION_ACTUALIZADA,
        id,
        'COTIZACION_NO_ENCONTRADA',
        NotFoundException,
        `Cotización con id "${id}" no encontrada`,
      );
    }

    return this.serializeGlobal(row);
  }

  // ────────────────────────────────────────────
  //  CAMBIAR ESTADO (Aceptada / Rechazada)
  // ────────────────────────────────────────────
  async cambiarEstado(id: string, dto: CambiarEstadoCotizacionDto, userId: string) {
    const existente = await this.prisma.cotizaciones.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.COTIZACION_ACTUALIZADA,
        id,
        'COTIZACION_NO_ENCONTRADA',
        NotFoundException,
        `Cotización con id "${id}" no encontrada`,
        userId,
      );
    }

    const estadoAnterior = existente.estado as EstadoCotizacion;

    if (estadoAnterior === dto.estado) {
      return this.fallir(
        AuditAction.COTIZACION_ACTUALIZADA,
        id,
        'ESTADO_SIN_CAMBIO',
        BadRequestException,
        `La cotización ya está en estado ${ESTADO_LABELS[dto.estado]}`,
        userId,
      );
    }

    const cotizacion = await this.prisma.cotizaciones.update({
      where: { id },
      data: {
        estado: dto.estado,
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
    });

    const serialized = this.serialize(cotizacion);

    await this.auditService.log({
      action: AuditAction.COTIZACION_ACTUALIZADA,
      entityType: 'cotizaciones',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: { estado: ESTADO_LABELS[estadoAnterior] },
      newValue: { estado: ESTADO_LABELS[dto.estado] },
    });

    return { ...serialized, estado: ESTADO_LABELS[dto.estado] };
  }

  // ────────────────────────────────────────────
  //  ESTADÍSTICAS (tarjetas de /cotizaciones)
  // ────────────────────────────────────────────
  async findStats() {
    const where = { eliminado_en: null };

    const [total, pendientes, aceptadas, rechazadas, agregado] =
      await Promise.all([
        this.prisma.cotizaciones.count({ where }),
        this.prisma.cotizaciones.count({
          where: { ...where, estado: EstadoCotizacion.PENDIENTE },
        }),
        this.prisma.cotizaciones.count({
          where: { ...where, estado: EstadoCotizacion.ACEPTADA },
        }),
        this.prisma.cotizaciones.count({
          where: { ...where, estado: EstadoCotizacion.RECHAZADA },
        }),
        this.prisma.cotizaciones.aggregate({
          where: { ...where, estado: EstadoCotizacion.ACEPTADA },
          _sum: { monto: true },
        }),
      ]);

    return {
      total,
      pendientes,
      aceptadas,
      rechazadas,
      montoAceptado: Number(agregado._sum.monto ?? 0),
    };
  }

  // ────────────────────────────────────────────
  //  PRIVADOS
  // ────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serializeGlobal(cotizacion: any) {
    const base = this.serialize(cotizacion);
    const cliente = cotizacion.clientes;
    return {
      ...base,
      clienteNombre: cliente?.nombre ?? null,
      clienteEmpresa: cliente?.empresa ?? null,
      clienteTelefono: cliente?.telefono ?? null,
      clienteCorreo: cliente?.correo ?? null,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serialize(cotizacion: any) {
    return {
      id: cotizacion.id,
      codigo: cotizacion.codigo ?? null,
      clienteId: cotizacion.cliente_id,
      descripcion: cotizacion.descripcion,
      monto: Number(cotizacion.monto),
      fecha:
        cotizacion.fecha instanceof Date
          ? cotizacion.fecha.toISOString().split('T')[0]
          : String(cotizacion.fecha).split('T')[0],
      estado:
        ESTADO_LABELS[cotizacion.estado as EstadoCotizacion] ?? cotizacion.estado,
      activo: cotizacion.activo,
      creadoEn: cotizacion.creado_en?.toISOString?.() ?? cotizacion.creado_en,
      actualizadoEn:
        cotizacion.actualizado_en?.toISOString?.() ?? cotizacion.actualizado_en,
    };
  }
}
