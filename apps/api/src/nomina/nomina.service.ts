import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult, MetodoPago, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AsistenciaService } from '../asistencia/asistencia.service';
import { RegistrarAjusteDto } from './dto/registrar-ajuste.dto';
import { ActualizarEstadoNominaDto } from './dto/actualizar-estado-nomina.dto';
import { QueryPeriodoDto } from './dto/query-periodo.dto';

export interface LineaNominaResponse {
  id: string;
  concepto: string;
  tipo: string;
  monto: number;
}

export interface NominaRowResponse {
  id: string;
  trabajadorId: string;
  trabajadorNombre: string;
  puesto: string;
  categoriaPuesto: string;
  avatar: string;
  metodoPago: 'Tarjeta' | 'Efectivo' | 'Mixto';
  sueldoFiscal: number;
  sueldoEfectivo: number;
  diasTrabajados: number;
  diasFaltas: number;
  horasOrdinarias: number;
  horasExtra: number;
  totalPercepciones: number;
  totalDeducciones: number;
  totalNeto: number;
  estado: 'Pendiente' | 'Pagado';
  percepciones: LineaNominaResponse[];
  deducciones: LineaNominaResponse[];
}

export interface PeriodoNominaResponse {
  id: string;
  codigo: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
}

const METODO_DB_A_UI: Record<string, NominaRowResponse['metodoPago']> = {
  TARJETA: 'Tarjeta',
  EFECTIVO: 'Efectivo',
  MIXTO: 'Mixto',
};

const MESES_ABREV = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const TARIFA_HORA_EXTRA_DEFECTO = 80;

const NOMINA_INCLUDE = {
  trabajadores: { include: { categorias_puesto: true } },
  percepciones_nomina: { where: { activo: true } },
  deducciones_nomina: { where: { activo: true } },
} as const;

type NominaConRelaciones = Prisma.nominasGetPayload<{ include: typeof NOMINA_INCLUDE }>;

