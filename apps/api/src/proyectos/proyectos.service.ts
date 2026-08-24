import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  Prisma,
  EstadoProyecto,
  AuditAction,
  AuditResult,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProyectoDto } from './dto/create-proyecto.dto';
import { UpdateProyectoDto } from './dto/update-proyecto.dto';
import { QueryProyectosDto } from './dto/query-proyectos.dto';

const PROYECTO_INCLUDE = {
  clientes: { select: { id: true, nombre: true } },
} as const;

@Injectable()
export class ProyectosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ────────────────────────────────────────────
  //  LISTAR (con búsqueda, filtros y paginación)
  // ────────────────────────────────────────────
  async findAll(query: QueryProyectosDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const where: Prisma.proyectosWhereInput = {
      eliminado_en: null,
    };

    if (query.search) {
      where.OR = [
        { nombre: { contains: query.search, mode: 'insensitive' } },
        { clientes: { nombre: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    if (query.estado) {
      where.estado = query.estado;
    }

    if (query.clienteId) {
      where.cliente_id = query.clienteId;
    }

    const [items, total] = await Promise.all([
      this.prisma.proyectos.findMany({
        where,
        include: PROYECTO_INCLUDE,
        orderBy: [{ creado_en: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.proyectos.count({ where }),
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
    const proyecto = await this.prisma.proyectos.findFirst({
      where: { id, eliminado_en: null },
      include: PROYECTO_INCLUDE,
    });

    if (!proyecto) {
      throw new NotFoundException(`Proyecto con id "${id}" no encontrado`);
    }

    return this.serialize(proyecto);
  }

  // ────────────────────────────────────────────
  //  CREAR
  // ────────────────────────────────────────────
  async create(dto: CreateProyectoDto, userId: string) {
    const cliente = await this.prisma.clientes.findFirst({
      where: { id: dto.clienteId, eliminado_en: null },
    });
    if (!cliente) {
      throw new BadRequestException(`Cliente con id "${dto.clienteId}" no encontrado`);
    }

    if (dto.fechaFin < dto.fechaInicio) {
      throw new BadRequestException('La fecha de fin no puede ser anterior a la de inicio');
    }

    const proyecto = await this.prisma.proyectos.create({
      data: {
        id: randomUUID(),
        nombre: dto.nombre.trim(),
        cliente_id: dto.clienteId,
        presupuesto: dto.presupuesto,
        progreso: dto.progreso ?? 0,
        estado: dto.estado ?? EstadoProyecto.EN_PROCESO,
        ingreso_cobrado: dto.ingresoCobrado ?? 0,
        gastado: dto.gastado ?? 0,
        fecha_inicio: new Date(dto.fechaInicio),
        fecha_fin: new Date(dto.fechaFin),
        creado_por: userId,
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
      include: PROYECTO_INCLUDE,
    });

    const serialized = this.serialize(proyecto);

    await this.auditService.log({
      action: AuditAction.PROYECTO_CREADO,
      entityType: 'proyectos',
      entityId: proyecto.id,
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
  async update(id: string, dto: UpdateProyectoDto, userId: string) {
    const existente = await this.prisma.proyectos.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      throw new NotFoundException(`Proyecto con id "${id}" no encontrado`);
    }

    if (dto.clienteId) {
      const cliente = await this.prisma.clientes.findFirst({
        where: { id: dto.clienteId, eliminado_en: null },
      });
      if (!cliente) {
        throw new BadRequestException(`Cliente con id "${dto.clienteId}" no encontrado`);
      }
    }

    const fechaInicio = dto.fechaInicio ?? existente.fecha_inicio.toISOString().split('T')[0];
    const fechaFin = dto.fechaFin ?? existente.fecha_fin.toISOString().split('T')[0];
    if (fechaFin < fechaInicio) {
      throw new BadRequestException('La fecha de fin no puede ser anterior a la de inicio');
    }

    const data: Prisma.proyectosUncheckedUpdateInput = {
      ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
      ...(dto.clienteId !== undefined && { cliente_id: dto.clienteId }),
      ...(dto.presupuesto !== undefined && { presupuesto: dto.presupuesto }),
      ...(dto.progreso !== undefined && { progreso: dto.progreso }),
      ...(dto.estado !== undefined && { estado: dto.estado }),
      ...(dto.ingresoCobrado !== undefined && { ingreso_cobrado: dto.ingresoCobrado }),
      ...(dto.gastado !== undefined && { gastado: dto.gastado }),
      ...(dto.fechaInicio !== undefined && { fecha_inicio: new Date(dto.fechaInicio) }),
      ...(dto.fechaFin !== undefined && { fecha_fin: new Date(dto.fechaFin) }),
      actualizado_por: userId,
    };

    const proyecto = await this.prisma.proyectos.update({
      where: { id },
      data,
      include: PROYECTO_INCLUDE,
    });

    const serialized = this.serialize(proyecto);

    await this.auditService.log({
      action: AuditAction.PROYECTO_ACTUALIZADO,
      entityType: 'proyectos',
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
    const existente = await this.prisma.proyectos.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      throw new NotFoundException(`Proyecto con id "${id}" no encontrado`);
    }

    await this.prisma.proyectos.update({
      where: { id },
      data: { eliminado_en: new Date(), activo: false },
    });

    await this.auditService.log({
      action: AuditAction.PROYECTO_ELIMINADO,
      entityType: 'proyectos',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.serialize(existente as never),
    });

    return { message: 'Proyecto eliminado exitosamente' };
  }

  // ────────────────────────────────────────────
  //  ESTADÍSTICAS
  // ────────────────────────────────────────────
  async findStats() {
    const baseWhere = { eliminado_en: null };

    const [total, enProceso, finalizados, agregados] = await Promise.all([
      this.prisma.proyectos.count({ where: baseWhere }),
      this.prisma.proyectos.count({ where: { ...baseWhere, estado: EstadoProyecto.EN_PROCESO } }),
      this.prisma.proyectos.count({ where: { ...baseWhere, estado: EstadoProyecto.FINALIZADO } }),
      this.prisma.proyectos.aggregate({
        where: baseWhere,
        _sum: { presupuesto: true },
      }),
    ]);

    return {
      total,
      enProceso,
      finalizados,
      presupuestoTotal: Number(agregados._sum.presupuesto ?? 0),
    };
  }

  // ────────────────────────────────────────────
  //  CATÁLOGOS (clientes para selects)
  // ────────────────────────────────────────────
  async findCatalogos() {
    const clientes = await this.prisma.clientes.findMany({
      where: { eliminado_en: null },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });

    return { clientes };
  }

  // ────────────────────────────────────────────
  //  SERIALIZE: mapea Prisma → formato del front
  // ────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serialize(proyecto: any) {
    return {
      id: proyecto.id,
      codigo: proyecto.codigo,
      nombre: proyecto.nombre,
      clienteId: proyecto.cliente_id,
      cliente: proyecto.clientes?.nombre ?? '',
      presupuesto: Number(proyecto.presupuesto),
      progreso: Number(proyecto.progreso),
      estado: this.formatEstado(proyecto.estado as EstadoProyecto),
      fechaInicio:
        proyecto.fecha_inicio instanceof Date
          ? proyecto.fecha_inicio.toISOString().split('T')[0]
          : String(proyecto.fecha_inicio).split('T')[0],
      fechaFin:
        proyecto.fecha_fin instanceof Date
          ? proyecto.fecha_fin.toISOString().split('T')[0]
          : String(proyecto.fecha_fin).split('T')[0],
      ingresoCobrado: Number(proyecto.ingreso_cobrado ?? 0),
      gastado: Number(proyecto.gastado ?? 0),
      activo: proyecto.activo,
      creadoEn: proyecto.creado_en?.toISOString?.() ?? proyecto.creado_en,
      actualizadoEn: proyecto.actualizado_en?.toISOString?.() ?? proyecto.actualizado_en,
    };
  }

  private formatEstado(estado: EstadoProyecto): string {
    const map: Record<EstadoProyecto, string> = {
      [EstadoProyecto.EN_PROCESO]: 'En Proceso',
      [EstadoProyecto.FINALIZADO]: 'Finalizado',
      [EstadoProyecto.PAUSADO]: 'Pausado',
    };
    return map[estado] ?? estado;
  }
}
