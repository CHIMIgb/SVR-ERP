import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTrabajadorDto } from './dto/create-trabajador.dto';
import { UpdateTrabajadorDto } from './dto/update-trabajador.dto';
import { QueryTrabajadoresDto } from './dto/query-trabajadores.dto';
import { LiquidarTrabajadorDto } from './dto/liquidar-trabajador.dto';

export interface TrabajadorResponse {
  id: string;
  nombre: string;
  puesto: string;
  categoriaPuesto: string;
  estado: 'Activo' | 'Inactivo' | 'Vacaciones';
  entrada: string;
  telefono: string;
  proyectos: string[];
  avatar: string;
  sueldoFiscal: number;
  sueldoEfectivo: number;
  metodoPago: 'Tarjeta' | 'Efectivo' | 'Mixto';
  maquinaAsignadaId?: string;
  maquinaAsignadaNombre?: string;
  estadoRenta?: string;
  clienteRentaActual?: string;
  licenciaODC3?: { tipo: string; vigencia: string; folio: string };
  fechaContratacion?: string;
  contactoEmergencia?: { nombre: string; telefono: string; parentesco: string };
  vacacionesDias?: number;
  horasExtraSemana?: number;
  tarifaHoraExtra?: number;
  descuentosSemana?: number;
  conceptoDescuento?: string;
}

const CATEGORIA_DB_A_UI: Record<string, string> = {
  Operador: 'Operador',
  Chofer: 'Chofer',
  Mecanico: 'Mecanico',
  Ingeniero: 'Ingeniero',
  Administrativo: 'Administrativo',
};

const ESTADO_UI_A_DB = { Activo: 'ACTIVO', Inactivo: 'INACTIVO', Vacaciones: 'VACACIONES' } as const;
const ESTADO_DB_A_UI: Record<string, TrabajadorResponse['estado']> = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  VACACIONES: 'Vacaciones',
};

const METODO_UI_A_DB = { Tarjeta: 'TARJETA', Efectivo: 'EFECTIVO', Mixto: 'MIXTO' } as const;
const METODO_DB_A_UI: Record<string, TrabajadorResponse['metodoPago']> = {
  TARJETA: 'Tarjeta',
  EFECTIVO: 'Efectivo',
  MIXTO: 'Mixto',
};

const ESTADO_RENTA_DB_A_UI: Record<string, string> = {
  RENTADO_CLIENTE: 'Rentado a Cliente',
  EN_OBRA_PROPIA: 'En Obra Propia',
  DISPONIBLE_PATIO: 'Disponible en Patio',
};

const CATEGORIA_LICENCIA_UI_A_DB: Record<string, string> = {
  DC3: 'DC3',
  'Licencia Federal': 'LICENCIA_FEDERAL',
  'Certificado Técnico': 'CERTIFICADO_TECNICO',
  'Cédula Profesional': 'CEDULA_PROFESIONAL',
  Otro: 'OTRO',
};

const TRABAJADOR_INCLUDE = {
  categorias_puesto: { select: { nombre: true } },
  licencias_trabajador: true,
  contactos_emergencia: true,
  clientes: { select: { nombre: true } },
  trabajadores_proyectos: {
    where: { eliminado_en: null },
    include: { proyectos: { select: { nombre: true } } },
  },
} as const;

