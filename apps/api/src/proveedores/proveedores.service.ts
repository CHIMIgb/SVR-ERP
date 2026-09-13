import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  Prisma,
  AuditAction,
  AuditResult,
  EstadoOrdenCompra,
} from '@prisma/client';
import type { proveedores as Proveedor } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { QueryProveedoresDto } from './dto/query-proveedores.dto';
import { CreateOrdenCompraDto } from './dto/create-orden-compra.dto';
import { UpdateOrdenCompraDto } from './dto/update-orden-compra.dto';
import { CambiarEstadoOrdenDto } from './dto/cambiar-estado-orden.dto';
import { RegistrarAbonoDto } from './dto/registrar-abono.dto';
import { QueryOrdenesCompraDto } from './dto/query-ordenes-compra.dto';

/** Placeholder para auditoría de fallos donde aún no hay entidad conocida. */
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

/** Transiciones válidas de estado en órdenes de compra. */
const TRANSICIONES: Record<EstadoOrdenCompra, EstadoOrdenCompra[]> = {
  PENDIENTE: ['APROBADA', 'CANCELADA'],
  APROBADA: ['RECIBIDA', 'CANCELADA'],
  RECIBIDA: [],
  CANCELADA: [],
};

const ESTADOS_CXP = ['PENDIENTE', 'PARCIAL', 'PAGADA', 'CANCELADA'] as const;

