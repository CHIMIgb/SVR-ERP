import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
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
import { InventarioService } from '../inventario/inventario.service';
import { CreateRegistroCribaDto } from './dto/create-registro-criba.dto';
import { UpdateRegistroCribaDto } from './dto/update-registro-criba.dto';
import { QueryRegistrosCribaDto } from './dto/query-registros-criba.dto';

const REGISTRO_INCLUDE = {
  trabajadores: { select: { id: true, nombre: true } },
  maquinas: { select: { id: true, nombre: true } },
  proyectos: { select: { id: true, nombre: true } },
  materiales_criba: {
    select: { id: true, nombre: true, articulo_id: true },
  },
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
    private readonly inventarioService: InventarioService,
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

    // B7: filtro por material del catálogo de criba.
    if (query.materialId) {
      where.material_criba_id = query.materialId;
    }
    // B6: filtro por máquina (código, patrón despachos) y proyecto (id).
    if (query.maquinaId) {
      where.maquinas = { codigo: query.maquinaId };
    }
    if (query.proyectoId) {
      where.proyecto_id = query.proyectoId;
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

    // B6: máquina y proyecto opcionales (validados; falla audita FAIL).
    const maquinaId = dto.maquinaId
      ? await this.resolverMaquina(dto.maquinaId, AuditAction.REGISTRO_CRIBA_CREADO)
      : null;
    const proyectoId = dto.proyectoId
      ? await this.resolverProyecto(dto.proyectoId, AuditAction.REGISTRO_CRIBA_CREADO)
      : null;

    // B7: material del catálogo de criba (requerido); tipo_material queda como
    // instantánea del nombre del material.
    const material = await this.resolverMaterial(
      dto.materialId,
      AuditAction.REGISTRO_CRIBA_CREADO,
    );

    const registro = await this.prisma.registros_criba.create({
      data: {
        id: randomUUID(),
        fecha: new Date(dto.fecha),
        turno: dto.turno,
        operador_id: operadorId,
        maquina_id: maquinaId,
        proyecto_id: proyectoId,
        material_criba_id: material.id,
        tipo_material: material.nombre,
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

    // B6: máquina/proyecto — undefined no toca; null limpia; valor se valida.
    let maquinaId: string | null | undefined;
    if (dto.maquinaId !== undefined) {
      maquinaId =
        dto.maquinaId === null
          ? null
          : await this.resolverMaquina(dto.maquinaId, AuditAction.REGISTRO_CRIBA_ACTUALIZADO, id);
    }
    let proyectoId: string | null | undefined;
    if (dto.proyectoId !== undefined) {
      proyectoId =
        dto.proyectoId === null
          ? null
          : await this.resolverProyecto(dto.proyectoId, AuditAction.REGISTRO_CRIBA_ACTUALIZADO, id);
    }

    // B7: material del catálogo — undefined no toca; valor se valida.
    let materialCribaId: string | null | undefined;
    let materialNombre: string | undefined;
    if (dto.materialId !== undefined) {
      const material = await this.resolverMaterial(dto.materialId, AuditAction.REGISTRO_CRIBA_ACTUALIZADO, id);
      materialCribaId = material.id;
      materialNombre = material.nombre;
    }

    const registro = await this.prisma.registros_criba.update({
      where: { id },
      data: {
        ...(dto.fecha !== undefined && { fecha: new Date(dto.fecha) }),
        ...(dto.turno !== undefined && { turno: dto.turno }),
        ...(operadorId !== undefined && { operador_id: operadorId }),
        ...(maquinaId !== undefined && { maquina_id: maquinaId }),
        ...(proyectoId !== undefined && { proyecto_id: proyectoId }),
        ...(materialCribaId !== undefined && { material_criba_id: materialCribaId }),
        ...(materialNombre !== undefined && { tipo_material: materialNombre }),
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

  /** B6: valida la máquina por CÓDIGO (patrón despachos: el select del front envía el código). */
  private async resolverMaquina(maquinaId: string, action: AuditAction, entityId?: string): Promise<string> {
    const maquina = await this.prisma.maquinas.findFirst({
      where: { codigo: maquinaId, eliminado_en: null },
      select: { id: true, codigo: true, nombre: true },
    });
    if (!maquina) {
      return this.fallir(
        action,
        entityId ?? null,
        'MAQUINA_NO_ENCONTRADA',
        BadRequestException,
        `Máquina con código "${maquinaId}" no encontrada`,
      );
    }
    return maquina.id;
  }

  /** B6: valida que el proyecto exista y esté EN_PROCESO. */
  private async resolverProyecto(proyectoId: string, action: AuditAction, entityId?: string): Promise<string> {
    const proyecto = await this.prisma.proyectos.findFirst({
      where: { id: proyectoId, eliminado_en: null, estado: 'EN_PROCESO' },
      select: { id: true, nombre: true },
    });
    if (!proyecto) {
      return this.fallir(
        action,
        entityId ?? null,
        'PROYECTO_NO_EN_PROCESO',
        BadRequestException,
        `Proyecto con id "${proyectoId}" no encontrado o no está en proceso`,
      );
    }
    return proyecto.id;
  }

  /** B7: valida el material del catálogo de criba (con su artículo de inventario). */
  private async resolverMaterial(materialId: string, action: AuditAction, entityId?: string) {
    const material = await this.prisma.materiales_criba.findFirst({
      where: { id: materialId },
      select: { id: true, nombre: true, articulo_id: true },
    });
    if (!material) {
      return this.fallir(
        action,
        entityId ?? null,
        'MATERIAL_NO_ENCONTRADO',
        BadRequestException,
        `Material de criba con id "${materialId}" no encontrado`,
      );
    }
    return material;
  }

  /**
   * B7.2: envía la producción del registro AL INVENTARIO en una transacción:
   *  - guard anti-doble-envío (`inventario_en IS NULL` vía updateMany),
   *  - artículo destino vía el catálogo de materiales (exacto),
   *  - `aplicarEntrada` del inventario (stock + movimiento trazable),
   *  - marca `inventario_en` y audita SUCCESS/FAIL.
   */
  async enviarInventario(id: string, userId: string) {
    const existente = await this.prisma.registros_criba.findFirst({
      where: { id, eliminado_en: null },
      include: { materiales_criba: { select: { id: true, nombre: true, articulo_id: true } } },
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

    if (existente.inventario_en) {
      return this.fallir(
        AuditAction.REGISTRO_CRIBA_ACTUALIZADO,
        id,
        'YA_EN_INVENTARIO',
        ConflictException,
        `El registro ${existente.codigo ?? ''} ya fue enviado al inventario`,
      );
    }

    if (!existente.material_criba_id) {
      return this.fallir(
        AuditAction.REGISTRO_CRIBA_ACTUALIZADO,
        id,
        'SIN_MATERIAL_EN_CATALOGO',
        BadRequestException,
        'Este registro no tiene material del catálogo enlazado (registro antiguo)',
      );
    }

    const material = existente.materiales_criba!;
    if (!material.articulo_id) {
      return this.fallir(
        AuditAction.REGISTRO_CRIBA_ACTUALIZADO,
        id,
        'MATERIAL_SIN_ARTICULO',
        BadRequestException,
        `El material "${material.nombre}" no tiene artículo de inventario enlazado`,
      );
    }

    const cantidad = Number(existente.material_al_banco);
    if (!(cantidad > 0)) {
      return this.fallir(
        AuditAction.REGISTRO_CRIBA_ACTUALIZADO,
        id,
        'SIN_MATERIAL_AL_BANCO',
        BadRequestException,
        'El registro no tiene material al banco por enviar (0 m³)',
      );
    }

    // Guard anti-doble-envío: solo gana quien pisa inventario_en null.
    const marcado = await this.prisma.registros_criba.updateMany({
      where: { id, inventario_en: null, eliminado_en: null },
      data: { inventario_en: new Date(), actualizado_por: userId, actualizado_en: new Date() },
    });
    if (marcado.count === 0) {
      return this.fallir(
        AuditAction.REGISTRO_CRIBA_ACTUALIZADO,
        id,
        'YA_EN_INVENTARIO',
        ConflictException,
        'El registro ya fue enviado al inventario',
      );
    }

    const { stockAnterior, stockResultante } = await this.prisma.$transaction(async (tx) =>
      this.inventarioService.aplicarEntrada(tx, {
        articuloId: material.articulo_id!,
        cantidad,
        motivo: 'PRODUCCION_CRIBA',
        referenciaTipo: 'registros_criba',
        referenciaId: id,
        creadoPor: userId,
      }),
    );

    const registro = await this.prisma.registros_criba.findUnique({
      where: { id },
      include: REGISTRO_INCLUDE,
    });

    const serialized = this.serialize(registro!);

    await this.auditService.log({
      action: AuditAction.REGISTRO_CRIBA_ACTUALIZADO,
      entityType: 'registros_criba',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: {
        material: material.nombre,
        articuloId: material.articulo_id,
        cantidad,
        stockAnterior,
        stockResultante,
      },
    });

    return serialized;
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
      materialId: registro.material_criba_id,
      material: registro.materiales_criba?.nombre ?? registro.tipo_material,
      inventarioEn: registro.inventario_en?.toISOString?.() ?? null,
      maquinaId: registro.maquina_id,
      maquina: registro.maquinas?.nombre ?? null,
      proyectoId: registro.proyecto_id,
      proyecto: registro.proyectos?.nombre ?? null,
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
