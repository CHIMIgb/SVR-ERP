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
import { UpdateCotizacionDto } from './dto/update-cotizacion.dto';
import { constraintP2002 } from '../common/prisma-constraint';

/** Placeholder para auditoría de fallos donde aún no hay entidad conocida. */
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

/** Etiqueta legible para cada estado de cotización. */
const ESTADO_LABELS: Record<EstadoCotizacion, string> = {
  [EstadoCotizacion.PENDIENTE]: 'Pendiente',
  [EstadoCotizacion.ACEPTADA]: 'Aceptada',
  [EstadoCotizacion.RECHAZADA]: 'Rechazada',
};

/**
 * Máximo de intentos para asignar el folio secuencial FAC-YYYY-NNNN.
 * Dos facturaciones concurrentes pueden generar el mismo `codigo` (count+1);
 * al chocar P2002 se reintenta TODA la transacción con un conteo fresco
 * (Postgres 25P02 impide reintentar dentro del mismo $transaction).
 */
const MAX_INTENTOS_FOLIO = 10;

/** Redondeo monetario a 2 decimales (misma convención que facturas). */
const round2 = (n: number): number => Math.round(n * 100) / 100;

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
    // NOTA: no validamos que el cliente esté activo; el historial debe seguir
    // consultable aunque el cliente haya sido eliminado (soft-delete).

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
  //  EDITAR COTIZACIÓN (descripción, monto, fecha, cliente)
  // ────────────────────────────────────────────
  async update(id: string, dto: UpdateCotizacionDto, userId: string) {
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

    if (existente.estado !== EstadoCotizacion.PENDIENTE) {
      return this.fallir(
        AuditAction.COTIZACION_ACTUALIZADA,
        id,
        'COTIZACION_YA_DECIDIDA',
        BadRequestException,
        `No se puede editar una cotización ${ESTADO_LABELS[existente.estado as EstadoCotizacion]}`,
        userId,
      );
    }

    // Si se cambia el cliente, validar que exista.
    let clienteId = existente.cliente_id;
    if (dto.clienteId && dto.clienteId !== existente.cliente_id) {
      await this.validarCliente(dto.clienteId, AuditAction.COTIZACION_ACTUALIZADA);
      clienteId = dto.clienteId;
    }

    const data: Prisma.cotizacionesUncheckedUpdateInput = {
      actualizado_por: userId,
      actualizado_en: new Date(),
    };
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion.trim();
    if (dto.monto !== undefined) data.monto = dto.monto;
    if (dto.fecha !== undefined) data.fecha = new Date(dto.fecha);
    if (clienteId !== existente.cliente_id) data.cliente_id = clienteId;

    const cotizacion = await this.prisma.cotizaciones.update({
      where: { id },
      data,
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
      previousValue: {
        clienteId: existente.cliente_id,
        descripcion: existente.descripcion,
        monto: Number(existente.monto),
        fecha: existente.fecha,
      },
      newValue: {
        clienteId,
        descripcion: cotizacion.descripcion,
        monto: Number(cotizacion.monto),
        fecha: cotizacion.fecha,
      },
    });

    return serialized;
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

    if (estadoAnterior !== EstadoCotizacion.PENDIENTE) {
      return this.fallir(
        AuditAction.COTIZACION_ACTUALIZADA,
        id,
        'COTIZACION_YA_DECIDIDA',
        BadRequestException,
        `No se puede cambiar el estado de una cotización ${ESTADO_LABELS[estadoAnterior]}`,
        userId,
      );
    }

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

    const esRechazo = dto.estado === EstadoCotizacion.RECHAZADA;
    let motivoRechazo: string | null = null;
    if (esRechazo) {
      const motivo = dto.motivoRechazo?.trim() ?? '';
      if (!motivo) {
        return this.fallir(
          AuditAction.COTIZACION_ACTUALIZADA,
          id,
          'MOTIVO_RECHAZO_REQUERIDO',
          BadRequestException,
          'Indica el motivo por el cual se rechaza la cotización',
          userId,
        );
      }
      motivoRechazo = motivo;
    }

    const cotizacion = await this.prisma.cotizaciones.update({
      where: { id },
      data: {
        estado: dto.estado,
        // Al aceptar se limpia cualquier motivo previo; al rechazar se persiste.
        motivo_rechazo: esRechazo ? motivoRechazo : null,
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
      previousValue: {
        estado: ESTADO_LABELS[estadoAnterior],
        motivoRechazo: existente.motivo_rechazo ?? null,
      },
      newValue: {
        estado: ESTADO_LABELS[dto.estado],
        motivoRechazo,
      },
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
  //  FACTURAR (Cotización → Factura + CxC)
  // ────────────────────────────────────────────
  /**
   * Acepta una cotización PENDIENTE y crea en una sola transacción:
   * la factura (estado PENDIENTE) + su concepto + la CxC (vencimiento +30 días).
   * Emite los audits COTIZACION_FACTURADA + FACTURA_CREADA.
   * Permiso: comercial.cotizaciones.editar
   */
  async facturar(id: string, userId: string) {
    const cotizacion = await this.prisma.cotizaciones.findFirst({
      where: { id, eliminado_en: null },
      include: { facturas: { select: { id: true } } },
    });

    if (!cotizacion) {
      return this.fallir(
        AuditAction.COTIZACION_FACTURADA,
        id,
        'COTIZACION_NO_ENCONTRADA',
        NotFoundException,
        `Cotización con id "${id}" no encontrada`,
        userId,
      );
    }

    if (cotizacion.estado !== EstadoCotizacion.PENDIENTE) {
      return this.fallir(
        AuditAction.COTIZACION_FACTURADA,
        id,
        'COTIZACION_NO_PENDIENTE',
        BadRequestException,
        `Solo se pueden facturar cotizaciones PENDIENTES (estado actual: ${ESTADO_LABELS[cotizacion.estado]})`,
        userId,
      );
    }

    if (cotizacion.facturas.length > 0) {
      return this.fallir(
        AuditAction.COTIZACION_FACTURADA,
        id,
        'COTIZACION_YA_FACTURADA',
        BadRequestException,
        'La cotización ya tiene una factura asociada',
        userId,
      );
    }

    // Cliente debe existir y estar activo.
    const cliente = await this.prisma.clientes.findFirst({
      where: { id: cotizacion.cliente_id, activo: true, eliminado_en: null },
      select: { id: true },
    });
    if (!cliente) {
      return this.fallir(
        AuditAction.COTIZACION_FACTURADA,
        cotizacion.cliente_id,
        'CLIENTE_NO_ENCONTRADO',
        BadRequestException,
        `Cliente de la cotización no encontrado o inactivo`,
        userId,
      );
    }

    const monto = Number(cotizacion.monto);
    // IVA 16% sobre el neto (las cotizaciones se cotizan más IVA, misma
    // convención que el módulo de facturas: impuesto_importe = importe × tasa).
    // La CxC se crea por el total CON IVA: si el desglose naciera mal ya no
    // se puede corregir una vez emitida.
    const TASA_IVA = 0.16;
    const impuestoIva = round2(monto * TASA_IVA);
    const totalConIva = round2(monto + impuestoIva);

    for (let intento = 0; intento < MAX_INTENTOS_FOLIO; intento++) {
      try {
        const { factura, cxc } = await this.prisma.$transaction(async (tx) => {
          // 1. Transición PENDIENTE→ACEPTADA: solo una tx concurrente puede
          //    ganarla. El updateMany se bloquea en el lock de fila del ganador
          //    y al despertar re-evalúa el WHERE contra el estado ya commiteado
          //    → count 0 para el perdedor (cierra el TOCTOU del Blocker #3).
          const transicion = await tx.cotizaciones.updateMany({
            where: { id, eliminado_en: null, estado: EstadoCotizacion.PENDIENTE },
            data: {
              estado: EstadoCotizacion.ACEPTADA,
              actualizado_por: userId,
              actualizado_en: new Date(),
            },
          });

          if (transicion.count === 0) {
            // Carrera perdida: releemos para dar el código correcto. El perdedor
            // normalmente verá ACEPTADA + factura; pero el estado pudo llegar a
            // RECHAZADA por otro path concurrente.
            const actual = await tx.cotizaciones.findUnique({
              where: { id },
              select: { estado: true, facturas: { select: { id: true } } },
            });
            if (actual?.facturas.length) {
              throw new BadRequestException('COTIZACION_YA_FACTURADA');
            }
            throw new BadRequestException('COTIZACION_NO_PENDIENTE');
          }

          // 2. Folio secuencial FAC-YYYY-NNNN. Si dos tx concurrentes (de
          //    cotizaciones distintas) generan el mismo código, el create
          //    choca P2002 en `codigo` y se reintenta todo el bloque de arriba.
          const anio = new Date().getFullYear();
          const base = `FAC-${anio}`;
          const conteo = await tx.facturas.count({ where: { codigo: { startsWith: base } } });
          const codigo =
            intento === MAX_INTENTOS_FOLIO - 1
              ? `${base}-${randomUUID().slice(0, 6).toUpperCase()}`
              : `${base}-${String(conteo + 1).padStart(4, '0')}`;
          const facturaId = randomUUID();
          const factura = await tx.facturas.create({
            data: {
              id: facturaId,
              codigo,
              serie: 'F',
              folio: String(conteo + 1).padStart(6, '0'),
              cliente_id: cotizacion.cliente_id,
              cotizacion_id: id,
              subtotal: monto,
              impuestos: impuestoIva,
              total: totalConIva,
              moneda: 'MXN',
              tipo_cambio: 1,
              estado: 'PENDIENTE',
              activo: true,
              creado_en: new Date(),
              actualizado_en: new Date(),
              creado_por: userId,
              actualizado_por: userId,
              factura_conceptos: {
                create: [
                  {
                    id: randomUUID(),
                    cantidad: 1,
                    unidad: 'Servicio',
                    descripcion: cotizacion.descripcion,
                    valor_unitario: monto,
                    importe: monto,
                    descuento: 0,
                    objeto_impuesto: '04',
                    impuesto_tasa: TASA_IVA,
                    impuesto_importe: impuestoIva,
                    activo: true,
                  },
                ],
              },
            },
          });

          // 3. CxC por el total, vence en 30 días.
          const vencimiento = new Date();
          vencimiento.setDate(vencimiento.getDate() + 30);
          const cxc = await tx.cuentas_por_cobrar.create({
            data: {
              id: randomUUID(),
              cliente_id: cotizacion.cliente_id,
              factura_id: facturaId,
              monto: totalConIva,
              monto_pagado: 0,
              fecha_vencimiento: vencimiento,
              estado: 'PENDIENTE',
              activo: true,
              creado_en: new Date(),
              actualizado_en: new Date(),
            },
          });

          return { factura, cxc };
        });

        await this.auditService.log({
          action: AuditAction.COTIZACION_FACTURADA,
          entityType: 'cotizaciones',
          entityId: id,
          result: AuditResult.SUCCESS,
          actorUserId: userId,
          actorType: 'USER',
          actorRole: 'autenticado',
          previousValue: { estado: 'Pendiente' },
          newValue: {
            estado: 'Aceptada',
            facturaId: factura.id,
            facturaCodigo: factura.codigo,
            cxcId: cxc.id,
          },
        });

        return {
          cotizacionId: id,
          factura: { id: factura.id, codigo: factura.codigo, total: Number(factura.total), estado: factura.estado },
          cxc: { id: cxc.id, monto: Number(cxc.monto), fechaVencimiento: cxc.fecha_vencimiento },
        };
      } catch (error) {
        // Prisma 7 (driver adapters) no expone meta.target en P2002: la
        // restricción se extrae vía helper común (ver common/prisma-constraint.ts).
        const constraint = constraintP2002(error);

        // Colisión de folio entre facturaciones concurrentes → reintentar.
        if (constraint === 'facturas_codigo_key') {
          continue;
        }

        // Errores de negocio lanzados por el guard transicional.
        if (error instanceof BadRequestException) {
          const esYaFacturada = error.message === 'COTIZACION_YA_FACTURADA';
          return this.fallir(
            AuditAction.COTIZACION_FACTURADA,
            id,
            esYaFacturada ? 'COTIZACION_YA_FACTURADA' : 'COTIZACION_NO_PENDIENTE',
            BadRequestException,
            esYaFacturada
              ? 'La cotización ya tiene una factura asociada'
              : 'Solo se pueden facturar cotizaciones PENDIENTES',
            userId,
          );
        }

        // Defensa en profundidad: el índice único (Blocker #3) bloqueó una
        // segunda factura para la misma cotización.
        if (constraint === 'facturas_cotizacion_id_key') {
          return this.fallir(
            AuditAction.COTIZACION_FACTURADA,
            id,
            'COTIZACION_YA_FACTURADA',
            BadRequestException,
            'La cotización ya tiene una factura asociada',
            userId,
          );
        }

        throw error;
      }
    }

    throw new Error('No se pudo asignar un folio único a la factura');
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
      motivoRechazo: cotizacion.motivo_rechazo ?? null,
      activo: cotizacion.activo,
      creadoEn: cotizacion.creado_en?.toISOString?.() ?? cotizacion.creado_en,
      actualizadoEn:
        cotizacion.actualizado_en?.toISOString?.() ?? cotizacion.actualizado_en,
    };
  }
}
