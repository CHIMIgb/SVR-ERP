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
import { escapeCsv } from '../common/csv';

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

/** Inicio del día de hoy (00:00:00 local) para comparar vencimientos. */
function inicioDeHoy(): Date {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy;
}

/** Suma días a una fecha local sin mutar la original. */
function sumarDias(fecha: Date, dias: number): Date {
  const copia = new Date(fecha);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

type VentanaFlujo =
  | 'vencido'
  | '0-30d'
  | '31-60d'
  | '61-90d'
  | '+90d'
  | 'sin_vencimiento';

const VENTANA_LABEL: Record<VentanaFlujo, string> = {
  vencido: 'Vencido',
  '0-30d': '0-30 días',
  '31-60d': '31-60 días',
  '61-90d': '61-90 días',
  '+90d': '+90 días',
  sin_vencimiento: 'Sin vencimiento',
};

const VENTANA_ORDEN: VentanaFlujo[] = [
  'vencido',
  '0-30d',
  '31-60d',
  '61-90d',
  '+90d',
  'sin_vencimiento',
];

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
  private buildWhere(query: QueryTransaccionesDto): Prisma.transaccionesWhereInput {
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

    return where;
  }

  async findAll(query: QueryTransaccionesDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const where = this.buildWhere(query);

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
  //  EXPORTAR CSV (con los filtros actuales)
  // ────────────────────────────────────────────
  async exportar(query: QueryTransaccionesDto) {
    const transacciones = await this.prisma.transacciones.findMany({
      where: this.buildWhere(query),
      orderBy: [{ fecha: 'desc' }, { creado_en: 'desc' }],
    });

    const escape = escapeCsv;

    const lineas = transacciones.map((t) =>
      [
        t.codigo,
        t.fecha.toISOString().slice(0, 10),
        t.tipo,
        t.categoria,
        t.descripcion,
        Number(t.monto),
      ]
        .map(escape)
        .join(','),
    );

    return [
      '\ufeffCodigo,Fecha,Tipo,Categoria,Descripcion,Monto',
      ...lineas,
    ].join('\n');
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
//  FLUJO NETO PROYECTADO (C5)
// ────────────────────────────────────────────
  async flujoNeto() {
    const hoy = inicioDeHoy();
    const fin30 = sumarDias(hoy, 30);
    const fin60 = sumarDias(hoy, 60);
    const fin90 = sumarDias(hoy, 90);

    // Saldos vivos de ambas carteras (activas). Todo en paralelo.
    const [cxc, cxp] = await Promise.all([
      this.prisma.cuentas_por_cobrar.findMany({
        where: { activo: true },
        select: { monto: true, monto_pagado: true, fecha_vencimiento: true },
      }),
      this.prisma.cuentas_por_pagar.findMany({
        where: { activo: true },
        select: { monto: true, monto_pagado: true, fecha_vencimiento: true },
      }),
    ]);

    const clasificar = (vencimiento: Date | null): VentanaFlujo => {
      if (!vencimiento) return 'sin_vencimiento';
      const venc = new Date(vencimiento);
      if (venc.getTime() < hoy.getTime()) return 'vencido';
      if (venc.getTime() <= fin30.getTime()) return '0-30d';
      if (venc.getTime() <= fin60.getTime()) return '31-60d';
      if (venc.getTime() <= fin90.getTime()) return '61-90d';
      return '+90d';
    };

    const vacio = () => ({ porCobrar: 0, porPagar: 0 });
    const ventanas: Record<VentanaFlujo, ReturnType<typeof vacio>> = {
      vencido: vacio(),
      '0-30d': vacio(),
      '31-60d': vacio(),
      '61-90d': vacio(),
      '+90d': vacio(),
      sin_vencimiento: vacio(),
    };

    // Las saldadas (saldo <= 0) no aportan al flujo.
    for (const cuenta of cxc) {
      const saldo = Number(cuenta.monto) - Number(cuenta.monto_pagado);
      if (saldo <= 0.0001) continue;
      ventanas[clasificar(cuenta.fecha_vencimiento)].porCobrar += saldo;
    }
    for (const cuenta of cxp) {
      const saldo = Number(cuenta.monto) - Number(cuenta.monto_pagado);
      if (saldo <= 0.0001) continue;
      ventanas[clasificar(cuenta.fecha_vencimiento)].porPagar += saldo;
    }

    const redondear = (n: number) => Math.round(n * 100) / 100;
    const items = VENTANA_ORDEN.map((ventana) => {
      const { porCobrar, porPagar } = ventanas[ventana];
      return {
        ventana,
        label: VENTANA_LABEL[ventana],
        porCobrar: redondear(porCobrar),
        porPagar: redondear(porPagar),
        neto: redondear(porCobrar - porPagar),
      };
    });

    const totales = items.reduce(
      (acc, item) => ({
        porCobrar: acc.porCobrar + item.porCobrar,
        porPagar: acc.porPagar + item.porPagar,
        neto: acc.neto + item.neto,
      }),
      { porCobrar: 0, porPagar: 0, neto: 0 },
    );
    totales.neto = redondear(totales.neto);
    totales.porCobrar = redondear(totales.porCobrar);
    totales.porPagar = redondear(totales.porPagar);

    return { items, totales };
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
