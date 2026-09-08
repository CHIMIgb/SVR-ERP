import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  Prisma,
  AuditAction,
  AuditResult,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { QueryClientesDto } from './dto/query-clientes.dto';

/** Placeholder para auditoría de fallos donde aún no hay entidad conocida. */
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

/** Días de atraso a partir de los cuales la situación es ATRASO_GRAVE. */
const DIAS_ATRASO_GRAVE = 30;

/** Inicio del día de hoy (00:00:00) para cálculos de atraso. */
function inicioDeHoy(): Date {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy;
}

/** Serializa una fecha a formato ISO (yyyy-mm-dd) sin romper por null. */
function isoFecha(fecha: Date | null | undefined): string | null {
  return fecha && !Number.isNaN(new Date(fecha).getTime())
    ? new Date(fecha).toISOString().slice(0, 10)
    : null;
}

@Injectable()
export class ClientesService {
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
      entityType: 'clientes',
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
    });
    throw new Excepcion(message);
  }

  // ────────────────────────────────────────────
  //  LISTAR (con búsqueda y paginación)
  // ────────────────────────────────────────────
  async findAll(query: QueryClientesDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const where: Prisma.clientesWhereInput = {
      eliminado_en: null,
    };

    if (query.search) {
      where.OR = [
        { nombre: { contains: query.search, mode: 'insensitive' } },
        { empresa: { contains: query.search, mode: 'insensitive' } },
        { correo: { contains: query.search, mode: 'insensitive' } },
        { telefono: { contains: query.search, mode: 'insensitive' } },
        { rfc: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.activo !== undefined) {
      where.activo = query.activo === 'true';
    }

    const [items, total] = await Promise.all([
      this.prisma.clientes.findMany({
        where,
        orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.clientes.count({ where }),
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
  //  ESTADÍSTICAS (alimentan las tarjetas)
  // ────────────────────────────────────────────
  async findStats() {
    const [totalClientes, clientesActivos, empresas] = await Promise.all([
      this.prisma.clientes.count({ where: { eliminado_en: null } }),
      this.prisma.clientes.count({
        where: { eliminado_en: null, activo: true },
      }),
      this.prisma.clientes.groupBy({
        by: ['empresa'],
        where: { eliminado_en: null },
      }),
    ]);

    return {
      totalClientes,
      clientesActivos,
      empresas: empresas.length,
    };
  }

  // ────────────────────────────────────────────
  //  OBTENER UNO
  // ────────────────────────────────────────────
  async findOne(id: string) {
    const cliente = await this.prisma.clientes.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!cliente) {
      return this.fallir(
        AuditAction.CLIENTE_ACTUALIZADO,
        id,
        'CLIENTE_NO_ENCONTRADO',
        NotFoundException,
        `Cliente con id "${id}" no encontrado`,
      );
    }

    return this.serialize(cliente!);
  }

  // ────────────────────────────────────────────
  //  CREAR
  // ────────────────────────────────────────────
  async create(dto: CreateClienteDto, userId: string) {
    const cliente = await this.prisma.clientes.create({
      data: {
        id: randomUUID(),
        nombre: dto.nombre.trim(),
        empresa: dto.empresa.trim(),
        correo: dto.correo.trim(),
        telefono: dto.telefono.trim(),
        rfc: dto.rfc?.trim() || null,
        activo: dto.activo ?? true,
        creado_por: userId,
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
    });

    const serialized = this.serialize(cliente);

    await this.auditService.log({
      action: AuditAction.CLIENTE_CREADO,
      entityType: 'clientes',
      entityId: cliente.id,
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
  async update(id: string, dto: UpdateClienteDto, userId: string) {
    const existente = await this.prisma.clientes.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.CLIENTE_ACTUALIZADO,
        id,
        'CLIENTE_NO_ENCONTRADO',
        NotFoundException,
        `Cliente con id "${id}" no encontrado`,
      );
    }

    const cliente = await this.prisma.clientes.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
        ...(dto.empresa !== undefined && { empresa: dto.empresa.trim() }),
        ...(dto.correo !== undefined && { correo: dto.correo.trim() }),
        ...(dto.telefono !== undefined && { telefono: dto.telefono.trim() }),
        ...(dto.rfc !== undefined && { rfc: dto.rfc?.trim() || null }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
    });

    const serialized = this.serialize(cliente);

    await this.auditService.log({
      action: AuditAction.CLIENTE_ACTUALIZADO,
      entityType: 'clientes',
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
    const existente = await this.prisma.clientes.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.CLIENTE_ELIMINADO,
        id,
        'CLIENTE_NO_ENCONTRADO',
        NotFoundException,
        `Cliente con id "${id}" no encontrado`,
      );
    }

    await this.prisma.clientes.update({
      where: { id },
      data: { eliminado_en: new Date(), activo: false },
    });

    await this.auditService.log({
      action: AuditAction.CLIENTE_ELIMINADO,
      entityType: 'clientes',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.serialize(existente as never),
    });

    return { message: 'Cliente eliminado exitosamente' };
  }

  // ────────────────────────────────────────────
  //  ESTADO DE CUENTA (C4)
  // ────────────────────────────────────────────
  async consolidado(id: string) {
    const cliente = await this.prisma.clientes.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!cliente) {
      return this.fallir(
        AuditAction.CLIENTE_ACTUALIZADO,
        id,
        'CLIENTE_NO_ENCONTRADO',
        NotFoundException,
        `Cliente con id "${id}" no encontrado`,
      );
    }

    const [cuentas, facturas, cobros, cotizaciones] = await Promise.all([
      // CxC activas del cliente (incluye saldadas: la traza no se borra).
      this.prisma.cuentas_por_cobrar.findMany({
        where: { cliente_id: id, activo: true },
        include: {
          facturas: { select: { serie: true, folio: true } },
          proyectos: { select: { id: true, codigo: true, nombre: true } },
        },
        orderBy: { fecha_vencimiento: 'asc' },
      }),
      this.prisma.facturas.findMany({
        where: { cliente_id: id, activo: true, eliminado_en: null },
        select: {
          id: true,
          codigo: true,
          serie: true,
          folio: true,
          total: true,
          estado: true,
          creado_en: true,
        },
        orderBy: { creado_en: 'desc' },
        take: 10,
      }),
      // Todos los cobros del cliente (activos y revertidos) para traza total.
      this.prisma.pagos.findMany({
        where: { cliente_id: id },
        include: { cuentas_por_cobrar: { select: { monto: true } } },
        orderBy: { fecha_pago: 'desc' },
        take: 10,
      }),
      this.prisma.cotizaciones.findMany({
        where: { cliente_id: id, activo: true, eliminado_en: null },
        select: {
          id: true,
          codigo: true,
          descripcion: true,
          monto: true,
          fecha: true,
          estado: true,
        },
        orderBy: { fecha: 'desc' },
        take: 10,
      }),
    ]);

    const saldoTotal = cuentas.reduce(
      (acc, c) => acc + (Number(c.monto) - Number(c.monto_pagado)),
      0,
    );

    return {
      cliente: this.serialize(cliente),
      saldoTotal,
      cuentasPorCobrar: cuentas.map((cuenta) => this.serializeCuentaCxc(cuenta)),
      facturas: facturas.map((factura) => ({
        id: factura.id,
        codigo: factura.codigo,
        folio: [factura.serie, factura.folio].filter(Boolean).join('-'),
        total: Number(factura.total),
        estado: factura.estado,
        fechaEmision: isoFecha(factura.creado_en as Date | null),
      })),
      cobros: cobros.map((cobro) => ({
        id: cobro.id,
        codigo: cobro.codigo,
        monto: Number(cobro.monto),
        fecha: isoFecha(cobro.fecha_pago),
        metodoPago: cobro.metodo_pago,
        referencia: cobro.referencia ?? null,
        estado: cobro.estado,
        revertido: !cobro.activo,
        cuentaMonto: cobro.cuentas_por_cobrar
          ? Number(cobro.cuentas_por_cobrar.monto)
          : null,
      })),
      cotizaciones: cotizaciones.map((cotizacion) => ({
        id: cotizacion.id,
        codigo: cotizacion.codigo,
        descripcion: cotizacion.descripcion,
        monto: Number(cotizacion.monto),
        fecha: isoFecha(cotizacion.fecha),
        estado: cotizacion.estado,
      })),
    };
  }

  // ────────────────────────────────────────────
  //  PRIVADOS
  // ────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serialize(cliente: any) {
    return {
      id: cliente.id,
      codigo: cliente.codigo ?? null,
      nombre: cliente.nombre,
      empresa: cliente.empresa,
      correo: cliente.correo,
      telefono: cliente.telefono,
      rfc: cliente.rfc ?? null,
      activo: cliente.activo,
      creadoEn: cliente.creado_en?.toISOString?.() ?? cliente.creado_en,
      actualizadoEn:
        cliente.actualizado_en?.toISOString?.() ?? cliente.actualizado_en,
    };
  }

  /** CxC consolidada: saldo, estado, vencimiento y situación de atraso. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serializeCuentaCxc(cuenta: any) {
    const hoy = inicioDeHoy();
    const monto = Number(cuenta.monto);
    const montoPagado = Number(cuenta.monto_pagado);
    const saldo = monto - montoPagado;

    let diasAtraso = 0;
    if (cuenta.fecha_vencimiento && saldo > 0.0001) {
      const venc = new Date(cuenta.fecha_vencimiento);
      diasAtraso = Math.max(0, Math.floor((hoy.getTime() - venc.getTime()) / 86400000));
    }

    let situacion: string;
    if (saldo <= 0.0001) {
      situacion = 'SALDADO';
    } else if (!cuenta.fecha_vencimiento || new Date(cuenta.fecha_vencimiento) >= hoy) {
      situacion = 'AL_CORRIENTE';
    } else if (diasAtraso < DIAS_ATRASO_GRAVE) {
      situacion = 'ATRASO_LEVE';
    } else {
      situacion = 'ATRASO_GRAVE';
    }

    const factura = cuenta.facturas;
    const proyecto = cuenta.proyectos;

    return {
      id: cuenta.id,
      facturaFolio: factura
        ? [factura.serie, factura.folio].filter(Boolean).join('-')
        : null,
      proyecto: proyecto
        ? { id: proyecto.id, codigo: proyecto.codigo ?? '', nombre: proyecto.nombre }
        : null,
      monto,
      montoPagado,
      saldo,
      fechaVencimiento: isoFecha(cuenta.fecha_vencimiento as Date | null),
      estado: cuenta.estado === 'PAGADO' ? 'SALDADO' : cuenta.estado,
      situacion,
      diasAtraso,
    };
  }
}
