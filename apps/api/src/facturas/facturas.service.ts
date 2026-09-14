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
import { CrearFacturaDto, ConceptoFacturaDto } from './dto/crear-factura.dto';
import { ActualizarFacturaDto } from './dto/actualizar-factura.dto';
import { CambiarEstadoFacturaDto } from './dto/cambiar-estado-factura.dto';
import { CrearConceptoDto, ActualizarConceptoDto, ListarFacturasQuery } from './dto/conceptos.dto';
import { escapeCsv } from '../common/csv';

/** Placeholder para auditoría de fallos donde aún no hay entidad conocida. */
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

/**
 * Máximo de intentos para asignar el folio secuencial FAC-YYYY-NNNN.
 * Dos creates concurrentes pueden generar el mismo `codigo` (count+1); al
 * chocar P2002 en el unique se reintenta con un conteo fresco (mismo patrón
 * que `facturar` en cotizaciones). En el último intento cae el sufijo UUID.
 */
const MAX_INTENTOS_FOLIO = 10;

const IVA_DEFAULT = 0.16;
const TASA_II = 0.02; // IVA importación (objeto 04)

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

@Injectable()
export class FacturasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

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
      entityType: 'facturas',
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
    });
    throw new Excepcion(message);
  }

  private async existeCliente(clienteId: string): Promise<boolean> {
    const c = await this.prisma.clientes.findFirst({
      where: { id: clienteId, activo: true, eliminado_en: null },
      select: { id: true },
    });
    return !!c;
  }

  /**
   * Calcula importe/IVA por concepto y los totales de la factura.
   * - importe = cantidad × valorUnitario (neto de descuento; descuento siempre 0 aquí)
   * - IVA = impuestoTasa (por concepto) si objeto_impuesto grava (04/01/02/03)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private calcularTotales(conceptos: any[]) {
    let subtotal = 0;
    let impuestos = 0;
    const lineas = conceptos.map((c: any) => {
      const importe = round2(Number(c.cantidad) * Number(c.valorUnitario));
      const grava = (c.objetoImpuesto ?? '04') !== '02'; // 02 = no objeto de IVA
      const tasa = c.impuestoTasa != null ? Number(c.impuestoTasa) : grava ? IVA_DEFAULT : 0;
      const impuestoImporte = grava ? round2(importe * tasa) : 0;
      subtotal += importe;
      impuestos += impuestoImporte;
      return { importe, impuestoImporte, tasa };
    });
    subtotal = round2(subtotal);
    impuestos = round2(impuestos);
    return { subtotal, impuestos, total: round2(subtotal + impuestos), lineas };
  }

  private conceptoData(
    c: CrearConceptoDto | ConceptoFacturaDto,
    linea: { importe: number; impuestoImporte: number; tasa: number },
  ) {
    return {
      id: randomUUID(),
      cantidad: c.cantidad,
      unidad: c.unidad,
      descripcion: c.descripcion,
      valor_unitario: c.valorUnitario,
      importe: linea.importe,
      descuento: 0,
      objeto_impuesto: c.objetoImpuesto ?? '04',
      impuesto_tasa: linea.tasa > 0 ? linea.tasa : null,
      impuesto_importe: linea.impuestoImporte > 0 ? linea.impuestoImporte : null,
      activo: true,
    };
  }

  private facturaDataBase(dto: CrearFacturaDto | ActualizarFacturaDto) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (dto.serie !== undefined) data.serie = dto.serie;
    if ('formaPago' in dto && dto.formaPago !== undefined) data.forma_pago = dto.formaPago;
    if ('metodoPago' in dto && dto.metodoPago !== undefined) data.metodo_pago = dto.metodoPago;
    if ('usoCfdi' in dto && dto.usoCfdi !== undefined) data.uso_cfdi = dto.usoCfdi;
    if (dto.moneda !== undefined) data.moneda = dto.moneda;
    if (dto.tipoCambio !== undefined) data.tipo_cambio = dto.tipoCambio;
    if ('periodoInicio' in dto && dto.periodoInicio) data.periodo_inicio = new Date(dto.periodoInicio);
    if ('periodoFin' in dto && dto.periodoFin) data.periodo_fin = new Date(dto.periodoFin);
    return data;
  }

  private async recalcularFactura(tx: Prisma.TransactionClient, facturaId: string) {
    const conceptos = await tx.factura_conceptos.findMany({
      where: { factura_id: facturaId, activo: true },
    });
    const mapper = conceptos.map((c: any) => ({
      cantidad: Number(c.cantidad),
      valorUnitario: Number(c.valor_unitario as unknown as number),
      impuesto_importe: c.impuesto_importe ? Number(c.impuesto_importe) : 0,
      importe: Number(c.importe),
      objetoImpuesto: c.objeto_impuesto,
    }));
    const subtotal = round2(mapper.reduce((s, l) => s + l.importe, 0));
    const impuestos = round2(mapper.reduce((s, l) => s + (l.impuesto_importe || 0), 0));
    await tx.facturas.update({
      where: { id: facturaId },
      data: {
        subtotal,
        impuestos,
        total: round2(subtotal + impuestos),
        actualizado_en: new Date(),
      },
    });
  }

  // ────────────────────────────────────────────
  //  FACTURAS — LISTAR
  // ────────────────────────────────────────────
  private buildWhere(query: ListarFacturasQuery): Prisma.facturasWhereInput {
    const where: Prisma.facturasWhereInput = { activo: true, eliminado_en: null };

    if (query.estado) where.estado = query.estado;
    if (query.clienteId) where.cliente_id = query.clienteId;
    if (query.search) {
      where.OR = [
        { codigo: { contains: query.search, mode: 'insensitive' } },
        { clientes: { empresa: { contains: query.search, mode: 'insensitive' } } },
        { clientes: { nombre: { contains: query.search, mode: 'insensitive' } } },
      ];
    }
    return where;
  }

  async findAll(query: ListarFacturasQuery) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const where = this.buildWhere(query);

    const [items, total] = await Promise.all([
      this.prisma.facturas.findMany({
        where,
        include: {
          clientes: { select: { id: true, nombre: true, empresa: true } },
          factura_conceptos: { where: { activo: true } },
          cuentas_por_cobrar: { select: { id: true, estado: true } },
        },
        orderBy: { creado_en: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.facturas.count({ where }),
    ]);

    return {
      items: items.map((f) => this.serialize(f)),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  // ────────────────────────────────────────────
  //  FACTURAS — ESTADÍSTICAS GLOBALES
  // ────────────────────────────────────────────
  async stats() {
    const [total, porEstado, facturado] = await Promise.all([
      this.prisma.facturas.count({ where: { activo: true, eliminado_en: null } }),
      this.prisma.facturas.groupBy({
        by: ['estado'],
        where: { activo: true, eliminado_en: null },
        _count: { _all: true },
      }),
      this.prisma.facturas.aggregate({
        where: { activo: true, eliminado_en: null, estado: { in: ['TIMBRADA', 'PAGADA'] } },
        _sum: { total: true },
      }),
    ]);

    const c = Object.fromEntries(porEstado.map((r) => [r.estado, r._count._all]));
    return {
      total,
      pendientes: c['PENDIENTE'] ?? 0,
      timbradas: c['TIMBRADA'] ?? 0,
      canceladas: c['CANCELADA'] ?? 0,
      montoTotal: Number(facturado._sum.total ?? 0),
    };
  }

  // ────────────────────────────────────────────
  //  FACTURAS — EXPORTAR CSV
  // ────────────────────────────────────────────
  async exportar(query: ListarFacturasQuery) {
    const facturas = await this.prisma.facturas.findMany({
      where: this.buildWhere(query),
      orderBy: { creado_en: 'desc' },
      include: {
        clientes: { select: { id: true, nombre: true, empresa: true, rfc: true } },
      },
    });

    const escape = escapeCsv;

    const lineas = facturas.map((f) =>
      [
        f.codigo,
        f.serie ?? '',
        f.folio ?? '',
        f.clientes?.empresa || f.clientes?.nombre || '',
        f.clientes?.rfc ?? '',
        f.creado_en.toISOString().slice(0, 10),
        Number(f.subtotal),
        Number(f.impuestos),
        Number(f.total),
        f.estado,
      ]
        .map(escape)
        .join(','),
    );

    return [
      '\ufeffCodigo,Serie,Folio,Cliente,RFC,FechaEmision,Subtotal,Impuestos,Total,Estado',
      ...lineas,
    ].join('\n');
  }

  // ────────────────────────────────────────────
  //  FACTURAS — VER UNA
  // ────────────────────────────────────────────
  async findOne(id: string) {
    const factura = await this.prisma.facturas.findFirst({
      where: { id, activo: true, eliminado_en: null },
      include: {
        clientes: { select: { id: true, nombre: true, empresa: true, rfc: true } },
        cotizaciones: { select: { id: true, codigo: true, monto: true } },
        factura_conceptos: {
          where: { activo: true },
          orderBy: { descripcion: 'asc' },
        },
        cuentas_por_cobrar: { select: { id: true, estado: true, monto_pagado: true } },
      },
    });
    if (!factura) {
      return this.fallir(
        AuditAction.FACTURA_ACTUALIZADA,
        id,
        'FACTURA_NO_ENCONTRADA',
        NotFoundException,
        `Factura con id "${id}" no encontrada`,
      );
    }
    return this.serialize(factura);
  }

  // ────────────────────────────────────────────
  //  FACTURAS — CREAR
  // ────────────────────────────────────────────
  async create(dto: CrearFacturaDto, userId: string) {
    if (!(await this.existeCliente(dto.clienteId))) {
      return this.fallir(
        AuditAction.FACTURA_CREADA,
        null,
        'CLIENTE_NO_ENCONTRADO',
        NotFoundException,
        `Cliente con id "${dto.clienteId}" no encontrado`,
      );
    }
    if (!dto.conceptos || dto.conceptos.length === 0) {
      return this.fallir(
        AuditAction.FACTURA_CREADA,
        null,
        'FACTURA_SIN_CONCEPTOS',
        BadRequestException,
        'La factura debe tener al menos un concepto',
      );
    }

    const { subtotal, impuestos, total, lineas } = this.calcularTotales(dto.conceptos);
    const serie = (dto.serie ?? 'F').toUpperCase();

    // Folio secuencial FAC-YYYY-NNNN con reintento anti-colisión (mismo patrón
    // que `facturar` en cotizaciones): dos creates concurrentes pueden generar
    // el mismo `codigo` (count+1); al chocar P2002 en el unique se reintenta
    // con un conteo fresco. En el último intento cae el sufijo UUID.
    let factura: Prisma.facturasGetPayload<Record<string, never>> | undefined;
    for (let intento = 0; intento < MAX_INTENTOS_FOLIO; intento++) {
      const anio = new Date().getFullYear();
      const conteo = await this.prisma.facturas.count({
        where: { codigo: { startsWith: `FAC-${anio}` } },
      });
      const codigo =
        intento === MAX_INTENTOS_FOLIO - 1
          ? `FAC-${anio}-${randomUUID().slice(0, 6).toUpperCase()}`
          : `FAC-${anio}-${String(conteo + 1).padStart(4, '0')}`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = this.facturaDataBase(dto);
      data.id = randomUUID();
      data.codigo = codigo;
      data.cliente_id = dto.clienteId;
      data.serie = serie;
      // El folio numérico deriva del mismo conteo que el código (como `facturar`):
      // una sola query count por intento y folios coherentes entre flujos.
      data.folio = String(conteo + 1).padStart(6, '0');
      data.subtotal = subtotal;
      data.impuestos = impuestos;
      data.total = total;
      data.moneda = dto.moneda ?? 'MXN';
      data.tipo_cambio = dto.tipoCambio ?? 1;
      data.estado = 'PENDIENTE';
      data.activo = true;
      data.creado_en = new Date();
      data.actualizado_en = new Date();
      data.creado_por = userId;
      data.actualizado_por = userId;
      data.factura_conceptos = {
        create: dto.conceptos.map((c, i) => this.conceptoData(c, lineas[i])),
      };

      try {
        factura = await this.prisma.facturas.create({ data });
        break;
      } catch (e) {
        // Patrón cobranza/proveedores (idioma-neutral): el único unique
        // colisionable en este create es `codigo` (Prisma 7 driver adapters
        // no expone meta.target; el texto del mensaje varía según el idioma
        // de Postgres — ver PR #11 Blocker "constraintP2002 idioma").
        if (
          intento < MAX_INTENTOS_FOLIO - 1 &&
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          continue; // colisión de folio: reintentar con conteo fresco
        }
        throw e;
      }
    }
    if (!factura) {
      // Inalcanzable: el último intento siempre lanza o asigna. Guard de tipos.
      throw new Error('No se pudo asignar folio de factura');
    }

    await this.auditService.log({
      action: AuditAction.FACTURA_CREADA,
      entityType: 'facturas',
      entityId: factura.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: { codigo: factura.codigo, clienteId: factura.cliente_id, subtotal, impuestos, total },
    });

    return this.findOne(factura.id);
  }

  // ────────────────────────────────────────────
  //  FACTURAS — EDITAR DATOS GENERALES (solo PENDIENTE)
  // ────────────────────────────────────────────
  async update(id: string, dto: ActualizarFacturaDto, userId: string) {
    const actual = await this.prisma.facturas.findFirst({ where: { id, activo: true, eliminado_en: null } });
    if (!actual) {
      return this.fallir(
        AuditAction.FACTURA_ACTUALIZADA,
        id,
        'FACTURA_NO_ENCONTRADA',
        NotFoundException,
        `Factura con id "${id}" no encontrada`,
      );
    }
    if (actual.estado !== 'PENDIENTE') {
      return this.fallir(
        AuditAction.FACTURA_ACTUALIZADA,
        id,
        'FACTURA_NO_EDITABLE',
        ConflictException,
        'Solo las facturas PENDIENTES se pueden editar',
      );
    }

    const data = this.facturaDataBase(dto);
    data.actualizado_por = userId;
    data.actualizado_en = new Date();

    const factura = await this.prisma.facturas.update({ where: { id }, data });

    await this.auditService.log({
      action: AuditAction.FACTURA_ACTUALIZADA,
      entityType: 'facturas',
      entityId: factura.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: { ...dto },
    });

    return this.findOne(factura.id);
  }

  /**
   * Eliminación lógica: solo facturas PENDIENTES sin CxC asociada.
   */
  async remove(id: string, userId: string) {
    const actual = await this.prisma.facturas.findFirst({
      where: { id, activo: true, eliminado_en: null },
      include: { cuentas_por_cobrar: { select: { id: true } } },
    });
    if (!actual) {
      return this.fallir(
        AuditAction.FACTURA_CANCELADA,
        id,
        'FACTURA_NO_ENCONTRADA',
        NotFoundException,
        `Factura con id "${id}" no encontrada`,
      );
    }
    if (actual.estado !== 'PENDIENTE') {
      return this.fallir(
        AuditAction.FACTURA_CANCELADA,
        id,
        'FACTURA_NO_ELIMINABLE',
        ConflictException,
        'Solo las facturas PENDIENTES se pueden eliminar',
      );
    }
    if (actual.cuentas_por_cobrar) {
      return this.fallir(
        AuditAction.FACTURA_CANCELADA,
        id,
        'FACTURA_CON_CXC',
        ConflictException,
        'La factura tiene una cuenta por cobrar asociada y no se puede eliminar',
      );
    }

    const factura = await this.prisma.facturas.update({
      where: { id },
      data: { activo: false, eliminado_en: new Date(), actualizado_en: new Date(), actualizado_por: userId },
    });

    await this.auditService.log({
      action: AuditAction.FACTURA_CANCELADA,
      entityType: 'facturas',
      entityId: factura.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: { motivo: 'Eliminación lógica' },
    });

    return { success: true, id: factura.id, codigo: factura.codigo };
  }

  // ────────────────────────────────────────────
  //  FACTURAS — CAMBIAR ESTADO (timbrar / cancelar)
  // ────────────────────────────────────────────
  async cambiarEstado(id: string, dto: CambiarEstadoFacturaDto, userId: string) {
    const actual = await this.prisma.facturas.findFirst({ where: { id, activo: true, eliminado_en: null } });
    if (!actual) {
      return this.fallir(
        AuditAction.FACTURA_ACTUALIZADA,
        id,
        'FACTURA_NO_ENCONTRADA',
        NotFoundException,
        `Factura con id "${id}" no encontrada`,
      );
    }

    if (dto.estado === 'TIMBRADA') {
      if (actual.estado !== 'PENDIENTE') {
        return this.fallir(
          AuditAction.FACTURA_TIMBRADA,
          id,
          'FACTURA_NO_TIMBRABLE',
          ConflictException,
          'Solo las facturas PENDIENTES se pueden timbrar',
        );
      }
      const factura = await this.prisma.facturas.update({
        where: { id },
        data: { estado: 'TIMBRADA', timbrado_en: new Date(), actualizado_en: new Date(), actualizado_por: userId },
      });
      await this.auditService.log({
        action: AuditAction.FACTURA_TIMBRADA,
        entityType: 'facturas',
        entityId: factura.id,
        result: AuditResult.SUCCESS,
        actorUserId: userId,
        actorType: 'USER',
        actorRole: 'autenticado',
        newValue: { codigo: factura.codigo },
      });
      return this.findOne(factura.id);
    }

    // CANCELADA
    if (!dto.motivoCancelacion) {
      return this.fallir(
        AuditAction.FACTURA_CANCELADA,
        id,
        'MOTIVO_CANCELACION_REQUERIDO',
        BadRequestException,
        'El motivo de cancelación es obligatorio',
      );
    }
    if (actual.estado !== 'PENDIENTE') {
      return this.fallir(
        AuditAction.FACTURA_CANCELADA,
        id,
        'FACTURA_NO_CANCELABLE',
        ConflictException,
        'Solo las facturas PENDIENTES se pueden cancelar',
      );
    }
    const factura = await this.prisma.facturas.update({
      where: { id },
      data: { estado: 'CANCELADA', actualizado_en: new Date(), actualizado_por: userId },
    });
    await this.auditService.log({
      action: AuditAction.FACTURA_CANCELADA,
      entityType: 'facturas',
      entityId: factura.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: { codigo: factura.codigo, motivo: dto.motivoCancelacion },
    });
    return this.findOne(factura.id);
  }

  // ────────────────────────────────────────────
  //  CONCEPTOS — CRUD
  // ────────────────────────────────────────────
  private async obtenerFacturaEditable(id: string, action: AuditAction, accionNombre: string) {
    const factura = await this.prisma.facturas.findFirst({
      where: { id, activo: true, eliminado_en: null },
      include: { cuentas_por_cobrar: { select: { id: true } } },
    });
    if (!factura) {
      return this.fallir(
        action,
        id,
        'FACTURA_NO_ENCONTRADA',
        NotFoundException,
        `Factura con id "${id}" no encontrada`,
      );
    }
    if (factura.estado !== 'PENDIENTE') {
      return this.fallir(
        action,
        id,
        'FACTURA_NO_EDITABLE',
        ConflictException,
        'Solo las facturas PENDIENTES se pueden ' + accionNombre,
      );
    }
    if (factura.cuentas_por_cobrar) {
      return this.fallir(
        action,
        id,
        'FACTURA_CON_CXC',
        ConflictException,
        'La factura tiene una cuenta por cobrar y no se pueden modificar sus conceptos',
      );
    }
    return factura;
  }

  async agregarConcepto(facturaId: string, dto: CrearConceptoDto, userId: string) {
    await this.obtenerFacturaEditable(facturaId, AuditAction.FACTURA_ACTUALIZADA, 'modificar conceptos');
    const linea = this.calcularTotales([dto]).lineas[0];
    await this.prisma.$transaction(async (tx) => {
      await tx.factura_conceptos.create({
        data: { factura_id: facturaId, ...this.conceptoData(dto, linea) },
      });
      await this.recalcularFactura(tx, facturaId);
    });
    await this.auditService.log({
      action: AuditAction.FACTURA_ACTUALIZADA,
      entityType: 'facturas',
      entityId: facturaId,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: { op: 'concepto_agregado', descripcion: dto.descripcion },
    });
    return this.findOne(facturaId);
  }

  async actualizarConcepto(facturaId: string, conceptoId: string, dto: ActualizarConceptoDto, userId: string) {
    await this.obtenerFacturaEditable(facturaId, AuditAction.FACTURA_ACTUALIZADA, 'modificar conceptos');
    await this.prisma.$transaction(async (tx) => {
      const concepto = await tx.factura_conceptos.findFirst({ where: { id: conceptoId, factura_id: facturaId, activo: true } });
      if (!concepto) {
        return this.fallir(
          AuditAction.FACTURA_ACTUALIZADA,
          facturaId,
          'CONCEPTO_NO_ENCONTRADO',
          NotFoundException,
          'Concepto no encontrado',
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const upd: any = {};
      if (dto.cantidad !== undefined) upd.cantidad = dto.cantidad;
      if (dto.unidad !== undefined) upd.unidad = dto.unidad;
      if (dto.descripcion !== undefined) upd.descripcion = dto.descripcion;
      if (dto.valorUnitario !== undefined) upd.valor_unitario = dto.valorUnitario;
      if (dto.objetoImpuesto !== undefined) upd.objeto_impuesto = dto.objetoImpuesto;
      if (dto.impuestoTasa !== undefined) upd.impuesto_tasa = dto.impuestoTasa;

      const cant = Number(upd.cantidad ?? concepto.cantidad);
      const vu = Number(upd.valor_unitario ?? concepto.valor_unitario);
      const importe = round2(cant * vu);
      upd.importe = importe;
      const tasa = upd.impuesto_tasa !== undefined ? Number(upd.impuesto_tasa) : (concepto.impuesto_tasa != null ? Number(concepto.impuesto_tasa) : null);
      upd.impuesto_importe = tasa != null && tasa > 0 ? round2(importe * tasa) : null;

      await tx.factura_conceptos.update({ where: { id: conceptoId }, data: upd });
      await this.recalcularFactura(tx, facturaId);
    });
    await this.auditService.log({
      action: AuditAction.FACTURA_ACTUALIZADA,
      entityType: 'facturas',
      entityId: facturaId,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: { op: 'concepto_actualizado', conceptoId },
    });
    return this.findOne(facturaId);
  }

  async eliminarConcepto(facturaId: string, conceptoId: string, userId: string) {
    await this.obtenerFacturaEditable(facturaId, AuditAction.FACTURA_ACTUALIZADA, 'modificar conceptos');
    await this.prisma.$transaction(async (tx) => {
      const concepto = await tx.factura_conceptos.findFirst({ where: { id: conceptoId, factura_id: facturaId, activo: true } });
      if (!concepto) {
        return this.fallir(
          AuditAction.FACTURA_ACTUALIZADA,
          facturaId,
          'CONCEPTO_NO_ENCONTRADO',
          NotFoundException,
          'Concepto no encontrado',
        );
      }
      await tx.factura_conceptos.update({ where: { id: conceptoId }, data: { activo: false } });
      await this.recalcularFactura(tx, facturaId);
    });
    await this.auditService.log({
      action: AuditAction.FACTURA_ACTUALIZADA,
      entityType: 'facturas',
      entityId: facturaId,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: { op: 'concepto_eliminado', conceptoId },
    });
    return this.findOne(facturaId);
  }

  // ────────────────────────────────────────────
  //  HELPERS
  // ────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serialize(f: any) {
    const subtotal = Number(f.subtotal);
    const impuestos = Number(f.impuestos);
    const total = Number(f.total);
    return {
      id: f.id,
      codigo: f.codigo,
      serie: f.serie ?? '',
      folio: f.folio ?? '',
      clienteId: f.clientes?.id,
      clienteNombre: f.clientes?.nombre ?? '',
      empresa: f.clientes?.empresa ?? '',
      rfc: f.clientes?.rfc ?? '',
      cotizacionId: f.cotizaciones?.id ?? f.cotizacion_id ?? null,
      cotizacionCodigo: f.cotizaciones?.codigo ?? null,
      estado: f.estado,
      subtotal,
      impuestos,
      total,
      moneda: f.moneda ?? 'MXN',
      tipoCambio: Number(f.tipo_cambio ?? 1),
      formaPago: f.forma_pago ?? '',
      metodoPago: f.metodo_pago ?? '',
      usoCfdi: f.uso_cfdi ?? '',
      timbradoEn: f.timbrado_en ? new Date(f.timbrado_en).toISOString() : null,
      fechaEmision: f.creado_en ? new Date(f.creado_en).toISOString().slice(0, 10) : '',
      periodoInicio: f.periodo_inicio ? new Date(f.periodo_inicio).toISOString().slice(0, 10) : null,
      periodoFin: f.periodo_fin ? new Date(f.periodo_fin).toISOString().slice(0, 10) : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conceptos: (f.factura_conceptos ?? []).map((c: any) => ({
        id: c.id,
        cantidad: Number(c.cantidad),
        unidad: c.unidad,
        descripcion: c.descripcion,
        valorUnitario: Number(c.valor_unitario),
        importe: Number(c.importe),
        descuento: Number(c.descuento ?? 0),
        objetoImpuesto: c.objeto_impuesto ?? '04',
        impuestoTasa: c.impuesto_tasa != null ? Number(c.impuesto_tasa) : null,
        impuestoImporte: c.impuesto_importe != null ? Number(c.impuesto_importe) : null,
      })),
      cuentaPorCobrar: f.cuentas_por_cobrar
        ? { id: f.cuentas_por_cobrar.id, estado: f.cuentas_por_cobrar.estado, montoPagado: Number(f.cuentas_por_cobrar.monto_pagado ?? 0) }
        : null,
    };
  }
}