const ENTITY_TYPE = 'trabajadores';
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class TrabajadoresService {
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
      entityType: ENTITY_TYPE,
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
    });
    throw new Excepcion(message);
  }

  async findAll(query: QueryTrabajadoresDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 12, 100);

    const where: Prisma.trabajadoresWhereInput = { eliminado_en: null };

    if (query.categoriaPuesto) {
      where.categorias_puesto = { nombre: query.categoriaPuesto };
    }
    if (query.estado) {
      where.estado = ESTADO_UI_A_DB[query.estado];
    }
    if (query.search) {
      where.OR = [
        { nombre: { contains: query.search, mode: 'insensitive' } },
        { puesto: { contains: query.search, mode: 'insensitive' } },
        { clientes: { nombre: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.trabajadores.findMany({
        where,
        include: TRABAJADOR_INCLUDE,
        orderBy: { nombre: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.trabajadores.count({ where }),
    ]);

    // Máquina asignada como operador — relación inversa, se resuelve en lote.
    const maquinas = await this.prisma.maquinas.findMany({
      where: { operador_id: { in: items.map((t) => t.id) }, eliminado_en: null },
      select: { id: true, codigo: true, nombre: true, operador_id: true },
    });
    const maquinaPorOperador = new Map(maquinas.map((m) => [m.operador_id as string, m]));

    return {
      items: items.map((item) => this.toResponse(item, maquinaPorOperador.get(item.id))),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(id: string): Promise<TrabajadorResponse> {
    const trabajador = await this.prisma.trabajadores.findFirst({
      where: { id, eliminado_en: null },
      include: TRABAJADOR_INCLUDE,
    });
    if (!trabajador) {
      throw new NotFoundException(`Trabajador con id "${id}" no encontrado`);
    }

    const maquina = await this.prisma.maquinas.findFirst({
      where: { operador_id: id, eliminado_en: null },
      select: { id: true, codigo: true, nombre: true, operador_id: true },
    });

    return this.toResponse(trabajador, maquina ?? undefined);
  }

  async create(dto: CreateTrabajadorDto, userId: string): Promise<TrabajadorResponse> {
    const categoriaId = await this.resolverCategoriaPuesto(dto.categoriaPuesto);

    let maquinaId: string | undefined;
    if (dto.maquinaId) {
      const maquina = await this.prisma.maquinas.findFirst({
        where: { codigo: dto.maquinaId, eliminado_en: null },
      });
      if (!maquina) {
        return this.fallir(
          AuditAction.TRABAJADOR_CREADO,
          null,
          'MAQUINA_NO_ENCONTRADA',
          NotFoundException,
          `No existe la máquina "${dto.maquinaId}"`,
        );
      }
      maquinaId = maquina.id;
    }

    const trabajadorId = randomUUID();
    const now = new Date();

    const creado = await this.prisma.$transaction(async (tx) => {
      const nuevo = await tx.trabajadores.create({
        data: {
          id: trabajadorId,
          nombre: dto.nombre.trim(),
          puesto: dto.puesto.trim(),
          categoria_puesto_id: categoriaId,
          estado: 'ACTIVO',
          telefono: dto.telefono,
          entrada: this.horaAUtc(dto.entrada),
          avatar: this.iniciales(dto.nombre),
          sueldo_fiscal: dto.sueldoFiscal,
          sueldo_efectivo: dto.sueldoEfectivo,
          metodo_pago: METODO_UI_A_DB[dto.metodoPago],
          estado_renta: 'EN_OBRA_PROPIA',
          fecha_contratacion: dto.fechaContratacion ? new Date(dto.fechaContratacion) : now,
          vacaciones_dias: dto.vacacionesDias,
          horas_extra_semana: dto.horasExtraSemana,
          tarifa_hora_extra: dto.tarifaHoraExtra,
          descuentos_semana: dto.descuentosSemana,
          concepto_descuento: dto.conceptoDescuento,
          creado_por: userId,
          actualizado_por: userId,
          actualizado_en: now,
        },
      });

      if (maquinaId) {
        await tx.maquinas.update({ where: { id: maquinaId }, data: { operador_id: trabajadorId } });
      }

      if (dto.proyecto) {
        const proyecto = await tx.proyectos.findFirst({ where: { nombre: dto.proyecto, eliminado_en: null } });
        if (proyecto) {
          await tx.trabajadores_proyectos.create({
            data: { trabajador_id: trabajadorId, proyecto_id: proyecto.id, creado_por: userId },
          });
        }
      }

      if (dto.licencia) {
        await tx.licencias_trabajador.create({
          data: {
            id: randomUUID(),
            trabajador_id: trabajadorId,
            tipo: dto.licencia.tipo,
            categoria: CATEGORIA_LICENCIA_UI_A_DB[dto.licencia.categoria] as never,
            folio: dto.licencia.folio,
            vigencia: dto.licencia.vigencia ? new Date(dto.licencia.vigencia) : undefined,
            vigencia_indefinida: dto.licencia.vigenciaIndefinida ?? false,
            creado_por: userId,
            actualizado_por: userId,
            actualizado_en: now,
          },
        });
      }

      if (dto.contactoEmergencia) {
        await tx.contactos_emergencia.create({
          data: {
            id: randomUUID(),
            trabajador_id: trabajadorId,
            nombre: dto.contactoEmergencia.nombre,
            telefono: dto.contactoEmergencia.telefono,
            parentesco: dto.contactoEmergencia.parentesco,
            creado_por: userId,
            actualizado_por: userId,
            actualizado_en: now,
          },
        });
      }

      return tx.trabajadores.findUniqueOrThrow({ where: { id: trabajadorId }, include: TRABAJADOR_INCLUDE });
    });

    const maquina = maquinaId
      ? await this.prisma.maquinas.findUnique({ where: { id: maquinaId }, select: { id: true, codigo: true, nombre: true, operador_id: true } })
      : undefined;

    const serialized = this.toResponse(creado, maquina ?? undefined);

    await this.auditService.log({
      action: AuditAction.TRABAJADOR_CREADO,
      entityType: ENTITY_TYPE,
      entityId: trabajadorId,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: serialized,
    });

    return serialized;
  }

  async update(id: string, dto: UpdateTrabajadorDto, userId: string): Promise<TrabajadorResponse> {
    const existente = await this.prisma.trabajadores.findFirst({
      where: { id, eliminado_en: null },
      include: TRABAJADOR_INCLUDE,
    });
    if (!existente) {
      return this.fallir(
        AuditAction.TRABAJADOR_ACTUALIZADO,
        id,
        'TRABAJADOR_NO_ENCONTRADO',
        NotFoundException,
        `Trabajador con id "${id}" no encontrado`,
      );
    }

    const maquinaAnterior = await this.prisma.maquinas.findFirst({
      where: { operador_id: id, eliminado_en: null },
      select: { id: true, codigo: true, nombre: true, operador_id: true },
    });

    let categoriaId: string | undefined;
    if (dto.categoriaPuesto) {
      categoriaId = await this.resolverCategoriaPuesto(dto.categoriaPuesto);
    }

    let nuevaMaquinaId: string | null | undefined;
    if (dto.maquinaId !== undefined) {
      if (dto.maquinaId === '') {
        nuevaMaquinaId = null;
      } else {
        const maquina = await this.prisma.maquinas.findFirst({
          where: { codigo: dto.maquinaId, eliminado_en: null },
        });
        if (!maquina) {
          return this.fallir(
            AuditAction.TRABAJADOR_ACTUALIZADO,
            id,
            'MAQUINA_NO_ENCONTRADA',
            NotFoundException,
            `No existe la máquina "${dto.maquinaId}"`,
          );
        }
        nuevaMaquinaId = maquina.id;
      }
    }

    const now = new Date();

    const actualizado = await this.prisma.$transaction(async (tx) => {
      await tx.trabajadores.update({
        where: { id },
        data: {
          ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
          ...(dto.puesto !== undefined && { puesto: dto.puesto.trim() }),
          ...(categoriaId && { categoria_puesto_id: categoriaId }),
          ...(dto.estado !== undefined && { estado: ESTADO_UI_A_DB[dto.estado] }),
          ...(dto.telefono !== undefined && { telefono: dto.telefono }),
          ...(dto.entrada !== undefined && { entrada: this.horaAUtc(dto.entrada) }),
          ...(dto.sueldoFiscal !== undefined && { sueldo_fiscal: dto.sueldoFiscal }),
          ...(dto.sueldoEfectivo !== undefined && { sueldo_efectivo: dto.sueldoEfectivo }),
          ...(dto.metodoPago !== undefined && { metodo_pago: METODO_UI_A_DB[dto.metodoPago] }),
          ...(dto.fechaContratacion !== undefined && { fecha_contratacion: new Date(dto.fechaContratacion) }),
          ...(dto.vacacionesDias !== undefined && { vacaciones_dias: dto.vacacionesDias }),
          ...(dto.horasExtraSemana !== undefined && { horas_extra_semana: dto.horasExtraSemana }),
          ...(dto.tarifaHoraExtra !== undefined && { tarifa_hora_extra: dto.tarifaHoraExtra }),
          ...(dto.descuentosSemana !== undefined && { descuentos_semana: dto.descuentosSemana }),
          ...(dto.conceptoDescuento !== undefined && { concepto_descuento: dto.conceptoDescuento }),
          actualizado_por: userId,
          actualizado_en: now,
        },
      });

      if (nuevaMaquinaId !== undefined) {
        // Libera la máquina anterior (si tenía) y asigna la nueva (si aplica).
        if (maquinaAnterior && maquinaAnterior.id !== nuevaMaquinaId) {
          await tx.maquinas.update({ where: { id: maquinaAnterior.id }, data: { operador_id: null } });
        }
        if (nuevaMaquinaId) {
          await tx.maquinas.update({ where: { id: nuevaMaquinaId }, data: { operador_id: id } });
        }
      }

      if (dto.licencia) {
        await tx.licencias_trabajador.upsert({
          where: { trabajador_id: id },
          create: {
            id: randomUUID(),
            trabajador_id: id,
            tipo: dto.licencia.tipo,
            categoria: CATEGORIA_LICENCIA_UI_A_DB[dto.licencia.categoria] as never,
            folio: dto.licencia.folio,
            vigencia: dto.licencia.vigencia ? new Date(dto.licencia.vigencia) : undefined,
            vigencia_indefinida: dto.licencia.vigenciaIndefinida ?? false,
            creado_por: userId,
            actualizado_por: userId,
            actualizado_en: now,
          },
          update: {
            tipo: dto.licencia.tipo,
            categoria: CATEGORIA_LICENCIA_UI_A_DB[dto.licencia.categoria] as never,
            folio: dto.licencia.folio,
            vigencia: dto.licencia.vigencia ? new Date(dto.licencia.vigencia) : undefined,
            vigencia_indefinida: dto.licencia.vigenciaIndefinida ?? false,
            actualizado_por: userId,
            actualizado_en: now,
          },
        });
      }

      if (dto.contactoEmergencia) {
        await tx.contactos_emergencia.upsert({
          where: { trabajador_id: id },
          create: {
            id: randomUUID(),
            trabajador_id: id,
            nombre: dto.contactoEmergencia.nombre,
            telefono: dto.contactoEmergencia.telefono,
            parentesco: dto.contactoEmergencia.parentesco,
            creado_por: userId,
            actualizado_por: userId,
            actualizado_en: now,
          },
          update: {
            nombre: dto.contactoEmergencia.nombre,
            telefono: dto.contactoEmergencia.telefono,
            parentesco: dto.contactoEmergencia.parentesco,
            actualizado_por: userId,
            actualizado_en: now,
          },
        });
      }

      return tx.trabajadores.findUniqueOrThrow({ where: { id }, include: TRABAJADOR_INCLUDE });
    });

    const maquinaFinal =
      nuevaMaquinaId === undefined
        ? maquinaAnterior
        : nuevaMaquinaId
          ? await this.prisma.maquinas.findUnique({ where: { id: nuevaMaquinaId }, select: { id: true, codigo: true, nombre: true, operador_id: true } })
          : null;

    const serialized = this.toResponse(actualizado, maquinaFinal ?? undefined);

    await this.auditService.log({
      action: AuditAction.TRABAJADOR_ACTUALIZADO,
      entityType: ENTITY_TYPE,
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.toResponse(existente, maquinaAnterior ?? undefined),
      newValue: serialized,
    });

    return serialized;
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const existente = await this.prisma.trabajadores.findFirst({
      where: { id, eliminado_en: null },
      include: TRABAJADOR_INCLUDE,
    });
    if (!existente) {
      return this.fallir(
        AuditAction.TRABAJADOR_ELIMINADO,
        id,
        'TRABAJADOR_NO_ENCONTRADO',
        NotFoundException,
        `Trabajador con id "${id}" no encontrado`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.maquinas.updateMany({ where: { operador_id: id }, data: { operador_id: null } });
      await tx.trabajadores.update({
        where: { id },
        data: { eliminado_en: new Date(), activo: false, actualizado_por: userId, actualizado_en: new Date() },
      });
    });

    await this.auditService.log({
      action: AuditAction.TRABAJADOR_ELIMINADO,
      entityType: ENTITY_TYPE,
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.toResponse(existente),
    });

    return { message: 'Trabajador eliminado exitosamente' };
  }

  /**
   * Calculadora de finiquito/liquidación (Ley Federal del Trabajo) — misma
   * fórmula que antes vivía solo en el frontend, ahora es la fuente de
   * verdad en el servidor. Da de baja al trabajador y libera su máquina.
   */
  async liquidar(id: string, dto: LiquidarTrabajadorDto, userId: string) {
    const trabajador = await this.prisma.trabajadores.findFirst({ where: { id, eliminado_en: null } });
    if (!trabajador) {
      return this.fallir(
        AuditAction.TRABAJADOR_LIQUIDADO,
        id,
        'TRABAJADOR_NO_ENCONTRADO',
        NotFoundException,
        `Trabajador con id "${id}" no encontrado`,
      );
    }

    const sueldoDiario = Number((Number(trabajador.sueldo_fiscal) + Number(trabajador.sueldo_efectivo)) / 6);
    const fechaIngreso = trabajador.fecha_contratacion ?? new Date('2023-01-15');
    const diffDays = Math.max(0, Math.ceil((Date.now() - fechaIngreso.getTime()) / 86400000));
    const aniosAntiguedad = Math.max(0.1, Number((diffDays / 365.25).toFixed(2)));

    const diasPeriodo = dto.diasTrabajadosPeriodo;
    const diasVac = dto.diasVacacionesPendientes;
    const prestamos = dto.deduccionesPrestamos ?? 0;

    const montoDiasTrabajados = Number((diasPeriodo * sueldoDiario).toFixed(2));
    const diasAguinaldoProp = Number(((diffDays % 365) * (15 / 365)).toFixed(2));
    const montoAguinaldo = Number((diasAguinaldoProp * sueldoDiario).toFixed(2));
    const montoVacaciones = Number((diasVac * sueldoDiario).toFixed(2));
    const montoPrimaVacacional = Number((montoVacaciones * 0.25).toFixed(2));
    const subtotalFiniquito = montoDiasTrabajados + montoAguinaldo + montoVacaciones + montoPrimaVacacional;

    let montoIndemnizacion90Dias = 0;
    let montoIndemnizacion20DiasPorAno = 0;
    let montoPrimaAntiguedad = 0;

    if (dto.tipoTerminacion === 'Despido') {
      montoIndemnizacion90Dias = Number((90 * sueldoDiario).toFixed(2));
      montoIndemnizacion20DiasPorAno = Number((20 * aniosAntiguedad * sueldoDiario).toFixed(2));
      const salarioTopado = Math.min(sueldoDiario, 498);
      montoPrimaAntiguedad = Number((12 * aniosAntiguedad * salarioTopado).toFixed(2));
    } else if (dto.tipoTerminacion === 'Convenio') {
      montoIndemnizacion90Dias = Number((45 * sueldoDiario).toFixed(2));
    }

    const subtotalIndemnizaciones = montoIndemnizacion90Dias + montoIndemnizacion20DiasPorAno + montoPrimaAntiguedad;
    const granTotalNeto = Math.max(0, Number((subtotalFiniquito + subtotalIndemnizaciones - prestamos).toFixed(2)));

    await this.prisma.$transaction(async (tx) => {
      await tx.maquinas.updateMany({ where: { operador_id: id }, data: { operador_id: null } });
      await tx.trabajadores.update({
        where: { id },
        data: {
          estado: 'INACTIVO',
          estado_renta: null,
          cliente_renta_actual_id: null,
          actualizado_por: userId,
          actualizado_en: new Date(),
        },
      });
    });

    const desglose = {
      tipoTerminacion: dto.tipoTerminacion,
      aniosAntiguedad,
      sueldoDiario: Number(sueldoDiario.toFixed(2)),
      montoDiasTrabajados,
      montoAguinaldo,
      montoVacaciones,
      montoPrimaVacacional,
      subtotalFiniquito,
      montoIndemnizacion90Dias,
      montoIndemnizacion20DiasPorAno,
      montoPrimaAntiguedad,
      subtotalIndemnizaciones,
      deduccionesPrestamos: prestamos,
      granTotalNeto,
    };

    await this.auditService.log({
      action: AuditAction.TRABAJADOR_LIQUIDADO,
      entityType: ENTITY_TYPE,
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: desglose,
    });

    return desglose;
  }

  /**
   * Convierte "HH:mm" a un Date anclado en UTC para columnas @db.Time.
   * OJO: `new Date("1970-01-01THH:mm:00")` sin "Z" se interpreta en la
   * hora LOCAL del proceso, pero luego se lee de vuelta con
   * `.toISOString()` (UTC) — eso desfasa la hora guardada según la
   * zona horaria del servidor (mismo bug ya corregido en checklists).
   */
  private horaAUtc(hhmm: string): Date {
    const [horas, minutos] = hhmm.split(':').map(Number);
    return new Date(Date.UTC(1970, 0, 1, horas, minutos, 0));
  }

  private async resolverCategoriaPuesto(nombre: string): Promise<string> {
    let categoria = await this.prisma.categorias_puesto.findUnique({ where: { nombre } });
    if (!categoria) {
      categoria = await this.prisma.categorias_puesto.create({
        data: { id: randomUUID(), nombre, actualizado_en: new Date() },
      });
    }
    return categoria.id;
  }

  private iniciales(nombre: string): string {
    return nombre
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toResponse(t: any, maquina?: { id: string; codigo: string | null; nombre: string } | null) {
    return {
      id: t.id,
      nombre: t.nombre,
      puesto: t.puesto,
      categoriaPuesto: CATEGORIA_DB_A_UI[t.categorias_puesto?.nombre] ?? t.categorias_puesto?.nombre ?? '',
      estado: ESTADO_DB_A_UI[t.estado] ?? 'Activo',
      entrada: t.entrada instanceof Date ? t.entrada.toISOString().split('T')[1].slice(0, 5) : String(t.entrada),
      telefono: t.telefono,
      proyectos: (t.trabajadores_proyectos ?? []).map((tp: { proyectos: { nombre: string } }) => tp.proyectos.nombre),
      avatar: t.avatar,
      sueldoFiscal: Number(t.sueldo_fiscal),
      sueldoEfectivo: Number(t.sueldo_efectivo),
      metodoPago: METODO_DB_A_UI[t.metodo_pago] ?? 'Efectivo',
      maquinaAsignadaId: maquina?.codigo ?? undefined,
      maquinaAsignadaNombre: maquina?.nombre ?? undefined,
      estadoRenta: t.estado_renta ? ESTADO_RENTA_DB_A_UI[t.estado_renta] : undefined,
      clienteRentaActual: t.clientes?.nombre ?? undefined,
      licenciaODC3: t.licencias_trabajador
        ? {
            tipo: t.licencias_trabajador.tipo,
            vigencia: t.licencias_trabajador.vigencia_indefinida
              ? 'Indefinida'
              : t.licencias_trabajador.vigencia?.toISOString().split('T')[0] ?? '',
            folio: t.licencias_trabajador.folio,
          }
        : undefined,
      fechaContratacion: t.fecha_contratacion?.toISOString().split('T')[0],
      contactoEmergencia: t.contactos_emergencia
        ? {
            nombre: t.contactos_emergencia.nombre,
            telefono: t.contactos_emergencia.telefono,
            parentesco: t.contactos_emergencia.parentesco,
          }
        : undefined,
      vacacionesDias: t.vacaciones_dias ?? undefined,
      horasExtraSemana: t.horas_extra_semana != null ? Number(t.horas_extra_semana) : undefined,
      tarifaHoraExtra: t.tarifa_hora_extra != null ? Number(t.tarifa_hora_extra) : undefined,
      descuentosSemana: t.descuentos_semana != null ? Number(t.descuentos_semana) : undefined,
      conceptoDescuento: t.concepto_descuento ?? undefined,
    };
  }
}
