import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  Prisma,
  Prioridad,
  EstadoIncidente,
  AuditAction,
  AuditResult,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateIncidenteDto } from './dto/create-incidente.dto';
import { UpdateIncidenteDto } from './dto/update-incidente.dto';
import { QueryIncidentesDto } from './dto/query-incidentes.dto';

const INCIDENTE_INCLUDE = {
  maquinas: { select: { id: true, nombre: true } },
  obras: { select: { id: true, nombre: true } },
} as const;

@Injectable()
export class IncidentesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ────────────────────────────────────────────
  //  LISTAR (con búsqueda, filtros y paginación)
  // ────────────────────────────────────────────
  async findAll(query: QueryIncidentesDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const where: Prisma.incidentesWhereInput = {
      eliminado_en: null,
      activo: true,
    };

    if (query.search) {
      where.OR = [
        { titulo: { contains: query.search, mode: 'insensitive' } },
        { descripcion: { contains: query.search, mode: 'insensitive' } },
        { obra_texto: { contains: query.search, mode: 'insensitive' } },
        {
          maquinas: {
            nombre: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    if (query.prioridad) {
      where.prioridad = query.prioridad;
    }

    if (query.estado) {
      where.estado = query.estado;
    }

    if (query.maquinaId) {
      where.maquina_id = query.maquinaId;
    }

    if (query.obraId) {
      where.obra_id = query.obraId;
    }

    const [items, total] = await Promise.all([
      this.prisma.incidentes.findMany({
        where,
        include: INCIDENTE_INCLUDE,
        orderBy: [{ fecha: 'desc' }, { creado_en: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.incidentes.count({ where }),
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
    const incidente = await this.prisma.incidentes.findFirst({
      where: { id, eliminado_en: null },
      include: INCIDENTE_INCLUDE,
    });

    if (!incidente) {
      throw new NotFoundException(`Incidente con id "${id}" no encontrado`);
    }

    return this.serialize(incidente);
  }

  // ────────────────────────────────────────────
  //  CREAR
  // ────────────────────────────────────────────
  async create(dto: CreateIncidenteDto, userId: string) {
    const obra = await this.prisma.obras.findFirst({
      where: { id: dto.obraId, eliminado_en: null },
    });
    if (!obra) {
      throw new BadRequestException(`Obra con id "${dto.obraId}" no encontrada`);
    }

    if (dto.maquinaId) {
      const maquina = await this.prisma.maquinas.findFirst({
        where: { id: dto.maquinaId, eliminado_en: null },
      });
      if (!maquina) {
        throw new BadRequestException(
          `Máquina con id "${dto.maquinaId}" no encontrada`,
        );
      }
    }

    const now = new Date();
    const incidente = await this.prisma.incidentes.create({
      data: {
        id: randomUUID(),
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        prioridad: dto.prioridad,
        estado: dto.estado,
        fecha: new Date(dto.fecha),
        maquina_id: dto.maquinaId ?? null,
        obra_id: dto.obraId,
        obra_texto: obra.nombre,
        creado_por: userId,
        actualizado_por: userId,
        actualizado_en: now,
      },
      include: INCIDENTE_INCLUDE,
    });

    const serialized = this.serialize(incidente);

    await this.auditService.log({
      action: AuditAction.INCIDENTE_CREADO,
      entityType: 'incidentes',
      entityId: incidente.id,
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
  async update(id: string, dto: UpdateIncidenteDto, userId: string) {
    const existente = await this.prisma.incidentes.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      throw new NotFoundException(`Incidente con id "${id}" no encontrado`);
    }

    let obraTexto = existente.obra_texto;
    if (dto.obraId) {
      const obra = await this.prisma.obras.findFirst({
        where: { id: dto.obraId, eliminado_en: null },
      });
      if (!obra) {
        throw new BadRequestException(`Obra con id "${dto.obraId}" no encontrada`);
      }
      obraTexto = obra.nombre;
    }

    if (dto.maquinaId) {
      const maquina = await this.prisma.maquinas.findFirst({
        where: { id: dto.maquinaId, eliminado_en: null },
      });
      if (!maquina) {
        throw new BadRequestException(
          `Máquina con id "${dto.maquinaId}" no encontrada`,
        );
      }
    }

    const data: Prisma.incidentesUncheckedUpdateInput = {
      ...(dto.titulo !== undefined && { titulo: dto.titulo }),
      ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
      ...(dto.prioridad !== undefined && { prioridad: dto.prioridad }),
      ...(dto.estado !== undefined && { estado: dto.estado }),
      ...(dto.fecha !== undefined && { fecha: new Date(dto.fecha) }),
      ...(dto.maquinaId !== undefined && { maquina_id: dto.maquinaId ?? null }),
      ...(dto.obraId !== undefined && { obra_id: dto.obraId, obra_texto: obraTexto }),
      actualizado_por: userId,
    };

    const incidente = await this.prisma.incidentes.update({
      where: { id },
      data,
      include: INCIDENTE_INCLUDE,
    });

    const serialized = this.serialize(incidente);

    await this.auditService.log({
      action: AuditAction.INCIDENTE_ACTUALIZADO,
      entityType: 'incidentes',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.serialize(existente),
      newValue: serialized,
    });

    return serialized;
  }

  // ────────────────────────────────────────────
  //  ELIMINAR (soft delete)
  // ────────────────────────────────────────────
  async remove(id: string, userId: string) {
    const existente = await this.prisma.incidentes.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      throw new NotFoundException(`Incidente con id "${id}" no encontrado`);
    }

    await this.prisma.incidentes.update({
      where: { id },
      data: { eliminado_en: new Date(), activo: false },
    });

    await this.auditService.log({
      action: AuditAction.INCIDENTE_ELIMINADO,
      entityType: 'incidentes',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.serialize(existente),
    });

    return { message: 'Incidente eliminado exitosamente' };
  }

  // ────────────────────────────────────────────
  //  ESTADÍSTICAS
  // ────────────────────────────────────────────
  async findStats() {
    const [total, abiertos, criticos] = await Promise.all([
      this.prisma.incidentes.count({ where: { eliminado_en: null, activo: true } }),
      this.prisma.incidentes.count({
        where: {
          eliminado_en: null,
          activo: true,
          estado: { not: 'RESUELTO' },
        },
      }),
      this.prisma.incidentes.count({
        where: {
          eliminado_en: null,
          activo: true,
          prioridad: 'CRITICA',
          estado: { not: 'RESUELTO' },
        },
      }),
    ]);

    return { total, abiertos, criticos };
  }

  // ────────────────────────────────────────────
  //  CATÁLOGOS (máquinas y obras para selects)
  //  - Obras: excluye FINALIZADA
  //  - Máquinas: excluye MANTENIMIENTO y con fallas sin resolver
  // ────────────────────────────────────────────
  async findCatalogos() {
    const todasLasMaquinas = await this.prisma.maquinas.findMany({
      where: {
        activo: true,
        eliminado_en: null,
        estado: { not: 'MANTENIMIENTO' },
      },
      select: {
        id: true,
        nombre: true,
        fallas_mecanicas: {
          where: {
            activo: true,
            eliminado_en: null,
            fecha_resolucion: null,
          },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { nombre: 'asc' },
    });

    const maquinas = todasLasMaquinas
      .filter((m) => m.fallas_mecanicas.length === 0)
      .map(({ fallas_mecanicas: _, ...rest }) => rest);

    const obras = await this.prisma.obras.findMany({
      where: {
        activo: true,
        eliminado_en: null,
        estado: { not: 'FINALIZADA' },
      },
      select: { id: true, nombre: true, estado: true },
      orderBy: { nombre: 'asc' },
    });

    return { maquinas, obras };
  }

  // ────────────────────────────────────────────
  //  SERIALIZE: mapea Prisma → formato del front
  // ────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serialize(incidente: any) {
    return {
      id: incidente.id,
      titulo: incidente.titulo,
      descripcion: incidente.descripcion,
      prioridad: this.formatPrioridad(incidente.prioridad as Prioridad),
      estado: this.formatEstado(incidente.estado as EstadoIncidente),
      fecha:
        incidente.fecha instanceof Date
          ? incidente.fecha.toISOString().split('T')[0]
          : String(incidente.fecha).split('T')[0],
      maquinaId: incidente.maquina_id,
      maquina: incidente.maquinas?.nombre ?? null,
      obraId: incidente.obra_id,
      obra: incidente.obra_texto,
      activo: incidente.activo,
      creadoEn: incidente.creado_en?.toISOString?.() ?? incidente.creado_en,
      actualizadoEn:
        incidente.actualizado_en?.toISOString?.() ?? incidente.actualizado_en,
    };
  }

  private formatPrioridad(prioridad: Prioridad): string {
    const map: Record<Prioridad, string> = {
      [Prioridad.BAJA]: 'Baja',
      [Prioridad.MEDIA]: 'Media',
      [Prioridad.ALTA]: 'Alta',
      [Prioridad.CRITICA]: 'Crítica',
    };
    return map[prioridad] ?? prioridad;
  }

  private formatEstado(estado: EstadoIncidente): string {
    const map: Record<EstadoIncidente, string> = {
      [EstadoIncidente.ABIERTO]: 'Abierto',
      [EstadoIncidente.EN_REVISION]: 'En Revisión',
      [EstadoIncidente.RESUELTO]: 'Resuelto',
    };
    return map[estado] ?? estado;
  }
}
