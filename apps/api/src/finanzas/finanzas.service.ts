import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  Prisma,
  TipoTransaccion,
  AuditAction,
  AuditResult,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTransaccionDto } from './dto/create-transaccion.dto';
import { UpdateTransaccionDto } from './dto/update-transaccion.dto';
import { QueryTransaccionesDto } from './dto/query-transacciones.dto';

/** Placeholder para auditoría de fallos donde aún no hay entidad conocida. */
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

/** Genera un folio único y legible para la transacción. */
function generarCodigo(): string {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}`;
  const sufijo = randomUUID().slice(0, 6).toUpperCase();
  return `TRA-${ymd}-${sufijo}`;
}

@Injectable()
export class FinanzasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Audita un fallo de negocio y lanza la excepción correspondiente.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async fallir<A extends new (message: string) => any>(
    action: AuditAction,
    entityId: string | null,
    actorUserId: string,
    errorCode: string,
    Excepcion: A,
    message: string,
  ): Promise<never> {
    await this.auditService.log({
      action,
      entityType: 'transacciones',
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
      actorUserId,
      actorType: 'USER',
      actorRole: 'autenticado',
    });
    throw new Excepcion(message);
  }

  // ────────────────────────────────────────────
  //  LISTAR (con búsqueda, filtros y paginación)
  // ────────────────────────────────────────────
  async findAll(query: QueryTransaccionesDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const where: Prisma.transaccionesWhereInput = {
      eliminado_en: null,
    };

    if (query.search) {
      where.OR = [
        { descripcion: { contains: query.search, mode: 'insensitive' } },
        { categoria: { contains: query.search, mode: 'insensitive' } },
        ...(query.search.length >= 4
          ? [
              {
                codigo: {
                  contains: query.search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            ]
          : []),
      ];
    }

    if (query.tipo) {
      where.tipo = query.tipo;
    }

    if (query.categoria) {
      where.categoria = query.categoria;
    }

    if (query.fechaDesde || query.fechaHasta) {
      where.fecha = {};
      if (query.fechaDesde) where.fecha.gte = new Date(query.fechaDesde);
      if (query.fechaHasta) where.fecha.lte = new Date(query.fechaHasta);
    }

    const [items, total] = await Promise.all([
      this.prisma.transacciones.findMany({
        where,
        orderBy: [{ fecha: 'desc' }, { creado_en: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.transacciones.count({ where }),
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
  //  OBTENER UNO
  // ────────────────────────────────────────────
  async findOne(id: string) {
    const transaccion = await this.prisma.transacciones.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!transaccion) {
      throw new NotFoundException(
        `Transacción con id "${id}" no encontrada`,
      );
    }

    return this.serialize(transaccion);
  }

  // ────────────────────────────────────────────
  //  CREAR
  // ────────────────────────────────────────────
  async create(dto: CreateTransaccionDto, userId: string) {
    const transaccion = await this.prisma.transacciones.create({
      data: {
        id: randomUUID(),
        codigo: generarCodigo(),
        tipo: dto.tipo,
        categoria: dto.categoria,
        ...(dto.otraCategoria !== undefined && { otra_categoria: dto.otraCategoria.trim() }),
        monto: dto.monto,
        fecha: new Date(dto.fecha),
        descripcion: dto.descripcion.trim(),
        creado_por: userId,
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
    });

    const serialized = this.serialize(transaccion);

    await this.auditService.log({
      action: AuditAction.TRANSACCION_CREADA,
      entityType: 'transacciones',
      entityId: transaccion.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: serialized,
    });

    return serialized;
  }

  // ────────────────────────────────────────────
  //  ACTUALIZAR
  // ────────────────────────────────────────────
  async update(id: string, dto: UpdateTransaccionDto, userId: string) {
    const existente = await this.prisma.transacciones.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.TRANSACCION_ACTUALIZADA,
        id,
        userId,
        'TRANSACCION_NO_ENCONTRADA',
        NotFoundException,
        `Transacción con id "${id}" no encontrada`,
      );
    }

    const transaccion = await this.prisma.transacciones.update({
      where: { id },
      data: {
        ...(dto.tipo !== undefined && { tipo: dto.tipo }),
        ...(dto.categoria !== undefined && { categoria: dto.categoria }),
        ...(dto.monto !== undefined && { monto: dto.monto }),
        ...(dto.fecha !== undefined && { fecha: new Date(dto.fecha) }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion.trim() }),
        ...(dto.otraCategoria !== undefined && {
          otra_categoria: dto.otraCategoria.trim() || null,
        }),
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
    });

    const serialized = this.serialize(transaccion);

    await this.auditService.log({
      action: AuditAction.TRANSACCION_ACTUALIZADA,
      entityType: 'transacciones',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.serialize(existente as never),
      newValue: serialized,
    });

    return serialized;
  }

  // ────────────────────────────────────────────
  //  ELIMINAR (soft delete)
  // ────────────────────────────────────────────
  async remove(id: string, userId: string) {
    const existente = await this.prisma.transacciones.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.TRANSACCION_ELIMINADA,
        id,
        userId,
        'TRANSACCION_NO_ENCONTRADA',
        NotFoundException,
        `Transacción con id "${id}" no encontrada`,
      );
    }

    await this.prisma.transacciones.update({
      where: { id },
      data: { eliminado_en: new Date(), activo: false },
    });

    await this.auditService.log({
      action: AuditAction.TRANSACCION_ELIMINADA,
      entityType: 'transacciones',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.serialize(existente as never),
    });

    return { message: 'Transacción eliminada exitosamente' };
  }

  // ────────────────────────────────────────────
  //  ESTADÍSTICAS (alimentan las tarjetas)
  // ────────────────────────────────────────────
  async findStats() {
    const group = await this.prisma.transacciones.groupBy({
      by: ['tipo'],
      where: { eliminado_en: null },
      _sum: { monto: true },
      _count: { _all: true },
    });

    let totalIngresos = 0;
    let totalEgresos = 0;
    let cantidad = 0;

    for (const row of group) {
      const amount = Number(row._sum.monto ?? 0);
      cantidad += row._count._all;
      if (row.tipo === TipoTransaccion.INGRESO) {
        totalIngresos += amount;
      } else {
        totalEgresos += amount;
      }
    }

    return {
      balance: totalIngresos - totalEgresos,
      totalIngresos,
      totalEgresos,
      cantidad,
    };
  }

  // ────────────────────────────────────────────
  //  PRIVADOS
  // ────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serialize(transaccion: any) {
    const otraCategoria = transaccion.otra_categoria ?? null;
    return {
      id: transaccion.id,
      codigo: transaccion.codigo,
      tipo: transaccion.tipo,
      categoria: transaccion.categoria,
      otraCategoria,
      // Categoría efectiva mostrada en la UI: si eligió "Otros" con texto propio,
      // se reporta la categoría personalizada en lugar de "Otros".
      catEfectiva:
        transaccion.categoria === 'Otros' && otraCategoria ? otraCategoria : transaccion.categoria,
      monto: Number(transaccion.monto),
      fecha:
        transaccion.fecha instanceof Date
          ? transaccion.fecha.toISOString().split('T')[0]
          : String(transaccion.fecha).split('T')[0],
      descripcion: transaccion.descripcion,
      activo: transaccion.activo,
      creadoEn: transaccion.creado_en?.toISOString?.() ?? transaccion.creado_en,
      actualizadoEn: transaccion.actualizado_en?.toISOString?.() ?? transaccion.actualizado_en,
    };
  }
}
