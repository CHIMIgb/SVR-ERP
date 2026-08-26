import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  Prisma,
  Turno,
  AuditAction,
  AuditResult,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateRegistroCribaDto } from './dto/create-registro-criba.dto';
import { UpdateRegistroCribaDto } from './dto/update-registro-criba.dto';
import { QueryRegistrosCribaDto } from './dto/query-registros-criba.dto';

const REGISTRO_INCLUDE = {
  trabajadores: { select: { id: true, nombre: true } },
} as const;

const TURNO_LABELS: Record<Turno, string> = {
  [Turno.MATUTINO]: 'Matutino',
  [Turno.VESPERTINO]: 'Vespertino',
};

/** Placeholder para auditoría de fallos donde aún no hay entidad conocida. */
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class CribaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Audita un fallo de negocio y lanza la excepción correspondiente.
   * El actorUserId cae automáticamente del JWT en el contexto de request;
   * la metadata mínima (endpoint/método/jwt) la agrega AuditService.
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
      entityType: 'registros_criba',
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
    });
    throw new Excepcion(message);
  }

  // ────────────────────────────────────────────
  //  LISTAR (con búsqueda, filtros y paginación)
  // ────────────────────────────────────────────
  async findAll(query: QueryRegistrosCribaDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const where: Prisma.registros_cribaWhereInput = {
      eliminado_en: null,
    };

    if (query.search) {
      where.OR = [
        { tipo_material: { contains: query.search, mode: 'insensitive' } },
        { observaciones: { contains: query.search, mode: 'insensitive' } },
        { trabajadores: { nombre: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    if (query.turno) {
      where.turno = query.turno;
    }

    if (query.tipoMaterial) {
      where.tipo_material = query.tipoMaterial;
    }

    if (query.fechaDesde || query.fechaHasta) {
      where.fecha = {};
      if (query.fechaDesde) where.fecha.gte = new Date(query.fechaDesde);
      if (query.fechaHasta) where.fecha.lte = new Date(query.fechaHasta);
    }

    const [items, total] = await Promise.all([
      this.prisma.registros_criba.findMany({
        where,
        include: REGISTRO_INCLUDE,
        orderBy: [{ fecha: 'desc' }, { creado_en: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.registros_criba.count({ where }),
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
  //  OBTENER UNO
  // ────────────────────────────────────────────
  async findOne(id: string) {
    const registro = await this.prisma.registros_criba.findFirst({
      where: { id, eliminado_en: null },
      include: REGISTRO_INCLUDE,
    });

    if (!registro) {
      throw new NotFoundException(`Registro de criba con id "${id}" no encontrado`);
    }

    return this.serialize(registro);
  }

  // ────────────────────────────────────────────
  //  CREAR
  // ────────────────────────────────────────────
  async create(dto: CreateRegistroCribaDto, userId: string) {
    await this.validarProduccion(
      dto.materialProducido,
      dto.materialAlBanco,
      AuditAction.REGISTRO_CRIBA_CREADO,
      null,
    );

    let operadorId: string | null = null;
    if (dto.operadorId) {
      operadorId = await this.resolverTrabajador(
        dto.operadorId,
        AuditAction.REGISTRO_CRIBA_CREADO,
      );
    }

    const registro = await this.prisma.registros_criba.create({
      data: {
        id: randomUUID(),
        fecha: new Date(dto.fecha),
        turno: dto.turno,
        operador_id: operadorId,
        tipo_material: dto.tipoMaterial,
        material_producido: dto.materialProducido,
        horas_trabajadas: dto.horasTrabajadas,
        material_al_banco: dto.materialAlBanco,
        observaciones: dto.observaciones?.trim() || null,
        creado_por: userId,
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
      include: REGISTRO_INCLUDE,
    });

    const serialized = this.serialize(registro);

    await this.auditService.log({
      action: AuditAction.REGISTRO_CRIBA_CREADO,
      entityType: 'registros_criba',
      entityId: registro.id,
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
  async update(id: string, dto: UpdateRegistroCribaDto, userId: string) {
    const existente = await this.prisma.registros_criba.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.REGISTRO_CRIBA_ACTUALIZADO,
        id,
        'REGISTRO_NO_ENCONTRADO',
        NotFoundException,
        `Registro de criba con id "${id}" no encontrado`,
      );
    }

    // Validación con los valores EFECTIVOS (DTO + existentes) tras el merge
    const producidoEfectivo = dto.materialProducido ?? Number(existente.material_producido);
    const alBancoEfectivo = dto.materialAlBanco ?? Number(existente.material_al_banco);
    await this.validarProduccion(
      producidoEfectivo,
      alBancoEfectivo,
      AuditAction.REGISTRO_CRIBA_ACTUALIZADO,
      id,
    );

    let operadorId: string | null | undefined;
    if (dto.operadorId !== undefined) {
      operadorId =
        dto.operadorId === null
          ? null
          : await this.resolverTrabajador(dto.operadorId, AuditAction.REGISTRO_CRIBA_ACTUALIZADO, id);
    }

    const registro = await this.prisma.registros_criba.update({
      where: { id },
      data: {
        ...(dto.fecha !== undefined && { fecha: new Date(dto.fecha) }),
        ...(dto.turno !== undefined && { turno: dto.turno }),
        ...(operadorId !== undefined && { operador_id: operadorId }),
        ...(dto.tipoMaterial !== undefined && { tipo_material: dto.tipoMaterial }),
        ...(dto.materialProducido !== undefined && { material_producido: dto.materialProducido }),
        ...(dto.horasTrabajadas !== undefined && { horas_trabajadas: dto.horasTrabajadas }),
        ...(dto.materialAlBanco !== undefined && { material_al_banco: dto.materialAlBanco }),
        ...(dto.observaciones !== undefined && {
          observaciones: dto.observaciones?.trim() || null,
        }),
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
      include: REGISTRO_INCLUDE,
    });

    const serialized = this.serialize(registro);

    await this.auditService.log({
      action: AuditAction.REGISTRO_CRIBA_ACTUALIZADO,
      entityType: 'registros_criba',
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
    const existente = await this.prisma.registros_criba.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.REGISTRO_CRIBA_ELIMINADO,
        id,
        'REGISTRO_NO_ENCONTRADO',
        NotFoundException,
        `Registro de criba con id "${id}" no encontrado`,
      );
    }

    await this.prisma.registros_criba.update({
      where: { id },
      data: { eliminado_en: new Date(), activo: false },
    });

    await this.auditService.log({
      action: AuditAction.REGISTRO_CRIBA_ELIMINADO,
      entityType: 'registros_criba',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.serialize(existente as never),
    });

    return { message: 'Registro de criba eliminado exitosamente' };
  }

  // ────────────────────────────────────────────
  //  ESTADÍSTICAS (alimentan las tarjetas)
  // ────────────────────────────────────────────
  /**
   * Eficiencia = material_al_banco ÷ material_producido × 100
   *   (% del material cribado que llegó al banco).
   * Merma = material_producido − material_al_banco
   *   (material descartado; en % es 100 − eficiencia).
   * Ambas son derivadas — no se almacenan en BD.
   */
  async findStats() {
    const porTipo = await this.prisma.registros_criba.groupBy({
      by: ['tipo_material'],
      where: { eliminado_en: null },
      _sum: {
        material_producido: true,
        material_al_banco: true,
        horas_trabajadas: true,
      },
    });

    let totalProducido = 0;
    let totalAlBanco = 0;
    let totalHoras = 0;

    const porMaterial = porTipo.map((row) => {
      const producido = Number(row._sum.material_producido ?? 0);
      const alBanco = Number(row._sum.material_al_banco ?? 0);
      totalProducido += producido;
      totalAlBanco += alBanco;
      totalHoras += Number(row._sum.horas_trabajadas ?? 0);

      const ef = producido > 0 ? Math.round((alBanco / producido) * 100) : 0;
      return {
        tipo: row.tipo_material,
        producido,
        alBanco,
        merma: producido - alBanco,
        ef,
      };
    });

    porMaterial.sort((a, b) => a.tipo.localeCompare(b.tipo));

    const eficiencia =
      totalProducido > 0 ? Math.round((totalAlBanco / totalProducido) * 100) : 0;

    return {
      totalProducido,
      totalAlBanco,
      totalHoras,
      eficiencia,
      merma: totalProducido - totalAlBanco,
      mermaPorcentaje: 100 - eficiencia,
      porMaterial,
    };
  }

  // ────────────────────────────────────────────
  //  CATÁLOGOS (trabajadores para el select de operador)
  // ────────────────────────────────────────────
  async findCatalogos() {
    const trabajadores = await this.prisma.trabajadores.findMany({
      where: { activo: true, eliminado_en: null },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });

    return { trabajadores };
  }

  // ────────────────────────────────────────────
  //  PRIVADOS
  // ────────────────────────────────────────────

  /** Regla de negocio: lo que llega al banco nunca excede lo producido. Audita el fallo. */
  private async validarProduccion(
    materialProducido: number,
    materialAlBanco: number,
    action: AuditAction,
    entityId: string | null,
  ) {
    if (materialAlBanco > materialProducido) {
      return this.fallir(
        action,
        entityId,
        'AL_BANCO_MAYOR_A_PRODUCIDO',
        BadRequestException,
        'El material al banco no puede ser mayor al material producido',
      );
    }
  }

  /** Valida que el trabajador exista y devuelve su UUID. Audita el fallo. */
  private async resolverTrabajador(
    operadorId: string,
    action: AuditAction,
    entityId?: string,
  ): Promise<string> {
    const trabajador = await this.prisma.trabajadores.findFirst({
      where: { id: operadorId, activo: true, eliminado_en: null },
      select: { id: true },
    });
    if (!trabajador) {
      return this.fallir(
        action,
        entityId ?? null,
        'TRABAJADOR_NO_ENCONTRADO',
        BadRequestException,
        `Trabajador operador con id "${operadorId}" no encontrado`,
      );
    }
    return trabajador.id;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serialize(registro: any) {
    return {
      id: registro.id,
      codigo: registro.codigo,
      fecha:
        registro.fecha instanceof Date
          ? registro.fecha.toISOString().split('T')[0]
          : String(registro.fecha).split('T')[0],
      turno: TURNO_LABELS[registro.turno as Turno] ?? registro.turno,
      operadorId: registro.operador_id,
      operador: registro.trabajadores?.nombre ?? null,
      tipoMaterial: registro.tipo_material,
      materialProducido: Number(registro.material_producido),
      horasTrabajadas: Number(registro.horas_trabajadas),
      materialAlBanco: Number(registro.material_al_banco),
      observaciones: registro.observaciones,
      activo: registro.activo,
      creadoEn: registro.creado_en?.toISOString?.() ?? registro.creado_en,
      actualizadoEn: registro.actualizado_en?.toISOString?.() ?? registro.actualizado_en,
    };
  }
}
