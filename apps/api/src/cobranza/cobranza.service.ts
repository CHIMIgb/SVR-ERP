import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma, AuditAction, AuditResult } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CrearCuentaDto } from './dto/crear-cuenta.dto';
import { ActualizarCuentaDto } from './dto/actualizar-cuenta.dto';
import { RegistrarCobroDto } from './dto/registrar-cobro.dto';
import { ListarCuentasQuery } from './dto/listar-cuentas.query';

/** Placeholder para auditoría de fallos donde aún no hay entidad conocida. */
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

/** Días de atraso a partir de los cuales la situación es ATRASO_GRAVE. */
const DIAS_ATRASO_GRAVE = 30;

/** Genera un folio de transacción para finanzas (TRA-YYYYMMDD-UUID6). */
function generarCodigoTransaccion(): string {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}`;
  const sufijo = randomUUID().slice(0, 6).toUpperCase();
  return `TRA-${ymd}-${sufijo}`;
}

/** Inicio del día de hoy (00:00:00) para cálculos de atraso. */
function inicioDeHoy(): Date {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy;
}

@Injectable()
export class CobranzaService {
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
      entityType: 'cuentas_por_cobrar',
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
    });
    throw new Excepcion(message);
  }

  // ────────────────────────────────────────────
  //  CUENTAS — LISTAR
  // ────────────────────────────────────────────
  async findAll(query: ListarCuentasQuery) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const where = this.construirWhere(query);

    const [items, total] = await Promise.all([
      this.prisma.cuentas_por_cobrar.findMany({
        where,
        include: {
          clientes: { select: { id: true, nombre: true, empresa: true } },
          facturas: { select: { serie: true, folio: true } },
          pagos: {
            take: 1,
            orderBy: { fecha_pago: 'desc' },
            select: { fecha_pago: true },
          },
        },
        orderBy: [{ fecha_vencimiento: 'asc' }, { creado_en: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.cuentas_por_cobrar.count({ where }),
    ]);

    return {
      items: items.map((item) => this.serializeCuenta(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  // ────────────────────────────────────────────
  //  CUENTAS — OBTENER UNA
  // ────────────────────────────────────────────
  async findOne(id: string) {
    const cuenta = await this.prisma.cuentas_por_cobrar.findFirst({
      where: { id, activo: true },
      include: {
        clientes: { select: { id: true, nombre: true, empresa: true } },
        facturas: { select: { serie: true, folio: true } },
        pagos: {
          take: 5,
          orderBy: { fecha_pago: 'desc' },
          select: { id: true, monto: true, fecha_pago: true, metodo_pago: true, referencia: true },
        },
      },
    });

    if (!cuenta) {
      return this.fallir(
        AuditAction.CXC_CONSULTADA,
        id,
        'CUENTA_NO_ENCONTRADA',
        NotFoundException,
        `Cuenta por cobrar con id "${id}" no encontrada`,
      );
    }

    return this.serializeCuenta(cuenta);
  }

  // ────────────────────────────────────────────
  //  CUENTAS — CREAR
  // ────────────────────────────────────────────
  async crearCuenta(dto: CrearCuentaDto, userId: string) {
    const cliente = await this.prisma.clientes.findFirst({
      where: { id: dto.clienteId, activo: true, eliminado_en: null },
    });

    if (!cliente) {
      return this.fallir(
        AuditAction.CXC_CREADA,
        null,
        'CLIENTE_NO_ENCONTRADO',
        NotFoundException,
        `Cliente con id "${dto.clienteId}" no encontrado`,
      );
    }

    if (dto.facturaId) {
      const factura = await this.prisma.facturas.findFirst({
        where: { id: dto.facturaId, activo: true },
      });
      if (!factura) {
        return this.fallir(
          AuditAction.CXC_CREADA,
          null,
          'FACTURA_NO_ENCONTRADA',
          NotFoundException,
          `Factura con id "${dto.facturaId}" no encontrada`,
        );
      }
      if (factura.cliente_id !== dto.clienteId) {
        return this.fallir(
          AuditAction.CXC_CREADA,
          null,
          'FACTURA_DE_OTRO_CLIENTE',
          ConflictException,
          'La factura pertenece a otro cliente',
        );
      }
      const duplicada = await this.prisma.cuentas_por_cobrar.findUnique({
        where: { factura_id: dto.facturaId },
      });
      if (duplicada) {
        return this.fallir(
          AuditAction.CXC_CREADA,
          null,
          'FACTURA_YA_EN_CXC',
          ConflictException,
          'La factura ya tiene una cuenta por cobrar asociada',
        );
      }
    }

    const cuenta = await this.prisma.cuentas_por_cobrar.create({
      data: {
        id: randomUUID(),
        cliente_id: dto.clienteId,
        factura_id: dto.facturaId ?? null,
        monto: dto.monto,
        monto_pagado: 0,
        fecha_vencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
        estado: 'PENDIENTE',
        activo: true,
        actualizado_en: new Date(),
      },
      include: {
        clientes: { select: { id: true, nombre: true, empresa: true } },
        facturas: { select: { serie: true, folio: true } },
      },
    });

    await this.auditService.log({
      action: AuditAction.CXC_CREADA,
      entityType: 'cuentas_por_cobrar',
      entityId: cuenta.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: {
        clienteId: dto.clienteId,
        facturaId: dto.facturaId ?? null,
        monto: dto.monto,
        fechaVencimiento: dto.fechaVencimiento ?? null,
      },
    });

    return this.serializeCuenta(cuenta);
  }

  // ────────────────────────────────────────────
  //  CUENTAS — ACTUALIZAR (solo sin cobros)
  // ────────────────────────────────────────────
  async actualizarCuenta(id: string, dto: ActualizarCuentaDto, userId: string) {
    const existente = await this.prisma.cuentas_por_cobrar.findFirst({
      where: { id, activo: true },
      include: {
        clientes: { select: { id: true, nombre: true, empresa: true } },
        facturas: { select: { serie: true, folio: true } },
      },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.CXC_ACTUALIZADA,
        id,
        'CUENTA_NO_ENCONTRADA',
        NotFoundException,
        `Cuenta por cobrar con id "${id}" no encontrada`,
      );
    }

    const pagosCount = await this.prisma.pagos.count({
      where: { cuenta_por_cobrar_id: id },
    });
    if (pagosCount > 0) {
      return this.fallir(
        AuditAction.CXC_ACTUALIZADA,
        id,
        'CXC_CON_PAGOS',
        ConflictException,
        'La cuenta ya tiene cobros registrados; no se puede modificar el monto ni el vencimiento',
      );
    }

    const cuenta = await this.prisma.cuentas_por_cobrar.update({
      where: { id },
      data: {
        monto: dto.monto,
        fecha_vencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : undefined,
        actualizado_en: new Date(),
      },
      include: {
        clientes: { select: { id: true, nombre: true, empresa: true } },
        facturas: { select: { serie: true, folio: true } },
      },
    });

    await this.auditService.log({
      action: AuditAction.CXC_ACTUALIZADA,
      entityType: 'cuentas_por_cobrar',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.serializeCuenta(existente as never),
      newValue: this.serializeCuenta(cuenta),
    });

    return this.serializeCuenta(cuenta);
  }

  // ────────────────────────────────────────────
  //  COBROS — REGISTRAR ($transaction: pago + CxC + finanzas)
  // ────────────────────────────────────────────
  async registrarCobro(id: string, dto: RegistrarCobroDto, userId: string) {
    const cuenta = await this.prisma.cuentas_por_cobrar.findFirst({
      where: { id, activo: true },
      include: {
        clientes: { select: { id: true, nombre: true, empresa: true } },
        facturas: { select: { serie: true, folio: true } },
      },
    });

    if (!cuenta) {
      return this.fallir(
        AuditAction.COBRO_REGISTRADO,
        id,
        'CUENTA_NO_ENCONTRADA',
        NotFoundException,
        `Cuenta por cobrar con id "${id}" no encontrada`,
      );
    }

    const saldo = Number(cuenta.monto) - Number(cuenta.monto_pagado);
    if (dto.monto > saldo + 0.0001) {
      return this.fallir(
        AuditAction.COBRO_REGISTRADO,
        id,
        'COBRO_EXCEDE_SALDO',
        BadRequestException,
        `El cobro excede el saldo pendiente (${saldo.toFixed(2)})`,
      );
    }

    const fechaPago = dto.fecha ? new Date(dto.fecha) : new Date();
    if (Number.isNaN(fechaPago.getTime())) {
      return this.fallir(
        AuditAction.COBRO_REGISTRADO,
        id,
        'FECHA_INVALIDA',
        BadRequestException,
        'La fecha de pago no es válida',
      );
    }

    const idPago = randomUUID();
    const now = new Date();

    const pago = await this.prisma.$transaction(async (tx) => {
      const nuevoPagado = Number(cuenta.monto_pagado) + dto.monto;
      // Dominio legacy de CxC: PENDIENTE → PARCIAL → PAGADO (el API expone
      // 'SALDADO' a la UI; el mapeo vive en serializeCuenta).
      const estadoCxc =
        nuevoPagado >= Number(cuenta.monto) - 0.0001 ? 'PAGADO' : 'PARCIAL';

      const codigo = await this.generarCodigoCobro(tx, fechaPago);

      const nuevo = await tx.pagos.create({
        data: {
          id: idPago,
          codigo,
          cliente_id: cuenta.cliente_id,
          factura_id: cuenta.factura_id,
          cuenta_por_cobrar_id: cuenta.id,
          monto: dto.monto,
          fecha_pago: fechaPago,
          metodo_pago: dto.metodoPago ?? 'EFECTIVO',
          referencia: dto.referencia?.trim() || null,
          // Dominio legacy de pagos: PENDIENTE → CONFIRMADO → RECHAZADO.
          // Un cobro recibido queda CONFIRMADO (el ledger filtra por CxC + activo).
          estado: 'CONFIRMADO',
          creado_por: userId,
          actualizado_por: userId,
          actualizado_en: now,
        },
      });

      await tx.cuentas_por_cobrar.update({
        where: { id: cuenta.id },
        data: {
          monto_pagado: nuevoPagado,
          estado: estadoCxc,
          actualizado_en: now,
        },
      });

      await tx.transacciones.create({
        data: {
          id: randomUUID(),
          codigo: generarCodigoTransaccion(),
          tipo: 'INGRESO',
          categoria: 'COBRANZA',
          monto: dto.monto,
          fecha: fechaPago,
          descripcion: `Cobro ${codigo} — ${cuenta.clientes.nombre}`,
          entidad_tipo: 'COBRO',
          entidad_id: idPago,
          creado_por: userId,
          actualizado_por: userId,
          actualizado_en: now,
        },
      });

      return nuevo;
    });

    const cuentaActualizada = await this.prisma.cuentas_por_cobrar.findFirst({
      where: { id },
      include: {
        clientes: { select: { id: true, nombre: true, empresa: true } },
        facturas: { select: { serie: true, folio: true } },
        pagos: {
          take: 1,
          orderBy: { fecha_pago: 'desc' },
          select: { fecha_pago: true },
        },
      },
    });

    await this.auditService.log({
      action: AuditAction.COBRO_REGISTRADO,
      entityType: 'pagos',
      entityId: idPago,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: {
        codigo: pago.codigo,
        cuentaId: id,
        clienteNombre: cuenta.clientes.nombre,
        monto: dto.monto,
        fechaPago: fechaPago.toISOString(),
        metodoPago: pago.metodo_pago,
      },
    });

    return {
      cobro: {
        id: idPago,
        cuentaId: id,
        clienteNombre: cuenta.clientes.nombre,
        monto: dto.monto,
        fecha: fechaPago.toISOString(),
        referencia: pago.referencia,
        metodoPago: pago.metodo_pago,
      },
      cuenta: this.serializeCuenta(cuentaActualizada ?? (cuenta as never)),
    };
  }

  // ────────────────────────────────────────────
  //  COBROS — LEDGER POR CUENTA
  // ────────────────────────────────────────────
  async cobrosDeCuenta(id: string) {
    const cuenta = await this.prisma.cuentas_por_cobrar.findFirst({
      where: { id, activo: true },
      select: { id: true, cliente_id: true, monto: true, monto_pagado: true },
    });

    if (!cuenta) {
      return this.fallir(
        AuditAction.CXC_CONSULTADA,
        id,
        'CUENTA_NO_ENCONTRADA',
        NotFoundException,
        `Cuenta por cobrar con id "${id}" no encontrada`,
      );
    }

    const cobros = await this.prisma.pagos.findMany({
      where: { cuenta_por_cobrar_id: id, activo: true },
      orderBy: { fecha_pago: 'desc' },
      include: {
        clientes: { select: { nombre: true } },
      },
    });

    return {
      cuentaId: id,
      saldo: Number(cuenta.monto) - Number(cuenta.monto_pagado),
      cobros: cobros.map((cobro) => ({
        id: cobro.id,
        cuentaId: cobro.cuenta_por_cobrar_id,
        clienteNombre: cobro.clientes?.nombre ?? '',
        monto: Number(cobro.monto),
        fecha: cobro.fecha_pago.toISOString(),
        referencia: cobro.referencia ?? '—',
        metodoPago: cobro.metodo_pago,
      })),
    };
  }

  // ────────────────────────────────────────────
  //  STATS (para las 4 StatsCard del frontend)
  // ────────────────────────────────────────────
  async stats() {
    const hoy = inicioDeHoy();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioMesSig = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);

    const [agg, aggVencido, aggMes, cuentas] = await Promise.all([
      this.prisma.cuentas_por_cobrar.aggregate({
        where: { activo: true },
        _sum: { monto: true, monto_pagado: true },
      }),
      this.prisma.cuentas_por_cobrar.aggregate({
        where: {
          activo: true,
          estado: { not: 'PAGADO' },
          fecha_vencimiento: { lt: hoy },
        },
        _sum: { monto: true, monto_pagado: true },
      }),
      this.prisma.pagos.aggregate({
        where: {
          activo: true,
          fecha_pago: { gte: inicioMes, lt: inicioMesSig },
        },
        _sum: { monto: true },
      }),
      this.prisma.cuentas_por_cobrar.findMany({
        where: { activo: true },
        select: { cliente_id: true, monto: true, monto_pagado: true },
      }),
    ]);

    const saldoTotal = Number(agg._sum.monto || 0) - Number(agg._sum.monto_pagado || 0);
    const vencido =
      Number(aggVencido._sum.monto || 0) - Number(aggVencido._sum.monto_pagado || 0);

    const clientesConSaldo = new Set(
      cuentas
        .filter((c) => Number(c.monto) - Number(c.monto_pagado) > 0.0001)
        .map((c) => c.cliente_id),
    ).size;

    return {
      totalPorCobrar: saldoTotal,
      vencido,
      cobradoMes: Number(aggMes._sum.monto || 0),
      clientesConSaldo,
    };
  }

  // ────────────────────────────────────────────
  //  EXPORTAR — CSV de la cartera
  // ────────────────────────────────────────────
  async exportar(query: ListarCuentasQuery): Promise<string> {
    const where = this.construirWhere(query);
    const cuentas = await this.prisma.cuentas_por_cobrar.findMany({
      where,
      include: {
        clientes: { select: { id: true, nombre: true, empresa: true } },
        facturas: { select: { serie: true, folio: true } },
      },
      orderBy: [{ fecha_vencimiento: 'asc' }, { creado_en: 'desc' }],
    });

    const filas = cuentas.map((c) => {
      const s = this.serializeCuenta(c);
      return [
        s.id,
        s.clienteNombre,
        s.empresa,
        s.obra,
        s.facturaFolio,
        s.monto,
        s.saldo,
        s.fechaEmision,
        s.fechaVencimiento,
        s.diasAtraso,
        s.estado,
        s.situacion,
      ];
    });

    const encabezados = [
      'ID',
      'Cliente',
      'Empresa',
      'Obra',
      'Factura',
      'Monto',
      'Saldo',
      'Emision',
      'Vencimiento',
      'DiasAtraso',
      'Estado',
      'Situacion',
    ];

    const linea = (fila: (string | number)[]) =>
      fila
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',');

    return (
      '\uFEFF' +
      linea(encabezados) +
      '\n' +
      filas.map(linea).join('\n')
    );
  }

  // ────────────────────────────────────────────
  //  PRIVADOS
  // ────────────────────────────────────────────

  /** Construye el where de listado a partir de los filtros del query. */
  private construirWhere(query: ListarCuentasQuery): Prisma.cuentas_por_cobrarWhereInput {
    const where: Prisma.cuentas_por_cobrarWhereInput = {
      activo: true,
    };

    if (query.clienteId) {
      where.cliente_id = query.clienteId;
    }

    if (query.estado) {
      where.estado = query.estado === 'SALDADO' ? 'PAGADO' : query.estado;
    }

    if (query.situacion) {
      const hoy = inicioDeHoy();
      const hace30 = new Date(hoy);
      hace30.setDate(hace30.getDate() - (DIAS_ATRASO_GRAVE - 1));

      switch (query.situacion) {
        case 'SALDADO':
          where.estado = 'PAGADO';
          break;
        case 'AL_CORRIENTE':
          where.estado = { not: 'PAGADO' };
          where.OR = [{ fecha_vencimiento: null }, { fecha_vencimiento: { gte: hoy } }];
          break;
        case 'ATRASO_LEVE':
          where.estado = { not: 'PAGADO' };
          where.fecha_vencimiento = { gte: hace30, lt: hoy };
          break;
        case 'ATRASO_GRAVE':
          where.estado = { not: 'PAGADO' };
          where.fecha_vencimiento = { lt: hace30 };
          break;
      }
    }

    if (query.search) {
      where.clientes = {
        OR: [
          { nombre: { contains: query.search, mode: 'insensitive' } },
          { empresa: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    return where;
  }

  /** Genera código PAG-CXC-YYYY-NNN con contador del año (solo cobros a CxC). */
  private async generarCodigoCobro(
    tx: Prisma.TransactionClient,
    fecha: Date,
  ): Promise<string> {
    const anio = fecha.getFullYear();
    const totalAnio = await tx.pagos.count({
      where: {
        cuenta_por_cobrar_id: { not: null },
        fecha_pago: {
          gte: new Date(`${anio}-01-01`),
          lt: new Date(`${anio + 1}-01-01`),
        },
      },
    });
    return `PAG-CXC-${anio}-${String(totalAnio + 1).padStart(3, '0')}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serializeCuenta(cuenta: any) {
    const hoy = inicioDeHoy();
    const monto = Number(cuenta.monto);
    const pagado = Number(cuenta.monto_pagado);
    const saldo = monto - pagado;
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
    const facturaFolio = factura
      ? [factura.serie, factura.folio].filter(Boolean).join('-')
      : '';
    const ultimoPago = cuenta.pagos?.[0];

    return {
      id: cuenta.id,
      clienteId: cuenta.clientes.id,
      clienteNombre: cuenta.clientes.nombre,
      empresa: cuenta.clientes.empresa,
      obra: '',
      facturaFolio,
      monto,
      montoPagado: pagado,
      saldo,
      fechaEmision: cuenta.creado_en ? new Date(cuenta.creado_en).toISOString().slice(0, 10) : '',
      fechaVencimiento: cuenta.fecha_vencimiento
        ? new Date(cuenta.fecha_vencimiento).toISOString().slice(0, 10)
        : '',
      diasAtraso,
      estado: cuenta.estado === 'PAGADO' ? 'SALDADO' : cuenta.estado,
      situacion,
      ultimoCobroFecha: ultimoPago
        ? new Date(ultimoPago.fecha_pago).toISOString().slice(0, 10)
        : undefined,
    };
  }
}