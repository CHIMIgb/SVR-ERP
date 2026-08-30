import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { MaquinasService } from '../maquinas/maquinas.service';
import { CreateMantenimientoDto } from './dto/create-mantenimiento.dto';
import { UpdateMantenimientoDto } from './dto/update-mantenimiento.dto';
import { QueryMantenimientoDto } from './dto/query-mantenimiento.dto';

/** Shape esperado por el frontend (packages/shared/types/operaciones.ts). */
export interface MantenimientoResponse {
  id: string;
  maquinaId: string;
  tipo: 'Correctivo' | 'Preventivo';
  descripcion: string;
  fecha: string;
  horasServicio: number;
  costo: number;
  proximoServicioHoras: number;
}

const TIPO_UI_A_DB = { Correctivo: 'CORRECTIVO', Preventivo: 'PREVENTIVO' } as const;
const TIPO_DB_A_UI: Record<string, MantenimientoResponse['tipo']> = {
  CORRECTIVO: 'Correctivo',
  PREVENTIVO: 'Preventivo',
};

const REGISTRO_INCLUDE = {
  maquinas: { select: { id: true, codigo: true } },
} as const;

const ENTITY_TYPE = 'registros_mantenimiento';
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class MantenimientoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly maquinasService: MaquinasService,
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

  async findAll(query: QueryMantenimientoDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const where: Prisma.registros_mantenimientoWhereInput = {
      eliminado_en: null,
    };

    if (query.tipo) {
      where.tipo = TIPO_UI_A_DB[query.tipo];
    }

    if (query.maquinaId) {
      const mapa = await this.maquinasService.mapaCodigoAId();
      const maquinaUuid = mapa.get(query.maquinaId);
      where.maquina_id = maquinaUuid ?? '__sin_resultados__';
    }

    if (query.search) {
      where.OR = [
        { descripcion: { contains: query.search, mode: 'insensitive' } },
        { maquinas: { codigo: { contains: query.search, mode: 'insensitive' } } },
        { maquinas: { nombre: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.registros_mantenimiento.findMany({
        where,
        include: REGISTRO_INCLUDE,
        orderBy: [{ fecha: 'desc' }, { creado_en: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.registros_mantenimiento.count({ where }),
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
   * Estadísticas para las tarjetas — requieren ver TODOS los registros
   * (no solo la página visible), por eso viven en su propio endpoint en
   * vez de derivarse de `findAll` en el frontend.
   */
  async findStats() {
    const [registros, totalMaquinas, promedio] = await Promise.all([
      this.prisma.registros_mantenimiento.findMany({
        where: { eliminado_en: null },
        select: { maquina_id: true, fecha: true, proximo_servicio_horas: true },
        orderBy: { fecha: 'desc' },
      }),
      this.prisma.maquinas.count({ where: { eliminado_en: null } }),
      this.prisma.registros_mantenimiento.aggregate({
        where: { eliminado_en: null },
        _avg: { horas_servicio: true },
      }),
    ]);

    // El más reciente por máquina (ya viene ordenado desc por fecha).
    const ultimoPorMaquina = new Map<string, { proximo_servicio_horas: Prisma.Decimal }>();
    for (const r of registros) {
      if (!ultimoPorMaquina.has(r.maquina_id)) {
        ultimoPorMaquina.set(r.maquina_id, { proximo_servicio_horas: r.proximo_servicio_horas });
      }
    }

    const maquinaIds = Array.from(ultimoPorMaquina.keys());
    const maquinas = maquinaIds.length
      ? await this.prisma.maquinas.findMany({
          where: { id: { in: maquinaIds } },
          select: { id: true, horometro: true },
        })
      : [];

    const UMBRAL_PROXIMO_HRS = 50;
    let serviciosProximos = 0;
    for (const m of maquinas) {
      const ultimo = ultimoPorMaquina.get(m.id);
      if (!ultimo) continue;
      if (Number(m.horometro) >= Number(ultimo.proximo_servicio_horas) - UMBRAL_PROXIMO_HRS) {
        serviciosProximos += 1;
      }
    }

    return {
      serviciosProximos,
      promedioHorasServicio: Math.round(Number(promedio._avg.horas_servicio ?? 0)),
      equiposEnOptimoEstado: Math.max(0, totalMaquinas - serviciosProximos),
      totalMaquinas,
    };
  }

  async findOne(id: string): Promise<MantenimientoResponse> {
    const registro = await this.prisma.registros_mantenimiento.findFirst({
      where: { id, eliminado_en: null },
      include: REGISTRO_INCLUDE,
    });

    if (!registro) {
      throw new NotFoundException(`Registro de mantenimiento con id "${id}" no encontrado`);
    }

    return this.toResponse(registro);
  }

  async create(dto: CreateMantenimientoDto, userId: string): Promise<MantenimientoResponse> {
    if (dto.proximoServicioHoras <= dto.horasServicio) {
      return this.fallir(
        AuditAction.MANTENIMIENTO_REGISTRADO,
        null,
        'PROXIMO_SERVICIO_INVALIDO',
        BadRequestException,
        'El horómetro del próximo servicio debe ser mayor a las horas de servicio registradas',
      );
    }

    const mapa = await this.maquinasService.mapaCodigoAId();
    const maquinaUuid = mapa.get(dto.maquinaId);
    if (!maquinaUuid) {
      return this.fallir(
        AuditAction.MANTENIMIENTO_REGISTRADO,
        null,
        'MAQUINA_NO_ENCONTRADA',
        NotFoundException,
        `No existe la máquina "${dto.maquinaId}"`,
      );
    }

    const creado = await this.prisma.registros_mantenimiento.create({
      data: {
        id: randomUUID(),
        maquina_id: maquinaUuid,
        tipo: TIPO_UI_A_DB[dto.tipo],
        descripcion: dto.descripcion,
        fecha: new Date(dto.fecha),
        horas_servicio: dto.horasServicio,
        costo: dto.costo,
        proximo_servicio_horas: dto.proximoServicioHoras,
        creado_por: userId,
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
      include: REGISTRO_INCLUDE,
    });

    const serialized = this.toResponse(creado);

    await this.auditService.log({
      action: AuditAction.MANTENIMIENTO_REGISTRADO,
      entityType: ENTITY_TYPE,
      entityId: creado.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: serialized,
    });

    return serialized;
  }

  async update(id: string, dto: UpdateMantenimientoDto, userId: string): Promise<MantenimientoResponse> {
    const existente = await this.prisma.registros_mantenimiento.findFirst({
      where: { id, eliminado_en: null },
      include: REGISTRO_INCLUDE,
    });

    if (!existente) {
      return this.fallir(
        AuditAction.MANTENIMIENTO_ACTUALIZADO,
        id,
        'REGISTRO_NO_ENCONTRADO',
        NotFoundException,
        `Registro de mantenimiento con id "${id}" no encontrado`,
      );
    }

    const horasServicioEfectivo = dto.horasServicio ?? Number(existente.horas_servicio);
    const proximoServicioEfectivo = dto.proximoServicioHoras ?? Number(existente.proximo_servicio_horas);
    if (proximoServicioEfectivo <= horasServicioEfectivo) {
      return this.fallir(
        AuditAction.MANTENIMIENTO_ACTUALIZADO,
        id,
        'PROXIMO_SERVICIO_INVALIDO',
        BadRequestException,
        'El horómetro del próximo servicio debe ser mayor a las horas de servicio registradas',
      );
    }

    let maquinaUuid: string | undefined;
    if (dto.maquinaId) {
      const mapa = await this.maquinasService.mapaCodigoAId();
      maquinaUuid = mapa.get(dto.maquinaId);
      if (!maquinaUuid) {
        return this.fallir(
          AuditAction.MANTENIMIENTO_ACTUALIZADO,
          id,
          'MAQUINA_NO_ENCONTRADA',
          NotFoundException,
          `No existe la máquina "${dto.maquinaId}"`,
        );
      }
    }

    const actualizado = await this.prisma.registros_mantenimiento.update({
      where: { id },
      data: {
        ...(maquinaUuid && { maquina_id: maquinaUuid }),
        ...(dto.tipo !== undefined && { tipo: TIPO_UI_A_DB[dto.tipo] }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
        ...(dto.fecha !== undefined && { fecha: new Date(dto.fecha) }),
        ...(dto.horasServicio !== undefined && { horas_servicio: dto.horasServicio }),
        ...(dto.costo !== undefined && { costo: dto.costo }),
        ...(dto.proximoServicioHoras !== undefined && { proximo_servicio_horas: dto.proximoServicioHoras }),
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
      include: REGISTRO_INCLUDE,
    });

    const serialized = this.toResponse(actualizado);

    await this.auditService.log({
      action: AuditAction.MANTENIMIENTO_ACTUALIZADO,
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
    const existente = await this.prisma.registros_mantenimiento.findFirst({
      where: { id, eliminado_en: null },
      include: REGISTRO_INCLUDE,
    });

    if (!existente) {
      return this.fallir(
        AuditAction.MANTENIMIENTO_ELIMINADO,
        id,
        'REGISTRO_NO_ENCONTRADO',
        NotFoundException,
        `Registro de mantenimiento con id "${id}" no encontrado`,
      );
    }

    await this.prisma.registros_mantenimiento.update({
      where: { id },
      data: { eliminado_en: new Date(), activo: false },
    });

    await this.auditService.log({
      action: AuditAction.MANTENIMIENTO_ELIMINADO,
      entityType: ENTITY_TYPE,
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.toResponse(existente),
    });

    return { message: 'Registro de mantenimiento eliminado exitosamente' };
  }

  private toResponse(r: {
    id: string;
    maquinas: { id: string; codigo: string | null };
    tipo: string;
    descripcion: string;
    fecha: Date;
    horas_servicio: unknown;
    costo: unknown;
    proximo_servicio_horas: unknown;
  }) {
    return {
      id: r.id,
      maquinaId: r.maquinas.codigo ?? r.maquinas.id,
      tipo: TIPO_DB_A_UI[r.tipo] ?? 'Preventivo',
      descripcion: r.descripcion,
      fecha: r.fecha.toISOString().split('T')[0],
      horasServicio: Number(r.horas_servicio),
      costo: Number(r.costo),
      proximoServicioHoras: Number(r.proximo_servicio_horas),
    };
  }
}
