import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma, TipoTransaccion, AuditAction, AuditResult } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateBancoDto } from './dto/create-banco.dto';
import { CreateCuentaDto } from './dto/create-cuenta.dto';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { ConciliarMovimientoDto } from './dto/conciliar-movimiento.dto';
import { QueryMovimientosDto } from './dto/query-movimientos.dto';
import { CargarLoteDto } from './dto/cargar-lote.dto';

const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';
const PAGE_SIZE = 25;

interface MovimientoCsv {
  fecha: string;
  descripcion: string;
  deposito: number | null;
  retiro: number | null;
}

@Injectable()
export class ConciliacionBancariaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ────────────────────────────
  //  BANCOS (catálogo)
  // ────────────────────────────
  async listarBancos() {
    const bancos = await this.prisma.bancos.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
    return bancos.map((b) => this.serializeBanco(b));
  }

  async crearBanco(dto: CreateBancoDto, userId: string) {
    const id = randomUUID();
    const now = new Date();
    try {
      await this.prisma.bancos.create({
        data: {
          id,
          nombre: dto.nombre.trim(),
          activo: true,
          creado_por: userId,
          actualizado_en: now,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        return this.fallir(
          AuditAction.BANCO_CREADO,
          null,
          'BANCO_DUPLICADO',
          ConflictException,
          `Ya existe un banco llamado "${dto.nombre}"`,
        );
      }
      throw e;
    }

    await this.auditService.log({
      action: AuditAction.BANCO_CREADO,
      entityType: 'bancos',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      newValue: { nombre: dto.nombre.trim() },
    });
    return this.serializeBanco({ id, nombre: dto.nombre.trim(), activo: true });
  }

  // ────────────────────────────
  //  CUENTAS BANCARIAS
  // ────────────────────────────
  async listarCuentas(bancoId: string) {
    await this.existeBanco(bancoId);
    const cuentas = await this.prisma.cuentas_bancarias.findMany({
      where: { banco_id: bancoId, activo: true },
      orderBy: { numero: 'asc' },
    });
    return cuentas.map((c) => this.serializeCuenta(c));
  }

  async crearCuenta(bancoId: string, dto: CreateCuentaDto, userId: string) {
    await this.existeBanco(bancoId);
    const id = randomUUID();
    const now = new Date();
    try {
      await this.prisma.cuentas_bancarias.create({
        data: {
          id,
          banco_id: bancoId,
          numero: dto.numero.trim(),
          nombre: dto.nombre?.trim() ?? null,
          saldo_inicial: dto.saldoInicial ?? 0,
          activo: true,
          creado_por: userId,
          actualizado_en: now,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        return this.fallir(
          AuditAction.CUENTA_BANCARIA_CREADA,
          null,
          'CUENTA_DUPLICADA',
          ConflictException,
          `Ya existe una cuenta con el número "${dto.numero}"`,
        );
      }
      throw e;
    }

    await this.auditService.log({
      action: AuditAction.CUENTA_BANCARIA_CREADA,
      entityType: 'cuentas_bancarias',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      newValue: { bancoId, numero: dto.numero.trim() },
    });
    return this.serializeCuenta({
      id,
      banco_id: bancoId,
      numero: dto.numero.trim(),
      nombre: dto.nombre?.trim() ?? null,
      saldo_inicial: dto.saldoInicial ?? 0,
      activo: true,
    });
  }

  // ────────────────────────────
  //  MOVIMIENTOS BANCARIOS
  // ────────────────────────────
  async listarMovimientos(cuentaId: string, query: QueryMovimientosDto) {
    await this.existeCuenta(cuentaId);
    const page = query.page || 1;
    const limit = Math.min(query.limit || PAGE_SIZE, 100);

    const where: Prisma.movimientos_bancariosWhereInput = { cuenta_id: cuentaId };
    if (query.desde || query.hasta) {
      where.fecha = {};
      if (query.desde) where.fecha.gte = new Date(`${query.desde}T00:00:00`);
      if (query.hasta) where.fecha.lte = new Date(`${query.hasta}T00:00:00`);
    }
    if (query.soloNoConciliados) where.conciliado = false;

    const [movimientos, total] = await Promise.all([
      this.prisma.movimientos_bancarios.findMany({
        where,
        orderBy: [{ fecha: 'desc' }, { creado_en: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.movimientos_bancarios.count({ where }),
    ]);

    return {
      items: movimientos.map((m) => this.serializeMovimiento(m)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async listarCandidatas(movimientoId: string) {
    const movimiento = await this.buscarMovimientoConCuenta(movimientoId);
    const monto = Number(movimiento.deposito ?? movimiento.retiro);
    const fecha = movimiento.fecha as Date;

    const desde = new Date(fecha);
    desde.setDate(desde.getDate() - 3);
    const hasta = new Date(fecha);
    hasta.setDate(hasta.getDate() + 3);

    const transacciones = await this.prisma.transacciones.findMany({
      where: {
        activo: true,
        eliminado_en: null,
        tipo: movimiento.deposito != null ? TipoTransaccion.INGRESO : TipoTransaccion.EGRESO,
        fecha: { gte: desde, lte: hasta },
      },
      orderBy: { fecha: 'desc' },
    });

    // Monto similar (±1) — filtro client-side por si hay Decimal vs la comparación exacta.
    return transacciones
      .filter((t) => Math.abs(Number(t.monto) - monto) <= 1)
      .map((t) => ({
        id: t.id,
        codigo: t.codigo,
        tipo: t.tipo,
        categoria: t.categoria,
        monto: Number(t.monto),
        fecha: (t.fecha as Date).toISOString().split('T')[0],
        descripcion: t.descripcion,
      }));
  }

  async crearMovimiento(cuentaId: string, dto: CreateMovimientoDto, userId: string) {
    await this.existeCuenta(cuentaId);
    await this.validarMontos(dto.deposito, dto.retiro, AuditAction.MOVIMIENTO_BANCARIO_CREADO, null);

    const id = randomUUID();
    const now = new Date();
    await this.prisma.movimientos_bancarios.create({
      data: {
        id,
        cuenta_id: cuentaId,
        fecha: new Date(`${dto.fecha}T00:00:00`),
        descripcion: dto.descripcion.trim(),
        deposito: dto.deposito ?? null,
        retiro: dto.retiro ?? null,
        conciliado: false,
        creado_por: userId,
        actualizado_en: now,
      },
    });

    await this.auditService.log({
      action: AuditAction.MOVIMIENTO_BANCARIO_CREADO,
      entityType: 'movimientos_bancarios',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      newValue: { cuentaId, fecha: dto.fecha, descripcion: dto.descripcion.trim(), monto: dto.deposito ?? dto.retiro },
    });
    return this.serializeMovimiento({
      id,
      cuenta_id: cuentaId,
      fecha: new Date(`${dto.fecha}T00:00:00`),
      descripcion: dto.descripcion.trim(),
      deposito: dto.deposito ?? null,
      retiro: dto.retiro ?? null,
      conciliado: false,
      transaccion_id: null,
      conciliado_en: null,
      conciliado_por: null,
      creado_en: now,
      actualizado_en: now,
    });
  }

  async cargarLote(cuentaId: string, dto: CargarLoteDto, userId: string) {
    await this.existeCuenta(cuentaId);
    const movimientos = this.parseCsv(dto.csv);
    if (movimientos.length === 0) {
      return this.fallir(
        AuditAction.MOVIMIENTO_BANCARIO_LOTE_CARGADO,
        null,
        'CSV_SIN_MOVIMIENTOS_VALIDOS',
        BadRequestException,
        'El CSV no contiene movimientos válidos (formato: fecha,descripcion,deposito,retiro)',
      );
    }

    // Dedupe previo contra lo existente: el UNIQUE de Postgres no colisiona con
    // NULLs (deposito/retiro), por lo que la re-importación duplicaría sin esto.
    const existentes = await this.prisma.movimientos_bancarios.findMany({
      where: { cuenta_id: cuentaId },
      select: { fecha: true, descripcion: true, deposito: true, retiro: true },
    });
    const clavesExistentes = new Set(
      existentes.map((m) => this.claveMovimiento(m.fecha, m.descripcion, m.deposito, m.retiro)),
    );
    const nuevos = movimientos.filter(
      (m) => !clavesExistentes.has(this.claveMovimiento(new Date(`${m.fecha}T00:00:00`), m.descripcion, m.deposito, m.retiro)),
    );
    const insertados = nuevos.length === 0
      ? 0
      : (await this.prisma.movimientos_bancarios.createMany({
          data: nuevos.map((m) => ({
            id: randomUUID(),
            cuenta_id: cuentaId,
            fecha: new Date(`${m.fecha}T00:00:00`),
            descripcion: m.descripcion,
            deposito: m.deposito,
            retiro: m.retiro,
            conciliado: false,
            creado_por: userId,
            actualizado_en: new Date(),
          })),
          skipDuplicates: true,
        })).count;

    await this.auditService.log({
      action: AuditAction.MOVIMIENTO_BANCARIO_LOTE_CARGADO,
      entityType: 'movimientos_bancarios',
      entityId: cuentaId,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      newValue: { cuentaId, totalMovimientos: movimientos.length, insertados, duplicados: movimientos.length - insertados },
    });

    return {
      totalMovimientos: movimientos.length,
      insertados,
      duplicados: movimientos.length - insertados,
    };
  }

  // ────────────────────────────
  //  CONCILIAR / DESCONCILIAR
  // ────────────────────────────
  async conciliar(movimientoId: string, dto: ConciliarMovimientoDto, userId: string) {
    const movimiento = await this.buscarMovimientoConCuenta(movimientoId);
    if (movimiento.conciliado) {
      return this.fallir(
        AuditAction.MOVIMIENTO_CONCILIADO,
        movimientoId,
        'MOVIMIENTO_YA_CONCILIADO',
        ConflictException,
        'El movimiento ya está conciliado',
      );
    }
    const monto = Number(movimiento.deposito ?? movimiento.retiro);

    const transaccion = await this.prisma.transacciones.findFirst({
      where: { id: dto.transaccionId, activo: true, eliminado_en: null },
    });
    if (!transaccion) {
      return this.fallir(
        AuditAction.MOVIMIENTO_CONCILIADO,
        movimientoId,
        'TRANSACCION_NO_ENCONTRADA',
        NotFoundException,
        'La transacción seleccionada no existe',
      );
    }

    const esDeposito = movimiento.deposito != null;
    const tipoEsperado = esDeposito ? TipoTransaccion.INGRESO : TipoTransaccion.EGRESO;
    if (transaccion.tipo !== tipoEsperado) {
      return this.fallir(
        AuditAction.MOVIMIENTO_CONCILIADO,
        movimientoId,
        'TIPO_CRUZADO',
        ConflictException,
        esDeposito
          ? 'Un depósito solo concilia contra un INGRESO'
          : 'Un retiro solo concilia contra un EGRESO',
      );
    }
    if (Math.abs(Number(transaccion.monto) - monto) > 0.01) {
      return this.fallir(
        AuditAction.MOVIMIENTO_CONCILIADO,
        movimientoId,
        'MONTO_NO_COINCIDE',
        ConflictException,
        `El monto del movimiento (${monto}) no coincide con el de la transacción (${Number(transaccion.monto)})`,
      );
    }

    const now = new Date();
    try {
      await this.prisma.$transaction(async (tx) => {
        // Guard anti doble clic: solo concilia la fila que sigue sin conciliar.
        const actualizado = await tx.movimientos_bancarios.updateMany({
          where: { id: movimientoId, conciliado: false },
          data: {
            conciliado: true,
            transaccion_id: transaccion.id,
            conciliado_en: now,
            conciliado_por: userId,
            actualizado_en: now,
          },
        });
        if (actualizado.count === 0) {
          throw new ConflictException('El movimiento ya fue conciliado');
        }
      });
    } catch (e) {
      if (e instanceof ConflictException) {
        return this.fallir(
          AuditAction.MOVIMIENTO_CONCILIADO,
          movimientoId,
          'MOVIMIENTO_YA_CONCILIADO',
          ConflictException,
          'El movimiento ya fue conciliado',
        );
      }
      throw e;
    }

    await this.auditService.log({
      action: AuditAction.MOVIMIENTO_CONCILIADO,
      entityType: 'movimientos_bancarios',
      entityId: movimientoId,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      newValue: {
        cuentaId: movimiento.cuenta_id,
        transaccionId: transaccion.id,
        monto,
        fecha: (movimiento.fecha as Date).toISOString().split('T')[0],
      },
    });

    return { conciliado: true, movimientoId, transaccionId: transaccion.id, monto };
  }

  async desconciliar(movimientoId: string, userId: string) {
    const movimiento = await this.buscarMovimientoConCuenta(movimientoId);
    if (!movimiento.conciliado) {
      return this.fallir(
        AuditAction.MOVIMIENTO_DESCONCILIADO,
        movimientoId,
        'MOVIMIENTO_NO_CONCILIADO',
        ConflictException,
        'El movimiento no está conciliado',
      );
    }
    const transaccionId = movimiento.transaccion_id;

    await this.prisma.movimientos_bancarios.update({
      where: { id: movimientoId },
      data: {
        conciliado: false,
        transaccion_id: null,
        conciliado_en: null,
        conciliado_por: null,
        actualizado_en: new Date(),
      },
    });

    await this.auditService.log({
      action: AuditAction.MOVIMIENTO_DESCONCILIADO,
      entityType: 'movimientos_bancarios',
      entityId: movimientoId,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      newValue: { transaccionId, monto: Number(movimiento.deposito ?? movimiento.retiro) },
    });

    return { conciliado: false, movimientoId };
  }

  // ────────────────────────────
  //  HELPERS
  // ────────────────────────────
  private async existeBanco(bancoId: string) {
    const banco = await this.prisma.bancos.findFirst({
      where: { id: bancoId, activo: true },
      select: { id: true },
    });
    if (!banco) throw new NotFoundException('Banco no encontrado');
  }

  private async existeCuenta(cuentaId: string) {
    const cuenta = await this.prisma.cuentas_bancarias.findFirst({
      where: { id: cuentaId, activo: true },
      select: { id: true },
    });
    if (!cuenta) throw new NotFoundException('Cuenta bancaria no encontrada');
  }

  private async buscarMovimientoConCuenta(movimientoId: string) {
    const movimiento = await this.prisma.movimientos_bancarios.findUnique({
      where: { id: movimientoId },
    });
    if (!movimiento) throw new NotFoundException('Movimiento bancario no encontrado');
    return movimiento;
  }

  private validarMontos(
    deposito: number | undefined,
    retiro: number | undefined,
    action: AuditAction,
    entityId: string | null,
  ) {
    if (deposito != null && retiro != null) {
      return this.fallir(
        action,
        entityId,
        'MONTO_AMBOS',
        BadRequestException,
        'Un movimiento no puede tener depósito y retiro a la vez',
      );
    }
    if (deposito == null && retiro == null) {
      return this.fallir(
        action,
        entityId,
        'MONTO_FALTANTE',
        BadRequestException,
        'Debe indicar depósito o retiro',
      );
    }
  }

  /** Parser CSV mínimo: `fecha;descripcion;deposito;retiro` (o `,`), BOM opcional, header opcional. */
  private parseCsv(raw: string): MovimientoCsv[] {
    const lineas = raw
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .filter((l) => l.trim().length > 0);
    if (lineas.length === 0) return [];

    const resultado: MovimientoCsv[] = [];
    for (let i = 0; i < lineas.length; i++) {
      const cols = lineas[i].split(/[;,]/, 4);
      const [fecha, descripcion, depositoRaw, retiroRaw] = cols.map((c) => c.trim());
      // Header opcional: primera línea con "fecha" o "descripcion" se ignora.
      if (i === 0 && /fecha|descripcion/i.test(lineas[i])) continue;
      if (!fecha || !descripcion) continue;

      const deposito = depositoRaw ? Number(depositoRaw) : null;
      const retiro = retiroRaw ? Number(retiroRaw) : null;
      const montoValido = (deposito != null && Number.isFinite(deposito) && deposito > 0) ||
        (retiro != null && Number.isFinite(retiro) && retiro > 0);
      const fechaValida = !Number.isNaN(new Date(`${fecha}T00:00:00`).getTime());
      if (!montoValido || !fechaValida) continue;

      resultado.push({
        fecha,
        descripcion,
        deposito: deposito != null && deposito > 0 ? deposito : null,
        retiro: retiro != null && retiro > 0 ? retiro : null,
      });
    }
    return resultado;
  }

  /** Audita un fallo de negocio y lanza la excepción correspondiente. */
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
      entityType: 'movimientos_bancarios',
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
    });
    throw new Excepcion(message);
  }

  /** Llave de idempotencia para dedupe manual (Postgres no colisiona NULLs en UNIQUE). */
  private claveMovimiento(
    fecha: Date | string,
    descripcion: string,
    deposito: unknown,
    retiro: unknown,
  ): string {
    const f = fecha instanceof Date ? fecha.toISOString().split('T')[0] : String(fecha).split('T')[0];
    return `${f}|${descripcion}|${deposito ?? ''}|${retiro ?? ''}`;
  }

  private serializeBanco(banco: { id: string; nombre: string; activo: boolean }) {
    return { id: banco.id, nombre: banco.nombre, activo: banco.activo };
  }

  private serializeCuenta(cuenta: { id: string; banco_id: string; numero: string; nombre: string | null; saldo_inicial: unknown; activo: boolean }) {
    return {
      id: cuenta.id,
      bancoId: cuenta.banco_id,
      numero: cuenta.numero,
      nombre: cuenta.nombre,
      saldoInicial: Number(cuenta.saldo_inicial),
      activo: cuenta.activo,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serializeMovimiento(m: any) {
    return {
      id: m.id,
      cuentaId: m.cuenta_id,
      fecha: (m.fecha as Date).toISOString().split('T')[0],
      descripcion: m.descripcion,
      deposito: m.deposito != null ? Number(m.deposito) : null,
      retiro: m.retiro != null ? Number(m.retiro) : null,
      conciliado: m.conciliado,
      transaccionId: m.transaccion_id,
      conciliadoEn: m.conciliado_en?.toISOString?.() ?? null,
      conciliadoPor: m.conciliado_por,
      creadoEn: m.creado_en?.toISOString?.() ?? null,
    };
  }
}