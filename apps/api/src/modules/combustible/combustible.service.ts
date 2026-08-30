import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateCargaCombustibleDto } from './dto/create-carga-combustible.dto';
import { UpdateCargaCombustibleDto } from './dto/update-carga-combustible.dto';
import { QueryCargaCombustibleDto } from './dto/query-carga-combustible.dto';

/** Shape esperado por el frontend (packages/shared/types/operaciones.ts). */
export interface CargaCombustibleResponse {
  id: string;
  maquinaId: string;
  fecha: string;
  litros: number;
  costo: number;
  operador: string;
  lugar: string;
  horometroActual: number;
  horasTrabajadasPeriodo: number;
  consumoEsperadoLtsHora: number;
  rendimientoLtsHora: number;
  alertaOrdena: boolean;
  desviacionPorcentaje: number;
}

/** Más del 35% de sobreconsumo vs lo esperado se marca como posible ordeña. */
const UMBRAL_ALERTA_PORCENTAJE = 35;
const PRECIO_LITRO_DEFAULT = 23;

const CARGA_INCLUDE = {
  maquinas: { select: { id: true, codigo: true } },
  trabajadores: { select: { nombre: true } },
} as const;

const ENTITY_TYPE = 'cargas_combustible';
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class CombustibleService {
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
      entityType: ENTITY_TYPE,
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
    });
    throw new Excepcion(message);
  }

  async findAll(query: QueryCargaCombustibleDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const where: Prisma.cargas_combustibleWhereInput = {
      eliminado_en: null,
    };

    if (query.soloAlertas === 'true') {
      where.alerta_ordena = true;
    }

    if (query.maquinaId) {
      where.maquinas = { codigo: query.maquinaId };
    }

    if (query.search) {
      where.OR = [
        { lugar: { contains: query.search, mode: 'insensitive' } },
        { maquinas: { codigo: { contains: query.search, mode: 'insensitive' } } },
        { maquinas: { nombre: { contains: query.search, mode: 'insensitive' } } },
        { trabajadores: { nombre: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.cargas_combustible.findMany({
        where,
        include: CARGA_INCLUDE,
        orderBy: [{ fecha: 'desc' }, { creado_en: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.cargas_combustible.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  /**
   * Estadísticas para las tarjetas — requieren ver TODAS las cargas
   * (no solo la página visible), por eso viven en su propio endpoint en
   * vez de derivarse de `findAll` en el frontend.
   */
  async findStats() {
    const [agregados, totalAlertas] = await Promise.all([
      this.prisma.cargas_combustible.aggregate({
        where: { eliminado_en: null },
        _sum: { litros: true, costo: true },
        _avg: { rendimiento_lts_hora: true },
      }),
      this.prisma.cargas_combustible.count({ where: { eliminado_en: null, alerta_ordena: true } }),
    ]);

    return {
      totalLitros: Number(agregados._sum.litros ?? 0),
      totalCosto: Number(agregados._sum.costo ?? 0),
      rendimientoPromedio: Math.round(Number(agregados._avg.rendimiento_lts_hora ?? 0) * 10) / 10,
      totalAlertasOrdena: totalAlertas,
    };
  }

  async findOne(id: string): Promise<CargaCombustibleResponse> {
    const carga = await this.prisma.cargas_combustible.findFirst({
      where: { id, eliminado_en: null },
      include: CARGA_INCLUDE,
    });

    if (!carga) {
      throw new NotFoundException(`Carga de combustible con id "${id}" no encontrada`);
    }

    return this.toResponse(carga);
  }

  async create(dto: CreateCargaCombustibleDto, userId: string): Promise<CargaCombustibleResponse> {
    const maquina = await this.prisma.maquinas.findFirst({
      where: { codigo: dto.maquinaId, eliminado_en: null },
      include: { trabajadores: { select: { nombre: true } } },
    });
    if (!maquina) {
      return this.fallir(
        AuditAction.COMBUSTIBLE_CARGADO,
        null,
        'MAQUINA_NO_ENCONTRADA',
        NotFoundException,
        `No existe la máquina "${dto.maquinaId}"`,
      );
    }

    // Regla de negocio (la misma que ya calculaba el frontend, pero aquí es
    // la fuente de verdad — el cliente no decide su propio rendimiento ni
    // si dispara una alerta de ordeña): litros/hora reales vs lo esperado
    // por el catálogo de la máquina.
    const consumoEsperado = Number(maquina.consumo_esperado_lts_hora);
    const esperado = consumoEsperado > 0 ? consumoEsperado : 14.0;
    const rendimiento = dto.horasTrabajadasPeriodo > 0 ? dto.litros / dto.horasTrabajadasPeriodo : esperado;
    const desviacion = ((rendimiento - esperado) / esperado) * 100;
    const alertaOrdena = desviacion > UMBRAL_ALERTA_PORCENTAJE;

    // OJO: fecha es @db.Date (sin timezone) — mismo cuidado que en
    // checklists.service.ts para no desfasar el día al usar la hora local.
    const ahora = new Date();
    const fecha = dto.fecha ? new Date(dto.fecha) : new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

    const operador = dto.operador?.trim() || maquina.trabajadores?.nombre || 'Sin registrar';
    const costo = dto.costo ?? Number((dto.litros * PRECIO_LITRO_DEFAULT).toFixed(2));

    // Igual que en checklists.service.ts: se vincula al Trabajador real si
    // el nombre coincide exacto; si no existe (catálogo aún no poblado),
    // la carga queda sin operador_id pero conserva el texto capturado.
    const trabajador = await this.prisma.trabajadores.findFirst({
      where: { nombre: operador, eliminado_en: null },
    });

    const creada = await this.prisma.cargas_combustible.create({
      data: {
        id: randomUUID(),
        maquina_id: maquina.id,
        operador_id: trabajador?.id,
        fecha,
        litros: dto.litros,
        costo,
        lugar: dto.lugar,
        horometro_actual: Number(maquina.horometro) + dto.horasTrabajadasPeriodo,
        horas_trabajadas_periodo: dto.horasTrabajadasPeriodo,
        consumo_esperado_lts_hora: esperado,
        rendimiento_lts_hora: Number(rendimiento.toFixed(2)),
        alerta_ordena: alertaOrdena,
        desviacion_porcentaje: Number(desviacion.toFixed(1)),
        creado_por: userId,
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
      include: CARGA_INCLUDE,
    });

    const serialized = { ...this.toResponse(creada), operador };

    await this.auditService.log({
      action: AuditAction.COMBUSTIBLE_CARGADO,
      entityType: ENTITY_TYPE,
      entityId: creada.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: serialized,
    });

    return serialized;
  }

  async update(id: string, dto: UpdateCargaCombustibleDto, userId: string): Promise<CargaCombustibleResponse> {
    const existente = await this.prisma.cargas_combustible.findFirst({
      where: { id, eliminado_en: null },
      include: CARGA_INCLUDE,
    });

    if (!existente) {
      return this.fallir(
        AuditAction.COMBUSTIBLE_ACTUALIZADO,
        id,
        'REGISTRO_NO_ENCONTRADO',
        NotFoundException,
        `Carga de combustible con id "${id}" no encontrada`,
      );
    }

    const maquina = await this.prisma.maquinas.findUnique({ where: { id: existente.maquina_id } });

    // Recalcular rendimiento/desviación/alerta con los valores EFECTIVOS
    // (DTO + existentes) — igual que en create(), el cliente no controla
    // estos campos derivados directamente.
    const litrosEfectivo = dto.litros ?? Number(existente.litros);
    const horasEfectivo = dto.horasTrabajadasPeriodo ?? Number(existente.horas_trabajadas_periodo);
    const consumoEsperado = Number(existente.consumo_esperado_lts_hora);
    const esperado = consumoEsperado > 0 ? consumoEsperado : 14.0;
    const rendimiento = horasEfectivo > 0 ? litrosEfectivo / horasEfectivo : esperado;
    const desviacion = ((rendimiento - esperado) / esperado) * 100;
    const alertaOrdena = desviacion > UMBRAL_ALERTA_PORCENTAJE;

    let operadorId: string | null | undefined;
    let operadorTexto = existente.trabajadores?.nombre ?? undefined;
    if (dto.operador !== undefined) {
      operadorTexto = dto.operador.trim() || undefined;
      const trabajador = operadorTexto
        ? await this.prisma.trabajadores.findFirst({ where: { nombre: operadorTexto, eliminado_en: null } })
        : null;
      operadorId = trabajador?.id ?? null;
    }

    const actualizado = await this.prisma.cargas_combustible.update({
      where: { id },
      data: {
        ...(dto.fecha !== undefined && { fecha: new Date(dto.fecha) }),
        ...(dto.litros !== undefined && { litros: dto.litros }),
        ...(dto.costo !== undefined && { costo: dto.costo }),
        ...(dto.lugar !== undefined && { lugar: dto.lugar }),
        ...(operadorId !== undefined && { operador_id: operadorId }),
        ...(dto.horasTrabajadasPeriodo !== undefined && {
          horas_trabajadas_periodo: dto.horasTrabajadasPeriodo,
          horometro_actual: maquina ? Number(maquina.horometro) + dto.horasTrabajadasPeriodo : existente.horometro_actual,
        }),
        rendimiento_lts_hora: Number(rendimiento.toFixed(2)),
        desviacion_porcentaje: Number(desviacion.toFixed(1)),
        alerta_ordena: alertaOrdena,
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
      include: CARGA_INCLUDE,
    });

    const serialized = {
      ...this.toResponse(actualizado),
      operador: operadorTexto ?? this.toResponse(actualizado).operador,
    };

    await this.auditService.log({
      action: AuditAction.COMBUSTIBLE_ACTUALIZADO,
      entityType: ENTITY_TYPE,
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.toResponse(existente),
      newValue: serialized,
    });

    return serialized;
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const existente = await this.prisma.cargas_combustible.findFirst({
      where: { id, eliminado_en: null },
      include: CARGA_INCLUDE,
    });

    if (!existente) {
      return this.fallir(
        AuditAction.COMBUSTIBLE_ELIMINADO,
        id,
        'REGISTRO_NO_ENCONTRADO',
        NotFoundException,
        `Carga de combustible con id "${id}" no encontrada`,
      );
    }

    await this.prisma.cargas_combustible.update({
      where: { id },
      data: { eliminado_en: new Date(), activo: false },
    });

    await this.auditService.log({
      action: AuditAction.COMBUSTIBLE_ELIMINADO,
      entityType: ENTITY_TYPE,
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.toResponse(existente),
    });

    return { message: 'Carga de combustible eliminada exitosamente' };
  }

  private toResponse(c: {
    id: string;
    maquinas: { id: string; codigo: string | null };
    trabajadores: { nombre: string } | null;
    fecha: Date;
    litros: unknown;
    costo: unknown;
    lugar: string;
    horometro_actual: unknown;
    horas_trabajadas_periodo: unknown;
    consumo_esperado_lts_hora: unknown;
    rendimiento_lts_hora: unknown;
    alerta_ordena: boolean;
    desviacion_porcentaje: unknown;
  }) {
    return {
      id: c.id,
      maquinaId: c.maquinas.codigo ?? c.maquinas.id,
      fecha: c.fecha.toISOString().split('T')[0],
      litros: Number(c.litros),
      costo: Number(c.costo),
      operador: c.trabajadores?.nombre ?? 'Sin registrar',
      lugar: c.lugar,
      horometroActual: Number(c.horometro_actual),
      horasTrabajadasPeriodo: Number(c.horas_trabajadas_periodo),
      consumoEsperadoLtsHora: Number(c.consumo_esperado_lts_hora),
      rendimientoLtsHora: Number(c.rendimiento_lts_hora),
      alertaOrdena: c.alerta_ordena,
      desviacionPorcentaje: Number(c.desviacion_porcentaje),
    };
  }
}
