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
import { RevertirCobroDto } from './dto/revertir-cobro.dto';
import { ListarCuentasQuery } from './dto/listar-cuentas.query';
import { ListarCobrosQuery } from './dto/listar-cobros.query';

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
          proyectos: { select: { id: true, codigo: true, nombre: true } },
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
        proyectos: { select: { id: true, codigo: true, nombre: true } },
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

    if (dto.proyectoId) {
      const proyecto = await this.prisma.proyectos.findFirst({
        where: { id: dto.proyectoId, activo: true, eliminado_en: null },
      });
      if (!proyecto) {
        return this.fallir(
          AuditAction.CXC_CREADA,
          null,
          'PROYECTO_NO_ENCONTRADO',
          NotFoundException,
          `Proyecto con id "${dto.proyectoId}" no encontrado`,
        );
      }
    }

    const cuenta = await this.prisma.cuentas_por_cobrar.create({
      data: {
        id: randomUUID(),
        cliente_id: dto.clienteId,
        factura_id: dto.facturaId ?? null,
        proyecto_id: dto.proyectoId ?? null,
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
        proyectos: { select: { id: true, codigo: true, nombre: true } },
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
        proyectoId: dto.proyectoId ?? null,
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
        proyectos: { select: { id: true, codigo: true, nombre: true } },
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
    // Monto/vencimiento son inmutables con cobros; el proyecto sí se puede
    // asignar/desligar retroactivamente (cartera por obra, O1).
    if (pagosCount > 0 && (dto.monto !== undefined || dto.fechaVencimiento !== undefined)) {
      return this.fallir(
        AuditAction.CXC_ACTUALIZADA,
        id,
        'CXC_CON_PAGOS',
        ConflictException,
        'La cuenta ya tiene cobros registrados; no se puede modificar el monto ni el vencimiento',
      );
    }

    if (dto.proyectoId) {
      const proyecto = await this.prisma.proyectos.findFirst({
        where: { id: dto.proyectoId, activo: true, eliminado_en: null },
      });
      if (!proyecto) {
        return this.fallir(
          AuditAction.CXC_ACTUALIZADA,
          id,
          'PROYECTO_NO_ENCONTRADO',
          NotFoundException,
          `Proyecto con id "${dto.proyectoId}" no encontrado`,
        );
      }
    }

    const cuenta = await this.prisma.cuentas_por_cobrar.update({
      where: { id },
      data: {
        monto: dto.monto,
        fecha_vencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : undefined,
        proyecto_id: dto.proyectoId === undefined ? undefined : dto.proyectoId,
        actualizado_en: new Date(),
      },
      include: {
        clientes: { select: { id: true, nombre: true, empresa: true } },
        facturas: { select: { serie: true, folio: true } },
        proyectos: { select: { id: true, codigo: true, nombre: true } },
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
        proyectos: { select: { id: true, codigo: true, nombre: true } },
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

    let pago: {
      id: string;
      codigo: string;
      metodo_pago: string;
      referencia: string | null;
    } | undefined;

    try {
      // Folio anti-colisión (moderado #2 de PR #11): con cobros concurrentes el
      // contador count+1 puede repetir → P2002 en pagos.codigo. Postgres 25P02
      // impide reintentar dentro del mismo tx (queda abortado), así que se
      // reintenta TODO el $transaction (rollback total del intento fallido) con
      // conteo fresco; último recurso: sufijo aleatorio único por construcción.
      const MAX_INTENTOS_FOLIO = 10;
      for (let intento = 0; intento < MAX_INTENTOS_FOLIO; intento++) {
        try {
          const resultadoTx = await this.prisma.$transaction(async (tx) => {
            const codigo =
              intento === MAX_INTENTOS_FOLIO - 1
                ? `PAG-CXC-${fechaPago.getFullYear()}-${randomUUID().slice(0, 6).toUpperCase()}`
                : await this.generarCodigoCobro(tx, fechaPago);

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

            // Update condicional atómico (Blocker #2 de PR #11): el WHERE valida
            // el saldo contra el valor ACTUAL en BD (no el leído antes de la tx)
            // y el incremento es aritmético — dos cobros concurrentes no se
            // pisan. count 0 → en carrera el saldo se agotó → rollback del pago
            // recién insertado y de la transacción financiera.
            const actualizado = await tx.$executeRaw`
              UPDATE cuentas_por_cobrar
              SET monto_pagado = monto_pagado + ${dto.monto}::numeric,
                  estado = CASE WHEN monto_pagado + ${dto.monto}::numeric >= monto - 0.0001
                                THEN 'PAGADO' ELSE 'PARCIAL' END,
                  actualizado_en = ${now}
              WHERE id = ${cuenta.id}
                AND activo = true
                AND monto_pagado + ${dto.monto}::numeric <= monto + 0.0001
            `;
            if (actualizado === 0) {
              throw new BadRequestException('COBRO_EXCEDE_SALDO');
            }

            // Dominio legacy de CxC: PENDIENTE → PARCIAL → PAGADO (el API expone
            // 'SALDADO' a la UI; el mapeo vive en serializeCuenta). Se lee el
            // estado autoritativo post-update (misma tx, ve el valor recién
            // incrementado).
            const cuentaPost = await tx.cuentas_por_cobrar.findUnique({
              where: { id: cuenta.id },
              select: { estado: true },
            });

            // Integridad del ciclo venta→cobro: al saldar la cuenta, la factura
            // timbrada ligada pasa a PAGADA (misma transacción, sin audit extra).
            if (cuentaPost!.estado === 'PAGADO' && cuenta.factura_id) {
              await tx.facturas.updateMany({
                where: { id: cuenta.factura_id, estado: 'TIMBRADA', activo: true },
                data: { estado: 'PAGADA', actualizado_en: now },
              });
            }

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

            return { pago: nuevo };
          });

          pago = resultadoTx.pago;
          break;
        } catch (error) {
          const esColisionCodigo =
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002';
          if (!esColisionCodigo) throw error;
        }
      }
      if (!pago) {
        throw new Error('No se pudo asignar un folio único al cobro');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        return this.fallir(
          AuditAction.COBRO_REGISTRADO,
          id,
          'COBRO_EXCEDE_SALDO',
          BadRequestException,
          'El cobro excede el saldo pendiente de la cuenta',
        );
      }
      throw error;
    }

    const cuentaActualizada = await this.prisma.cuentas_por_cobrar.findFirst({
      where: { id },
      include: {
        clientes: { select: { id: true, nombre: true, empresa: true } },
        facturas: { select: { serie: true, folio: true } },
        proyectos: { select: { id: true, codigo: true, nombre: true } },
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
        codigo: pago!.codigo,
        cuentaId: id,
        clienteNombre: cuenta.clientes.nombre,
        monto: dto.monto,
        fechaPago: fechaPago.toISOString(),
        metodoPago: pago!.metodo_pago,
      },
    });

    return {
      cobro: {
        id: idPago,
        cuentaId: id,
        clienteNombre: cuenta.clientes.nombre,
        monto: dto.monto,
        fecha: fechaPago.toISOString(),
        referencia: pago!.referencia,
        metodoPago: pago!.metodo_pago,
      },
      cuenta: this.serializeCuenta(cuentaActualizada ?? (cuenta as never)),
    };
  }

  // ────────────────────────────────────────────
  //  COBROS — REVERSIÓN
  // ────────────────────────────────────────────
  async revertirCobro(
    cuentaId: string,
    cobroId: string,
    userId: string,
    dto: RevertirCobroDto,
  ) {
    const cuenta = await this.prisma.cuentas_por_cobrar.findFirst({
      where: { id: cuentaId, activo: true },
      include: {
        clientes: { select: { id: true, nombre: true, empresa: true } },
        facturas: { select: { serie: true, folio: true } },
        proyectos: { select: { id: true, codigo: true, nombre: true } },
      },
    });

    if (!cuenta) {
      return this.fallir(
        AuditAction.CXC_ACTUALIZADA,
        cuentaId,
        'CXC_NO_ENCONTRADA',
        NotFoundException,
        `Cuenta por cobrar con id "${cuentaId}" no encontrada`,
      );
    }

    const pago = await this.prisma.pagos.findFirst({
      where: { id: cobroId, cuenta_por_cobrar_id: cuentaId, activo: true },
    });

    if (!pago) {
      return this.fallir(
        AuditAction.COBRO_REVERTIDO,
        cobroId,
        'COBRO_NO_ENCONTRADO',
        NotFoundException,
        `Cobro con id "${cobroId}" no encontrado en la cuenta`,
      );
    }

    if (pago.estado !== 'CONFIRMADO') {
      return this.fallir(
        AuditAction.COBRO_REVERTIDO,
        cobroId,
        'COBRO_NO_REVERSIBLE',
        ConflictException,
        'Solo los cobros confirmados pueden revertirse',
      );
    }

    const montoCobro = Number(pago.monto);
    const now = new Date();

    let nuevoMontoPagado = 0;
    try {
      await this.prisma.$transaction(async (tx) => {
        // Guard anti doble clic: el soft-delete solo ocurre si el cobro
        // sigue activo y confirmado (carrera → count 0 → conflicto).
        const resultado = await tx.pagos.updateMany({
          where: {
            id: cobroId,
            cuenta_por_cobrar_id: cuentaId,
            activo: true,
            estado: 'CONFIRMADO',
          },
          data: {
            activo: false,
            eliminado_en: now,
            actualizado_en: now,
            actualizado_por: userId,
          },
        });

        if (resultado.count === 0) {
          throw new ConflictException('COBRO_YA_REVERTIDO');
        }

        // Update condicional atómico (Blocker #2 de PR #11): decremento sobre
        // el valor ACTUAL en BD, no el leído antes de la tx. Dos reversiones
        // concurrentes de cobros distintos ya no se pisan entre sí; el WHERE
        // evita saldo negativo en carrera (defensa anti corrupción).
        const actualizado = await tx.$executeRaw`
          UPDATE cuentas_por_cobrar
          SET monto_pagado = monto_pagado - ${montoCobro}::numeric,
              estado = CASE
                WHEN monto_pagado - ${montoCobro}::numeric >= monto - 0.0001 THEN 'PAGADO'
                WHEN monto_pagado - ${montoCobro}::numeric > 0 THEN 'PARCIAL'
                ELSE 'PENDIENTE' END,
              actualizado_en = ${now}
          WHERE id = ${cuentaId}
            AND activo = true
            AND monto_pagado >= ${montoCobro}::numeric
        `;
        if (actualizado === 0) {
          // Solo alcanzable si la BD está corrupta: cada cobro confirmado pagó
          // su monto, así que monto_pagado nunca debería quedar por debajo.
          throw new ConflictException('SALDO_INCONSISTENTE');
        }

        // Dominio legacy: PENDIENTE → PARCIAL → PAGADO (el API expone 'SALDADO').
        // Estado autoritativo post-update (misma tx) para factura y auditoría.
        const cuentaPost = await tx.cuentas_por_cobrar.findUnique({
          where: { id: cuentaId },
          select: { estado: true, monto_pagado: true },
        });
        const estadoCxc = cuentaPost!.estado;

        // Si el cobro revertido había saldado la CxC y la factura ligada
        // pasó a PAGADA, regresa a TIMBRADA (solo si el nuevo saldo ya no cubre).
        if (estadoCxc !== 'PAGADO' && cuenta.factura_id) {
          await tx.facturas.updateMany({
            where: { id: cuenta.factura_id, estado: 'PAGADA', activo: true },
            data: { estado: 'TIMBRADA', actualizado_en: now },
          });
        }

        // Contrapartida contable: EGRESO que revierte el cobro original,
        // referenciando la misma entidad (traza inmutable). La BD exige
        // montos positivos (chk_monto_positivo), por eso se usa EGRESO.
        await tx.transacciones.create({
          data: {
            id: randomUUID(),
            codigo: generarCodigoTransaccion(),
            tipo: 'EGRESO',
            categoria: 'COBRANZA',
            monto: montoCobro,
            fecha: now,
            descripcion: `Reversión de cobro ${pago.codigo} — ${dto.motivo}`,
            entidad_tipo: 'COBRO',
            entidad_id: cobroId,
            creado_por: userId,
            actualizado_por: userId,
            actualizado_en: now,
          },
        });

        nuevoMontoPagado = Number(cuentaPost!.monto_pagado);
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        const esSaldoInconsistente = error.message === 'SALDO_INCONSISTENTE';
        return this.fallir(
          AuditAction.COBRO_REVERTIDO,
          cobroId,
          esSaldoInconsistente ? 'SALDO_INCONSISTENTE' : 'COBRO_YA_REVERTIDO',
          ConflictException,
          esSaldoInconsistente
            ? 'El saldo de la cuenta no cubre el cobro revertido'
            : 'El cobro ya fue revertido',
        );
      }
      throw error;
    }

    await this.auditService.log({
      action: AuditAction.COBRO_REVERTIDO,
      entityType: 'pagos',
      entityId: cobroId,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: {
        cuentaId,
        monto: montoCobro,
        motivo: dto.motivo,
      },
    });

    await this.auditService.log({
      action: AuditAction.CXC_ACTUALIZADA,
      entityType: 'cuentas_por_cobrar',
      entityId: cuentaId,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: {
        montoPagado: nuevoMontoPagado,
      },
    });

    const cuentaActualizada = await this.prisma.cuentas_por_cobrar.findFirst({
      where: { id: cuentaId },
      include: {
        clientes: { select: { id: true, nombre: true, empresa: true } },
        facturas: { select: { serie: true, folio: true } },
        proyectos: { select: { id: true, codigo: true, nombre: true } },
        pagos: {
          take: 1,
          orderBy: { fecha_pago: 'desc' },
          select: { fecha_pago: true },
        },
      },
    });

    return {
      cobroRevertido: {
        id: cobroId,
        cuentaId,
        monto: montoCobro,
        motivo: dto.motivo,
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
        clientes: { select: { empresa: true } },
      },
    });

    return {
      cuentaId: id,
      saldo: Number(cuenta.monto) - Number(cuenta.monto_pagado),
      cobros: cobros.map((cobro) => this.serializeCobro(cobro)),
    };
  }

  // ────────────────────────────────────────────
  //  COBROS — LISTADO GLOBAL (tab "Cobros")
  // ────────────────────────────────────────────
  async cobrosAll(query: ListarCobrosQuery) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const where: Prisma.pagosWhereInput = {
      activo: true,
      cuenta_por_cobrar_id: { not: null },
    };

    if (query.metodoPago) {
      where.metodo_pago = query.metodoPago;
    }

    if (query.search) {
      where.clientes = {
        OR: [
          { nombre: { contains: query.search, mode: 'insensitive' } },
          { empresa: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.pagos.findMany({
        where,
        include: {
          clientes: { select: { empresa: true } },
        },
        orderBy: { fecha_pago: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.pagos.count({ where }),
    ]);

    return {
      items: items.map((cobro) => this.serializeCobro(cobro)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  // ────────────────────────────────────────────
  //  VENCIMIENTOS — cartera por vencer (tab)
  // ────────────────────────────────────────────
  async vencimientos(query: ListarCuentasQuery) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const where = this.construirWhere(query);
    // Los vencimientos solo muestran cuentas con saldo pendiente y fecha definida.
    where.estado = { not: 'PAGADO' };
    where.fecha_vencimiento = { not: null };

    if (query.rango) {
      const hoyLocal = inicioDeHoy();
      where.fecha_vencimiento =
        query.rango === 'vencido' ? { lt: hoyLocal } : { gte: hoyLocal };
    }

    const [items, total] = await Promise.all([
      this.prisma.cuentas_por_cobrar.findMany({
        where,
        include: {
          clientes: { select: { id: true, nombre: true, empresa: true } },
        },
        orderBy: [{ fecha_vencimiento: 'asc' }, { creado_en: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.cuentas_por_cobrar.count({ where }),
    ]);

    const hoy = inicioDeHoy();
    return {
      items: items.map((cuenta) => {
        const saldo = Number(cuenta.monto) - Number(cuenta.monto_pagado);
        const vencimiento = new Date(cuenta.fecha_vencimiento!);
        const diasAtraso = Math.max(
          0,
          Math.floor((hoy.getTime() - vencimiento.getTime()) / 86400000),
        );
        return {
          id: cuenta.id,
          cuentaId: cuenta.id,
          clienteNombre: cuenta.clientes.empresa,
          obra: '',
          monto: saldo,
          fechaVencimiento: vencimiento.toISOString().slice(0, 10),
          diasAtraso,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
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

    return (
      '\uFEFF' +
      this.csvLinea(encabezados) +
      '\n' +
      filas.map((fila) => this.csvLinea(fila)).join('\n')
    );
  }

  // ────────────────────────────────────────────
  //  REPORTE POR PROYECTO (cartera por obra, O2)
  // ────────────────────────────────────────────
  async porProyecto(query: ListarCuentasQuery) {
    const where = this.construirWhere(query);
    const cuentas = await this.prisma.cuentas_por_cobrar.findMany({
      where,
      select: {
        id: true,
        proyecto_id: true,
        monto: true,
        monto_pagado: true,
        estado: true,
        fecha_vencimiento: true,
        proyectos: { select: { id: true, codigo: true, nombre: true } },
      },
      orderBy: [{ fecha_vencimiento: 'asc' }, { creado_en: 'desc' }],
    });

    const hoy = inicioDeHoy();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const grupos = new Map<string, any>();
    const SIN_PROYECTO_KEY = '__SIN_PROYECTO__';

    for (const c of cuentas) {
      const llave = c.proyecto_id ?? SIN_PROYECTO_KEY;
      const monto = Number(c.monto);
      const pagado = Number(c.monto_pagado);
      const saldo = monto - pagado;
      const vencido =
        c.estado !== 'PAGADO' && c.fecha_vencimiento && new Date(c.fecha_vencimiento) < hoy
          ? saldo
          : 0;

      let g = grupos.get(llave);
      if (!g) {
        g = {
          proyecto: c.proyectos
            ? { id: c.proyectos.id, codigo: c.proyectos.codigo ?? '', nombre: c.proyectos.nombre }
            : null,
          totalCuentas: 0,
          monto: 0,
          pagado: 0,
          saldo: 0,
          vencido: 0,
        };
        grupos.set(llave, g);
      }
      g.totalCuentas += 1;
      g.monto += monto;
      g.pagado += pagado;
      g.saldo += saldo;
      g.vencido += vencido;
    }

    const items = [...grupos.values()].sort((a, b) => {
      // El grupo "Sin proyecto" al final; el resto por saldo descendente.
      if (!a.proyecto && b.proyecto) return 1;
      if (a.proyecto && !b.proyecto) return -1;
      return b.saldo - a.saldo;
    });

    const totales = items.reduce(
      (acc, g) => ({
        monto: acc.monto + g.monto,
        pagado: acc.pagado + g.pagado,
        saldo: acc.saldo + g.saldo,
        vencido: acc.vencido + g.vencido,
      }),
      { monto: 0, pagado: 0, saldo: 0, vencido: 0 },
    );

    return { items, totales };
  }

  /** CSV agrupado por proyecto (mismo shape que porProyecto), con BOM UTF-8. */
  async exportarPorProyecto(query: ListarCuentasQuery): Promise<string> {
    const { items, totales } = await this.porProyecto(query);
    const encabezados = ['Proyecto', 'Cuentas', 'Monto', 'Pagado', 'Saldo', 'Vencido'];

    const filas = items.map((g) => [
      g.proyecto ? `${g.proyecto.codigo} — ${g.proyecto.nombre}` : 'Sin proyecto',
      g.totalCuentas,
      g.monto,
      g.pagado,
      g.saldo,
      g.vencido,
    ]);
    filas.push([
      'TOTAL',
      items.reduce((n, g) => n + g.totalCuentas, 0),
      ...['monto', 'pagado', 'saldo', 'vencido'].map((k) => totales[k]),
    ]);

    return (
      '\uFEFF' +
      this.csvLinea(encabezados) +
      '\n' +
      filas.map((fila) => this.csvLinea(fila)).join('\n')
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

    if (query.proyectoId) {
      where.proyecto_id = query.proyectoId;
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

  /** Escapa y une una fila del CSV (reemplaza el helper local de exportar). */
  private csvLinea(fila: (string | number)[]): string {
    return fila
      .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
      .join(',');
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
  private serializeCobro(cobro: any) {
    return {
      id: cobro.id,
      cuentaId: cobro.cuenta_por_cobrar_id,
      clienteNombre: cobro.clientes?.empresa ?? '',
      monto: Number(cobro.monto),
      fecha: cobro.fecha_pago.toISOString().slice(0, 10),
      referencia: cobro.referencia ?? '—',
      metodoPago: cobro.metodo_pago,
    };
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
    const proyecto = cuenta.proyectos;
    const ultimoPago = cuenta.pagos?.[0];

    return {
      id: cuenta.id,
      clienteId: cuenta.clientes.id,
      clienteNombre: cuenta.clientes.nombre,
      empresa: cuenta.clientes.empresa,
      obra: '',
      proyectoId: cuenta.proyecto_id ?? null,
      proyecto: proyecto
        ? { id: proyecto.id, codigo: proyecto.codigo ?? '', nombre: proyecto.nombre }
        : null,
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