const ENTITY_NOMINA = 'nominas';
const ENTITY_PERIODO = 'periodos_nomina';
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class NominaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly asistenciaService: AsistenciaService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async fallir<A extends new (message: string) => any>(
    action: AuditAction,
    entityType: string,
    entityId: string | null,
    errorCode: string,
    Excepcion: A,
    message: string,
  ): Promise<never> {
    await this.auditService.log({
      action,
      entityType,
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
    });
    throw new Excepcion(message);
  }

  // ────────────────────────────────────────────
  //  PERIODO ACTUAL (auto-resuelto, tipo "asegurar recurso")
  // ────────────────────────────────────────────

  async findActual(query: QueryPeriodoDto, userId: string): Promise<{ periodo: PeriodoNominaResponse; items: NominaRowResponse[] }> {
    const periodo = await this.resolverPeriodoActual(query.fecha, userId);
    await this.asegurarNominasDelPeriodo(periodo.id, userId);
    const items = await this.listarNominasDePeriodo(periodo.id);
    return { periodo: this.periodoToResponse(periodo), items };
  }

  private async resolverPeriodoActual(fecha: string | undefined, userId: string) {
    const fechaBase = fecha ? this.soloFecha(new Date(fecha)) : this.fechaHoy();
    const lunes = this.lunesDeLaSemana(fechaBase);
    const sabado = new Date(Date.UTC(lunes.getUTCFullYear(), lunes.getUTCMonth(), lunes.getUTCDate() + 5));

    let periodo = await this.prisma.periodos_nomina.findFirst({
      where: { fecha_inicio: lunes, fecha_fin: sabado, eliminado_en: null },
    });

    if (!periodo) {
      periodo = await this.prisma.periodos_nomina.create({
        data: {
          id: randomUUID(),
          codigo: `NOM-${lunes.getUTCFullYear()}-S${String(this.numeroSemanaISO(lunes)).padStart(2, '0')}-${randomUUID().slice(0, 4)}`,
          nombre: `Semana ${this.numeroSemanaISO(lunes)}: ${this.formatRango(lunes, sabado)}`,
          tipo: 'SEMANAL',
          fecha_inicio: lunes,
          fecha_fin: sabado,
          estado: 'ABIERTO',
          creado_por: userId,
          actualizado_por: userId,
          actualizado_en: new Date(),
        },
      });
    }

    return periodo;
  }

  private async asegurarNominasDelPeriodo(periodoId: string, userId: string): Promise<void> {
    const trabajadoresActivos = await this.prisma.trabajadores.findMany({
      where: { eliminado_en: null, estado: 'ACTIVO' },
    });
    const existentes = await this.prisma.nominas.findMany({
      where: { periodo_id: periodoId, eliminado_en: null },
      select: { trabajador_id: true },
    });
    const idsConNomina = new Set(existentes.map((n) => n.trabajador_id));

    for (const t of trabajadoresActivos) {
      if (idsConNomina.has(t.id)) continue;
      await this.prisma.nominas.create({
        data: {
          id: randomUUID(),
          periodo_id: periodoId,
          trabajador_id: t.id,
          sueldo_fiscal: t.sueldo_fiscal,
          sueldo_efectivo: t.sueldo_efectivo,
          total_percepciones: 0,
          total_deducciones: 0,
          total_neto: Number(t.sueldo_fiscal) + Number(t.sueldo_efectivo),
          metodo_pago: t.metodo_pago as MetodoPago,
          estado: 'PENDIENTE',
          creado_por: userId,
          actualizado_por: userId,
          actualizado_en: new Date(),
        },
      });
    }
  }

  private async listarNominasDePeriodo(periodoId: string): Promise<NominaRowResponse[]> {
    const nominas = await this.prisma.nominas.findMany({
      where: { periodo_id: periodoId, eliminado_en: null },
      include: NOMINA_INCLUDE,
    });
    nominas.sort((a, b) => a.trabajadores.nombre.localeCompare(b.trabajadores.nombre));
    return nominas.map((n) => this.toResponse(n));
  }

  // ────────────────────────────────────────────
  //  SINCRONIZAR CON ASISTENCIA
  // ────────────────────────────────────────────

  async sincronizarAsistencia(
    periodoId: string,
    userId: string,
  ): Promise<{ items: NominaRowResponse[]; totalHorasExtraSincronizadas: number; totalFaltasAplicadas: number }> {
    const periodo = await this.prisma.periodos_nomina.findFirst({ where: { id: periodoId, eliminado_en: null } });
    if (!periodo) {
      return this.fallir(
        AuditAction.NOMINA_PROCESADA,
        ENTITY_PERIODO,
        periodoId,
        'PERIODO_NO_ENCONTRADO',
        NotFoundException,
        `Periodo de nómina con id "${periodoId}" no encontrado`,
      );
    }

    const nominas = await this.prisma.nominas.findMany({
      where: { periodo_id: periodoId, eliminado_en: null },
      include: { trabajadores: true },
    });

    const fechaSemana = periodo.fecha_inicio.toISOString().split('T')[0];
    const semanal = await this.asistenciaService.findSemanal({ fecha: fechaSemana });
    const semanalPorTrabajador = new Map(semanal.map((s) => [s.trabajadorId, s]));

    let totalHorasExtraSincronizadas = 0;
    let totalFaltasAplicadas = 0;

    for (const nomina of nominas) {
      const datos = semanalPorTrabajador.get(nomina.trabajador_id);
      const diasTrabajados = datos?.totalDiasAsistidos ?? 0;
      const diasFaltas = datos?.totalFaltas ?? 0;
      const horasOrdinarias = datos?.totalHorasOrdinarias ?? 0;
      const horasExtra = datos?.totalHorasExtra ?? 0;

      totalHorasExtraSincronizadas += horasExtra;
      totalFaltasAplicadas += diasFaltas;

      await this.prisma.percepciones_nomina.deleteMany({ where: { nomina_id: nomina.id, tipo: 'HORAS_EXTRA_AUTO' } });
      await this.prisma.deducciones_nomina.deleteMany({ where: { nomina_id: nomina.id, tipo: 'FALTA_AUTO' } });

      if (horasExtra > 0) {
        const tarifa = Number(nomina.trabajadores.tarifa_hora_extra ?? TARIFA_HORA_EXTRA_DEFECTO);
        await this.prisma.percepciones_nomina.create({
          data: {
            id: randomUUID(),
            nomina_id: nomina.id,
            concepto: 'Horas extra (GPS)',
            tipo: 'HORAS_EXTRA_AUTO',
            monto: Number((horasExtra * tarifa).toFixed(2)),
            actualizado_en: new Date(),
          },
        });
      }

      if (diasFaltas > 0) {
        const sueldoDiario = (Number(nomina.sueldo_fiscal) + Number(nomina.sueldo_efectivo)) / 6;
        await this.prisma.deducciones_nomina.create({
          data: {
            id: randomUUID(),
            nomina_id: nomina.id,
            concepto: `${diasFaltas} inasistencia(s) detectada(s)`,
            tipo: 'FALTA_AUTO',
            monto: Number((sueldoDiario * diasFaltas).toFixed(2)),
            actualizado_en: new Date(),
          },
        });
      }

      await this.prisma.nominas.update({
        where: { id: nomina.id },
        data: {
          dias_trabajados: diasTrabajados,
          dias_faltas: diasFaltas,
          horas_ordinarias: horasOrdinarias,
          horas_extra: horasExtra,
          actualizado_por: userId,
          actualizado_en: new Date(),
        },
      });

      await this.recomputarTotales(nomina.id, userId);
    }

    await this.auditService.log({
      action: AuditAction.NOMINA_PROCESADA,
      entityType: ENTITY_PERIODO,
      entityId: periodoId,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: { totalHorasExtraSincronizadas, totalFaltasAplicadas },
    });

    return {
      items: await this.listarNominasDePeriodo(periodoId),
      totalHorasExtraSincronizadas: Number(totalHorasExtraSincronizadas.toFixed(2)),
      totalFaltasAplicadas,
    };
  }

  // ────────────────────────────────────────────
  //  AJUSTES MANUALES (BONO / DESCUENTO / PRÉSTAMO)
  // ────────────────────────────────────────────

  async registrarAjuste(nominaId: string, dto: RegistrarAjusteDto, userId: string): Promise<NominaRowResponse> {
    const nomina = await this.prisma.nominas.findFirst({ where: { id: nominaId, eliminado_en: null } });
    if (!nomina) {
      return this.fallir(
        AuditAction.NOMINA_AJUSTE_APLICADO,
        ENTITY_NOMINA,
        nominaId,
        'NOMINA_NO_ENCONTRADA',
        NotFoundException,
        `Registro de nómina con id "${nominaId}" no encontrado`,
      );
    }

    if (dto.tipo === 'Bono') {
      await this.prisma.percepciones_nomina.create({
        data: { id: randomUUID(), nomina_id: nominaId, concepto: dto.concepto, tipo: 'BONO', monto: dto.monto, actualizado_en: new Date() },
      });
    } else {
      const tipo = dto.tipo === 'Prestamo' ? 'PRESTAMO' : 'DESCUENTO';
      await this.prisma.deducciones_nomina.create({
        data: { id: randomUUID(), nomina_id: nominaId, concepto: dto.concepto, tipo, monto: dto.monto, actualizado_en: new Date() },
      });
    }

    await this.recomputarTotales(nominaId, userId);
    const serializado = this.toResponse(await this.obtenerNominaCompleta(nominaId));

    await this.auditService.log({
      action: AuditAction.NOMINA_AJUSTE_APLICADO,
      entityType: ENTITY_NOMINA,
      entityId: nominaId,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: { tipo: dto.tipo, monto: dto.monto, concepto: dto.concepto },
    });

    return serializado;
  }

  async actualizarEstado(nominaId: string, dto: ActualizarEstadoNominaDto, userId: string): Promise<NominaRowResponse> {
    const nomina = await this.prisma.nominas.findFirst({ where: { id: nominaId, eliminado_en: null } });
    if (!nomina) {
      return this.fallir(
        AuditAction.NOMINA_PAGO_MARCADO,
        ENTITY_NOMINA,
        nominaId,
        'NOMINA_NO_ENCONTRADA',
        NotFoundException,
        `Registro de nómina con id "${nominaId}" no encontrado`,
      );
    }

    const estadoDb = dto.estado === 'Pagado' ? 'PAGADA' : 'PENDIENTE';
    await this.prisma.nominas.update({
      where: { id: nominaId },
      data: { estado: estadoDb, actualizado_por: userId, actualizado_en: new Date() },
    });

    const serializado = this.toResponse(await this.obtenerNominaCompleta(nominaId));

    await this.auditService.log({
      action: AuditAction.NOMINA_PAGO_MARCADO,
      entityType: ENTITY_NOMINA,
      entityId: nominaId,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: { estado: dto.estado },
    });

    return serializado;
  }

  async pagarTodos(periodoId: string, userId: string): Promise<{ items: NominaRowResponse[]; actualizados: number }> {
    const periodo = await this.prisma.periodos_nomina.findFirst({ where: { id: periodoId, eliminado_en: null } });
    if (!periodo) {
      return this.fallir(
        AuditAction.NOMINA_PAGO_MARCADO,
        ENTITY_PERIODO,
        periodoId,
        'PERIODO_NO_ENCONTRADO',
        NotFoundException,
        `Periodo de nómina con id "${periodoId}" no encontrado`,
      );
    }

    const resultado = await this.prisma.nominas.updateMany({
      where: { periodo_id: periodoId, eliminado_en: null },
      data: { estado: 'PAGADA', actualizado_por: userId, actualizado_en: new Date() },
    });

    await this.auditService.log({
      action: AuditAction.NOMINA_PAGO_MARCADO,
      entityType: ENTITY_PERIODO,
      entityId: periodoId,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: { actualizados: resultado.count },
    });

    return { items: await this.listarNominasDePeriodo(periodoId), actualizados: resultado.count };
  }

  // ────────────────────────────────────────────
  //  HELPERS
  // ────────────────────────────────────────────

  private async recomputarTotales(nominaId: string, userId: string): Promise<void> {
    const [percepciones, deducciones, nomina] = await Promise.all([
      this.prisma.percepciones_nomina.findMany({ where: { nomina_id: nominaId, activo: true } }),
      this.prisma.deducciones_nomina.findMany({ where: { nomina_id: nominaId, activo: true } }),
      this.prisma.nominas.findUniqueOrThrow({ where: { id: nominaId } }),
    ]);

    const totalPercepciones = percepciones.reduce((s, p) => s + Number(p.monto), 0);
    const totalDeducciones = deducciones.reduce((s, d) => s + Number(d.monto), 0);
    const totalNeto = Number(nomina.sueldo_fiscal) + Number(nomina.sueldo_efectivo) + totalPercepciones - totalDeducciones;

    await this.prisma.nominas.update({
      where: { id: nominaId },
      data: {
        total_percepciones: Number(totalPercepciones.toFixed(2)),
        total_deducciones: Number(totalDeducciones.toFixed(2)),
        total_neto: Number(totalNeto.toFixed(2)),
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
    });
  }

  private obtenerNominaCompleta(id: string): Promise<NominaConRelaciones> {
    return this.prisma.nominas.findUniqueOrThrow({ where: { id }, include: NOMINA_INCLUDE });
  }

  private fechaHoy(): Date {
    const ahora = new Date();
    return new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()));
  }

  private soloFecha(d: Date): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  private lunesDeLaSemana(fecha: Date): Date {
    const dia = fecha.getUTCDay();
    const offset = (dia + 6) % 7;
    return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate() - offset));
  }

  private numeroSemanaISO(fecha: Date): number {
    const d = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private formatRango(lunes: Date, sabado: Date): string {
    const inicio = `${lunes.getUTCDate()} ${MESES_ABREV[lunes.getUTCMonth()]}`;
    const fin = `${sabado.getUTCDate()} ${MESES_ABREV[sabado.getUTCMonth()]}`;
    return `${inicio} – ${fin} ${sabado.getUTCFullYear()}`;
  }

  private periodoToResponse(p: { id: string; codigo: string; nombre: string; fecha_inicio: Date; fecha_fin: Date; estado: string }) {
    return {
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      fechaInicio: p.fecha_inicio.toISOString().split('T')[0],
      fechaFin: p.fecha_fin.toISOString().split('T')[0],
      estado: p.estado,
    };
  }

  private toResponse(n: NominaConRelaciones) {
    return {
      id: n.id,
      trabajadorId: n.trabajador_id,
      trabajadorNombre: n.trabajadores.nombre,
      puesto: n.trabajadores.puesto,
      categoriaPuesto: n.trabajadores.categorias_puesto?.nombre ?? '',
      avatar: n.trabajadores.avatar,
      metodoPago: METODO_DB_A_UI[n.metodo_pago ?? 'EFECTIVO'] ?? 'Efectivo',
      sueldoFiscal: Number(n.sueldo_fiscal),
      sueldoEfectivo: Number(n.sueldo_efectivo),
      diasTrabajados: n.dias_trabajados,
      diasFaltas: n.dias_faltas,
      horasOrdinarias: Number(n.horas_ordinarias),
      horasExtra: Number(n.horas_extra),
      totalPercepciones: Number(n.total_percepciones),
      totalDeducciones: Number(n.total_deducciones),
      totalNeto: Number(n.total_neto),
      estado: n.estado === 'PAGADA' ? ('Pagado' as const) : ('Pendiente' as const),
      percepciones: n.percepciones_nomina.map((p) => ({ id: p.id, concepto: p.concepto, tipo: p.tipo, monto: Number(p.monto) })),
      deducciones: n.deducciones_nomina.map((d) => ({ id: d.id, concepto: d.concepto, tipo: d.tipo, monto: Number(d.monto) })),
    };
  }
}