/** Genera un folio de transacción para finanzas (TRA-YYYYMMDD-UUID6). */
function generarCodigoTransaccion(): string {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}`;
  const sufijo = randomUUID().slice(0, 6).toUpperCase();
  return `TRA-${ymd}-${sufijo}`;
}

@Injectable()
export class ProveedoresService {
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
  ): Promise<never> {
    await this.auditService.log({
      action,
      entityType: 'proveedores',
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
    });
    throw new Excepcion(message);
  }

  // ────────────────────────────────────────────
  //  PROVEEDORES — LISTAR
  // ────────────────────────────────────────────
  async findAll(query: QueryProveedoresDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const where: Prisma.proveedoresWhereInput = {
      eliminado_en: null,
    };

    if (query.search) {
      where.OR = [
        { nombre: { contains: query.search, mode: 'insensitive' } },
        { rfc: { contains: query.search, mode: 'insensitive' } },
        { correo: { contains: query.search, mode: 'insensitive' } },
        { telefono: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.categoria) {
      where.categoria = query.categoria;
    }

    const [items, total] = await Promise.all([
      this.prisma.proveedores.findMany({
        where,
        orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.proveedores.count({ where }),
    ]);

    return {
      items: items.map((item) => this.serializeProveedor(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  // ────────────────────────────────────────────
  //  PROVEEDORES — OBTENER UNO
  // ────────────────────────────────────────────
  async findOne(id: string) {
    const proveedor = await this.prisma.proveedores.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!proveedor) {
      return this.fallir(
        AuditAction.PROVEEDOR_CONSULTADO,
        id,
        'PROVEEDOR_NO_ENCONTRADO',
        NotFoundException,
        `Proveedor con id "${id}" no encontrado`,
      );
    }

    return this.serializeProveedor(proveedor!);
  }

  // ────────────────────────────────────────────
  //  PROVEEDORES — CREAR
  // ────────────────────────────────────────────
  async create(dto: CreateProveedorDto, userId: string) {
    let proveedor: Proveedor;
    try {
      proveedor = await this.prisma.proveedores.create({
        data: {
          id: randomUUID(),
          nombre: dto.nombre.trim(),
          rfc: dto.rfc?.trim() || null,
          correo: dto.correo?.trim() || null,
          telefono: dto.telefono?.trim() || null,
          categoria: dto.categoria ?? 'Otros',
          activo: dto.activo ?? true,
          creado_por: userId,
          actualizado_por: userId,
          actualizado_en: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return this.fallir(
          AuditAction.PROVEEDOR_CREADO,
          null,
          'PROVEEDOR_RFC_DUPLICADO',
          ConflictException,
          'Ya existe un proveedor con ese RFC',
        );
      }
      throw error;
    }

    const serialized = this.serializeProveedor(proveedor);

    await this.auditService.log({
      action: AuditAction.PROVEEDOR_CREADO,
      entityType: 'proveedores',
      entityId: proveedor.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: serialized,
    });

    return serialized;
  }

  // ────────────────────────────────────────────
  //  PROVEEDORES — ACTUALIZAR
  // ────────────────────────────────────────────
  async update(id: string, dto: UpdateProveedorDto, userId: string) {
    const existente = await this.prisma.proveedores.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.PROVEEDOR_ACTUALIZADO,
        id,
        'PROVEEDOR_NO_ENCONTRADO',
        NotFoundException,
        `Proveedor con id "${id}" no encontrado`,
      );
    }

    let proveedor: Proveedor;
    try {
      proveedor = await this.prisma.proveedores.update({
        where: { id },
        data: {
          ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
          ...(dto.rfc !== undefined && { rfc: dto.rfc?.trim() || null }),
          ...(dto.correo !== undefined && { correo: dto.correo?.trim() || null }),
          ...(dto.telefono !== undefined && { telefono: dto.telefono?.trim() || null }),
          ...(dto.categoria !== undefined && { categoria: dto.categoria }),
          ...(dto.activo !== undefined && { activo: dto.activo }),
          actualizado_por: userId,
          actualizado_en: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return this.fallir(
          AuditAction.PROVEEDOR_ACTUALIZADO,
          id,
          'PROVEEDOR_RFC_DUPLICADO',
          ConflictException,
          'Ya existe un proveedor con ese RFC',
        );
      }
      throw error;
    }

    const serialized = this.serializeProveedor(proveedor);

    await this.auditService.log({
      action: AuditAction.PROVEEDOR_ACTUALIZADO,
      entityType: 'proveedores',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.serializeProveedor(existente as never),
      newValue: serialized,
    });

    return serialized;
  }

  // ────────────────────────────────────────────
  //  PROVEEDORES — ELIMINAR (soft delete)
  // ────────────────────────────────────────────
  async remove(id: string, userId: string) {
    const existente = await this.prisma.proveedores.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.PROVEEDOR_ELIMINADO,
        id,
        'PROVEEDOR_NO_ENCONTRADO',
        NotFoundException,
        `Proveedor con id "${id}" no encontrado`,
      );
    }

    const tienePendientes = await this.prisma.cuentas_por_pagar.findFirst({
      where: {
        proveedor_id: id,
        activo: true,
        estado: { in: ['PENDIENTE', 'PARCIAL'] },
      },
    });

    if (tienePendientes) {
      return this.fallir(
        AuditAction.PROVEEDOR_ELIMINADO,
        id,
        'PROVEEDOR_CON_CXP_PENDIENTE',
        ConflictException,
        'No se puede eliminar un proveedor con cuentas por pagar pendientes',
      );
    }

    await this.prisma.proveedores.update({
      where: { id },
      data: { eliminado_en: new Date(), activo: false },
    });

    await this.auditService.log({
      action: AuditAction.PROVEEDOR_ELIMINADO,
      entityType: 'proveedores',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.serializeProveedor(existente as never),
    });

    return { message: 'Proveedor eliminado exitosamente' };
  }

  // ────────────────────────────────────────────
  //  ESTADOS DE CUENTA — RESUMEN POR PROVEEDOR
  // ────────────────────────────────────────────
  async findEstadoCuentaResumen() {
    const proveedores = await this.prisma.proveedores.findMany({
      where: {
        eliminado_en: null,
        ordenes_compra: {
          some: { eliminado_en: null, estado: { not: EstadoOrdenCompra.CANCELADA } },
        },
      },
      include: {
        ordenes_compra: {
          where: { eliminado_en: null, estado: { not: EstadoOrdenCompra.CANCELADA } },
          select: { id: true, monto: true, pagado: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return proveedores.map((p) => {
      const ops = p.ordenes_compra;
      const total = ops.reduce((acc, o) => acc + Number(o.monto), 0);
      const pagado = ops.reduce((acc, o) => acc + Number(o.pagado), 0);
      return {
        proveedorId: p.id,
        proveedor: p.nombre,
        operaciones: ops.length,
        total,
        pagado,
        saldo: total - pagado,
      };
    });
  }

  // ────────────────────────────────────────────
  //  ESTADOS DE CUENTA — LEDGER POR PROVEEDOR
  // ────────────────────────────────────────────
  async findLedgerPorProveedor(proveedorId: string) {
    const proveedor = await this.prisma.proveedores.findFirst({
      where: { id: proveedorId, eliminado_en: null },
    });

    if (!proveedor) {
      return this.fallir(
        AuditAction.PROVEEDOR_ACTUALIZADO,
        proveedorId,
        'PROVEEDOR_NO_ENCONTRADO',
        NotFoundException,
        `Proveedor con id "${proveedorId}" no encontrado`,
      );
    }

    const ordenes = await this.prisma.ordenes_compra.findMany({
      where: { proveedor_id: proveedorId, eliminado_en: null },
      orderBy: { fecha: 'asc' },
    });

    let saldoCorrido = 0;
    const movimientos = ordenes.map((o) => {
      const cargo = Number(o.monto);
      const abono = Number(o.pagado);
      saldoCorrido += cargo - abono;
      const estado =
        o.estado === EstadoOrdenCompra.CANCELADA
          ? 'CANCELADA'
          : abono >= cargo && cargo > 0
            ? 'PAGADA'
            : abono > 0
              ? 'PARCIAL'
              : 'PENDIENTE';
      return {
        fecha: o.fecha.toISOString(),
        folio: o.folio,
        concepto: o.descripcion,
        cargo,
        abono,
        saldo: saldoCorrido,
        estado,
      };
    });

    const totales = movimientos.reduce(
      (acc, m) => ({
        cargo: acc.cargo + m.cargo,
        abono: acc.abono + m.abono,
      }),
      { cargo: 0, abono: 0 },
    );

    return {
      proveedorId,
      proveedor: proveedor.nombre,
      movimientos,
      totales: { ...totales, saldo: totales.cargo - totales.abono },
    };
  }

  // ────────────────────────────────────────────
  //  ÓRDENES DE COMPRA — LISTAR
  // ────────────────────────────────────────────
  async findAllOrdenes(query: QueryOrdenesCompraDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const where: Prisma.ordenes_compraWhereInput = {
      eliminado_en: null,
    };

    if (query.search) {
      where.OR = [
        { folio: { contains: query.search, mode: 'insensitive' } },
        { descripcion: { contains: query.search, mode: 'insensitive' } },
        { proveedores: { nombre: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    if (query.proveedorId) {
      where.proveedor_id = query.proveedorId;
    }

    if (query.estado) {
      where.estado = query.estado;
    }

    const [items, total] = await Promise.all([
      this.prisma.ordenes_compra.findMany({
        where,
        include: {
          proveedores: { select: { id: true, nombre: true } },
        },
        orderBy: [{ fecha: 'desc' }, { folio: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.ordenes_compra.count({ where }),
    ]);

    return {
      items: items.map((item) => this.serializeOrden(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  // ────────────────────────────────────────────
  //  ÓRDENES DE COMPRA — OBTENER UNA
  // ────────────────────────────────────────────
  async findOneOrden(id: string) {
    const orden = await this.prisma.ordenes_compra.findFirst({
      where: { id, eliminado_en: null },
      include: {
        proveedores: { select: { id: true, nombre: true } },
        pagos_proveedor: {
          where: { eliminado_en: null },
          orderBy: { fecha_pago: 'asc' },
        },
      },
    });

    if (!orden) {
      return this.fallir(
        AuditAction.ORDEN_COMPRA_ACTUALIZADA,
        id,
        'ORDEN_COMPRA_NO_ENCONTRADA',
        NotFoundException,
        `Orden de compra con id "${id}" no encontrada`,
      );
    }

    return {
      ...this.serializeOrden(orden),
      abonos: orden!.pagos_proveedor.map((p) => ({
        id: p.id,
        codigo: p.codigo,
        monto: Number(p.monto),
        fechaPago: p.fecha_pago.toISOString(),
        metodoPago: p.metodo_pago,
        referencia: p.referencia ?? null,
      })),
    };
  }

  // ────────────────────────────────────────────
  //  ÓRDENES DE COMPRA — CREAR (OC + CxP en $transaction)
  // ────────────────────────────────────────────
  async createOrden(dto: CreateOrdenCompraDto, userId: string) {
    const proveedor = await this.prisma.proveedores.findFirst({
      where: { id: dto.proveedorId, eliminado_en: null },
    });

    if (!proveedor) {
      return this.fallir(
        AuditAction.ORDEN_COMPRA_CREADA,
        dto.proveedorId,
        'PROVEEDOR_NO_ENCONTRADO',
        NotFoundException,
        `Proveedor con id "${dto.proveedorId}" no encontrado`,
      );
    }

    const fecha = dto.fecha ? new Date(dto.fecha) : new Date();
    const id = randomUUID();
    const now = new Date();

    try {
      const creada = await this.prisma.$transaction(async (tx) => {
        const folio = await this.generarFolioOrden(tx, fecha);

        const orden = await tx.ordenes_compra.create({
          data: {
            id,
            folio,
            proveedor_id: dto.proveedorId,
            descripcion: dto.descripcion.trim(),
            monto: dto.monto,
            pagado: 0,
            fecha,
            estado: EstadoOrdenCompra.PENDIENTE,
            creado_por: userId,
            actualizado_por: userId,
            actualizado_en: now,
          },
        });

        await tx.cuentas_por_pagar.create({
          data: {
            id: randomUUID(),
            proveedor_id: dto.proveedorId,
            orden_compra_id: orden.id,
            monto: dto.monto,
            monto_pagado: 0,
            estado: 'PENDIENTE',
            activo: true,
            actualizado_en: now,
          },
        });

        return orden;
      });

      const serialized = this.serializeOrden(creada);

      await this.auditService.log({
        action: AuditAction.ORDEN_COMPRA_CREADA,
        entityType: 'ordenes_compra',
        entityId: id,
        result: AuditResult.SUCCESS,
        actorUserId: userId,
        actorType: 'USER',
        actorRole: 'autenticado',
        newValue: serialized,
      });

      return serialized;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return this.fallir(
          AuditAction.ORDEN_COMPRA_CREADA,
          id,
          'FOLIO_DUPLICADO',
          ConflictException,
          'No se pudo generar un folio único, intente nuevamente',
        );
      }
      throw error;
    }
  }

  // ────────────────────────────────────────────
  //  ÓRDENES DE COMPRA — ACTUALIZAR (solo PENDIENTE/APROBADA)
  // ────────────────────────────────────────────
  async updateOrden(id: string, dto: UpdateOrdenCompraDto, userId: string) {
    const existente = await this.prisma.ordenes_compra.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.ORDEN_COMPRA_ACTUALIZADA,
        id,
        'ORDEN_COMPRA_NO_ENCONTRADA',
        NotFoundException,
        `Orden de compra con id "${id}" no encontrada`,
      );
    }

    if (
      existente.estado !== EstadoOrdenCompra.PENDIENTE &&
      existente.estado !== EstadoOrdenCompra.APROBADA
    ) {
      return this.fallir(
        AuditAction.ORDEN_COMPRA_ACTUALIZADA,
        id,
        'ORDEN_NO_EDITABLE',
        BadRequestException,
        'Solo se pueden editar órdenes en estado PENDIENTE o APROBADA',
      );
    }

    if (dto.monto !== undefined && Number(existente.pagado) > 0 && dto.monto < Number(existente.pagado)) {
      return this.fallir(
        AuditAction.ORDEN_COMPRA_ACTUALIZADA,
        id,
        'MONTO_MENOR_A_PAGADO',
        BadRequestException,
        'El monto no puede ser menor a lo ya pagado',
      );
    }

    const orden = await this.prisma.$transaction(async (tx) => {
      const actualizada = await tx.ordenes_compra.update({
        where: { id },
        data: {
          ...(dto.descripcion !== undefined && { descripcion: dto.descripcion.trim() }),
          ...(dto.monto !== undefined && { monto: dto.monto }),
          actualizado_por: userId,
          actualizado_en: new Date(),
        },
      });

      // Mantener CxP coherente con el monto de la OC.
      if (dto.monto !== undefined) {
        const cxp = await tx.cuentas_por_pagar.findUnique({
          where: { orden_compra_id: id },
        });
        if (cxp) {
          await tx.cuentas_por_pagar.update({
            where: { id: cxp.id },
            data: { monto: dto.monto, actualizado_en: new Date() },
          });
        }
      }

      return actualizada;
    });

    const serialized = this.serializeOrden(orden);

    await this.auditService.log({
      action: AuditAction.ORDEN_COMPRA_ACTUALIZADA,
      entityType: 'ordenes_compra',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.serializeOrden(existente as never),
      newValue: serialized,
    });

    return serialized;
  }

  // ────────────────────────────────────────────
  //  ÓRDENES DE COMPRA — ELIMINAR (soft, solo sin pagos)
  // ────────────────────────────────────────────
  async removeOrden(id: string, userId: string) {
    const existente = await this.prisma.ordenes_compra.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.ORDEN_COMPRA_ELIMINADA,
        id,
        'ORDEN_COMPRA_NO_ENCONTRADA',
        NotFoundException,
        `Orden de compra con id "${id}" no encontrada`,
      );
    }

    if (Number(existente.pagado) > 0) {
      return this.fallir(
        AuditAction.ORDEN_COMPRA_ELIMINADA,
        id,
        'ORDEN_CON_PAGOS',
        ConflictException,
        'No se puede eliminar una orden de compra que ya tiene abonos',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.ordenes_compra.update({
        where: { id },
        data: { eliminado_en: new Date(), activo: false },
      });
      const cxp = await tx.cuentas_por_pagar.findUnique({
        where: { orden_compra_id: id },
      });
      if (cxp) {
        await tx.cuentas_por_pagar.update({
          where: { id: cxp.id },
          data: { activo: false, estado: 'CANCELADA', actualizado_en: new Date() },
        });
      }
    });

    await this.auditService.log({
      action: AuditAction.ORDEN_COMPRA_ELIMINADA,
      entityType: 'ordenes_compra',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.serializeOrden(existente as never),
    });

    return { message: 'Orden de compra eliminada exitosamente' };
  }

  // ────────────────────────────────────────────
  //  ÓRDENES DE COMPRA — CAMBIAR ESTADO
  // ────────────────────────────────────────────
  async cambiarEstadoOrden(
    id: string,
    dto: CambiarEstadoOrdenDto,
    userId: string,
  ) {
    const existente = await this.prisma.ordenes_compra.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.ORDEN_COMPRA_ESTADO_CAMBIADO,
        id,
        'ORDEN_COMPRA_NO_ENCONTRADA',
        NotFoundException,
        `Orden de compra con id "${id}" no encontrada`,
      );
    }

    if (dto.estado === existente.estado) {
      return this.fallir(
        AuditAction.ORDEN_COMPRA_ESTADO_CAMBIADO,
        id,
        'ESTADO_SIN_CAMBIO',
        BadRequestException,
        'La orden ya se encuentra en ese estado',
      );
    }

    if (!TRANSICIONES[existente.estado].includes(dto.estado)) {
      return this.fallir(
        AuditAction.ORDEN_COMPRA_ESTADO_CAMBIADO,
        id,
        'TRANSICION_INVALIDA',
        BadRequestException,
        `No se puede pasar de ${existente.estado} a ${dto.estado}`,
      );
    }

    if (dto.estado === EstadoOrdenCompra.CANCELADA) {
      if (!dto.motivo) {
        return this.fallir(
          AuditAction.ORDEN_COMPRA_ESTADO_CAMBIADO,
          id,
          'MOTIVO_CANCELACION_REQUERIDO',
          BadRequestException,
          'Cancelar una orden requiere especificar el motivo',
        );
      }
      if (Number(existente.pagado) > 0) {
        return this.fallir(
          AuditAction.ORDEN_COMPRA_ESTADO_CAMBIADO,
          id,
          'ORDEN_CON_PAGOS',
          ConflictException,
          'No se puede cancelar una orden que ya tiene abonos',
        );
      }
    }

    const orden = await this.prisma.$transaction(async (tx) => {
      const actualizada = await tx.ordenes_compra.update({
        where: { id },
        data: {
          estado: dto.estado,
          motivo_cancelacion: dto.estado === EstadoOrdenCompra.CANCELADA ? dto.motivo! : null,
          actualizado_por: userId,
          actualizado_en: new Date(),
        },
      });

      if (dto.estado === EstadoOrdenCompra.CANCELADA) {
        const cxp = await tx.cuentas_por_pagar.findUnique({
          where: { orden_compra_id: id },
        });
        if (cxp) {
          await tx.cuentas_por_pagar.update({
            where: { id: cxp.id },
            data: { estado: 'CANCELADA', activo: false, actualizado_en: new Date() },
          });
        }
      }

      return actualizada;
    });

    const serialized = this.serializeOrden(orden);

    await this.auditService.log({
      action: AuditAction.ORDEN_COMPRA_ESTADO_CAMBIADO,
      entityType: 'ordenes_compra',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.serializeOrden(existente as never),
      newValue: serialized,
    });

    return serialized;
  }

  // ────────────────────────────────────────────
  //  ABONOS — REGISTRAR ($transaction: pago + OC + CxP + finanzas)
  // ────────────────────────────────────────────
  async registrarAbono(
    proveedorId: string,
    dto: RegistrarAbonoDto,
    userId: string,
  ) {
    const proveedor = await this.prisma.proveedores.findFirst({
      where: { id: proveedorId, eliminado_en: null },
    });

    if (!proveedor) {
      return this.fallir(
        AuditAction.PAGO_PROVEEDOR_REGISTRADO,
        proveedorId,
        'PROVEEDOR_NO_ENCONTRADO',
        NotFoundException,
        `Proveedor con id "${proveedorId}" no encontrado`,
      );
    }

    const orden = await this.prisma.ordenes_compra.findFirst({
      where: {
        id: dto.ordenCompraId,
        proveedor_id: proveedorId,
        eliminado_en: null,
      },
    });

    if (!orden) {
      return this.fallir(
        AuditAction.PAGO_PROVEEDOR_REGISTRADO,
        proveedorId,
        'ORDEN_COMPRA_NO_ENCONTRADA',
        NotFoundException,
        `Orden de compra "${dto.ordenCompraId}" no encontrada para el proveedor`,
      );
    }

    if (orden.estado === EstadoOrdenCompra.CANCELADA) {
      return this.fallir(
        AuditAction.PAGO_PROVEEDOR_REGISTRADO,
        proveedorId,
        'ORDEN_CANCELADA',
        ConflictException,
        'No se puede abonar a una orden cancelada',
      );
    }

    const pagado = Number(orden.pagado);
    const monto = Number(orden.monto);
    if (pagado + dto.monto > monto + 0.0001) {
      return this.fallir(
        AuditAction.PAGO_PROVEEDOR_REGISTRADO,
        proveedorId,
        'ABONO_EXCEDE_MONTO',
        BadRequestException,
        `El abono excede el saldo pendiente (${(monto - pagado).toFixed(2)})`,
      );
    }

    // La máquina de estados de la OC solo permite PENDIENTE → APROBADA/CANCELADA.
    // Sin este guard, un abono que completa el pago llevaría una orden PENDIENTE
    // directo a RECIBIDA, saltando la aprobación. Regla de negocio: no se paga
    // una orden no aprobada.
    if (orden.estado === EstadoOrdenCompra.PENDIENTE) {
      return this.fallir(
        AuditAction.PAGO_PROVEEDOR_REGISTRADO,
        proveedorId,
        'ORDEN_PENDIENTE_NO_ABONABLE',
        ConflictException,
        'No se puede abonar a una orden pendiente de aprobación: aprueba la orden primero',
      );
    }

    const fechaPago = dto.fechaPago ? new Date(dto.fechaPago) : new Date();
    const idPago = randomUUID();
    const idTx = randomUUID();
    const now = new Date();

    const pago = await this.prisma.$transaction(async (tx) => {
      const nuevoPagado = pagado + dto.monto;
      const estadoOrden =
        nuevoPagado >= monto - 0.0001
          ? EstadoOrdenCompra.RECIBIDA
          : orden.estado;
      const estadoCxp =
        nuevoPagado >= monto - 0.0001
          ? 'PAGADA'
          : nuevoPagado > 0
            ? 'PARCIAL'
            : 'PENDIENTE';

      const codigo = await this.generarCodigoAbono(tx, fechaPago);

      const nuevo = await tx.pagos_proveedor.create({
        data: {
          id: idPago,
          codigo,
          proveedor_id: proveedorId,
          orden_compra_id: orden.id,
          monto: dto.monto,
          fecha_pago: fechaPago,
          metodo_pago: dto.metodoPago ?? 'EFECTIVO',
          referencia: dto.referencia?.trim() || null,
          creado_por: userId,
        },
      });

      await tx.ordenes_compra.update({
        where: { id: orden.id },
        data: {
          pagado: nuevoPagado,
          estado: estadoOrden,
          actualizado_por: userId,
          actualizado_en: now,
        },
      });

      const cxp = await tx.cuentas_por_pagar.findUnique({
        where: { orden_compra_id: orden.id },
      });
      if (cxp) {
        await tx.cuentas_por_pagar.update({
          where: { id: cxp.id },
          data: {
            monto_pagado: nuevoPagado,
            estado: estadoCxp,
            actualizado_en: now,
          },
        });
      }

      await tx.transacciones.create({
        data: {
          id: idTx,
          codigo: generarCodigoTransaccion(),
          tipo: 'EGRESO',
          categoria: 'PROVEEDORES',
          monto: dto.monto,
          fecha: fechaPago,
          descripcion: `Abono a ${orden.folio} — ${proveedor.nombre}`,
          entidad_tipo: 'PROVEEDOR',
          entidad_id: proveedorId,
          creado_por: userId,
          actualizado_por: userId,
          actualizado_en: now,
        },
      });

      return nuevo;
    });

    await this.auditService.log({
      action: AuditAction.PAGO_PROVEEDOR_REGISTRADO,
      entityType: 'pagos_proveedor',
      entityId: idPago,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: {
        codigo: pago.codigo,
        ordenCompraId: orden.id,
        proveedorId,
        monto: dto.monto,
        fechaPago: fechaPago.toISOString(),
        metodoPago: pago.metodo_pago,
      },
    });

    return {
      abono: {
        id: idPago,
        codigo: pago.codigo,
        monto: dto.monto,
        fechaPago: fechaPago.toISOString(),
        metodoPago: pago.metodo_pago,
      },
      orden: this.serializeOrden({
        ...orden,
        pagado: pagado + dto.monto,
        estado: pago.orden_compra_id === orden.id && pagado + dto.monto >= monto - 0.0001
          ? EstadoOrdenCompra.RECIBIDA
          : orden.estado,
      } as never),
    };
  }

  // ────────────────────────────────────────────
  //  PRIVADOS
  // ────────────────────────────────────────────
  /** Genera folio OC-YYYY-NNN con contador del año. */
  private async generarFolioOrden(
    tx: Prisma.TransactionClient,
    fecha: Date,
  ): Promise<string> {
    const anio = fecha.getFullYear();
    const totalAnio = await tx.ordenes_compra.count({
      where: {
        fecha: { gte: new Date(`${anio}-01-01`), lt: new Date(`${anio + 1}-01-01`) },
      },
    });
    return `OC-${anio}-${String(totalAnio + 1).padStart(3, '0')}`;
  }

  /** Genera código PAG-PROV-YYYY-NNN con contador del año. */
  private async generarCodigoAbono(
    tx: Prisma.TransactionClient,
    fecha: Date,
  ): Promise<string> {
    const anio = fecha.getFullYear();
    const totalAnio = await tx.pagos_proveedor.count({
      where: {
        fecha_pago: { gte: new Date(`${anio}-01-01`), lt: new Date(`${anio + 1}-01-01`) },
      },
    });
    return `PAG-PROV-${anio}-${String(totalAnio + 1).padStart(3, '0')}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serializeProveedor(proveedor: any) {
    return {
      id: proveedor.id,
      codigo: proveedor.codigo ?? null,
      nombre: proveedor.nombre,
      rfc: proveedor.rfc ?? null,
      correo: proveedor.correo ?? null,
      telefono: proveedor.telefono ?? null,
      categoria: proveedor.categoria ?? 'Otros',
      activo: proveedor.activo,
      creadoEn: proveedor.creado_en?.toISOString?.() ?? proveedor.creado_en,
      actualizadoEn:
        proveedor.actualizado_en?.toISOString?.() ?? proveedor.actualizado_en,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serializeOrden(orden: any) {
    return {
      id: orden.id,
      folio: orden.folio,
      proveedorId: orden.proveedor_id,
      proveedor: orden.proveedores?.nombre ?? null,
      descripcion: orden.descripcion,
      monto: Number(orden.monto),
      pagado: Number(orden.pagado),
      saldo: Number(orden.monto) - Number(orden.pagado),
      fecha: orden.fecha?.toISOString?.() ?? orden.fecha,
      estado: orden.estado,
      motivoCancelacion: orden.motivo_cancelacion ?? null,
      activo: orden.activo,
    };
  }
}