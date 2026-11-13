import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  Prisma,
  EstadoProyecto,
  EstadoObra,
  AuditAction,
  AuditResult,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProyectoDto } from './dto/create-proyecto.dto';
import { UpdateProyectoDto } from './dto/update-proyecto.dto';
import { QueryProyectosDto } from './dto/query-proyectos.dto';
import { FinanzasProyectoDto } from './dto/finanzas-proyecto.dto';

const PROYECTO_INCLUDE = {
  clientes: { select: { id: true, nombre: true } },
} as const;

@Injectable()
export class ProyectosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Audita un fallo de negocio y lanza ConflictException.
   * Patrón estándar del repo (ver clientes/proveedores): la mutación aborta
   * con audit FAIL + error_code antes de lanzar.
   */
  private async fallir(entityId: string, errorCode: string, message: string): Promise<never> {
    await this.auditService.log({
      action: AuditAction.PROYECTO_ELIMINADO,
      entityType: 'proyectos',
      entityId,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
    });
    throw new ConflictException(message);
  }

  /**
   * La obra es 1:1 con el proyecto: hereda su nombre, su estado y su ubicación.
   * `EstadoObra` no tiene PAUSADA — un proyecto pausado deja la obra EN_PROCESO.
   */
  private estadoObraDe(estado: EstadoProyecto): EstadoObra {
    return estado === EstadoProyecto.FINALIZADO
      ? EstadoObra.FINALIZADA
      : EstadoObra.EN_PROCESO;
  }

  private ubicacionDe(direccion: {
    calle?: string | null;
    colonia?: string | null;
    municipio?: string | null;
    ciudad?: string | null;
    estadoUbicacion?: string | null;
  }): string | null {
    const partes = [
      direccion.calle,
      direccion.colonia,
      direccion.municipio,
      direccion.ciudad,
      direccion.estadoUbicacion,
    ]
      .map((parte) => parte?.trim())
      .filter(Boolean);
    return partes.length > 0 ? partes.join(', ') : null;
  }

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

    const estado = dto.estado ?? EstadoProyecto.EN_PROCESO;

    // El proyecto y su obra nacen juntos o no nace ninguno (índice único 1:1).
    const { proyecto, obraId } = await this.prisma.$transaction(async (tx) => {
      const proyecto = await tx.proyectos.create({
        data: {
          id: randomUUID(),
          nombre: dto.nombre.trim(),
          cliente_id: dto.clienteId,
          presupuesto: dto.presupuesto,
          progreso: dto.progreso ?? 0,
          estado,
          ingreso_cobrado: dto.ingresoCobrado ?? 0,
          gastado: dto.gastado ?? 0,
          fecha_inicio: new Date(dto.fechaInicio),
          fecha_fin: new Date(dto.fechaFin),
          calle: dto.calle?.trim() ?? null,
          colonia: dto.colonia?.trim() ?? null,
          municipio: dto.municipio?.trim() ?? null,
          ciudad: dto.ciudad?.trim() ?? null,
          estado_ubicacion: dto.estadoUbicacion?.trim() ?? null,
          codigo_postal: dto.codigoPostal ?? null,
          creado_por: userId,
          actualizado_por: userId,
          actualizado_en: new Date(),
        },
        include: PROYECTO_INCLUDE,
      });

      const obra = await tx.obras.create({
        data: {
          id: randomUUID(),
          nombre: proyecto.nombre,
          estado: this.estadoObraDe(estado),
          proyecto_id: proyecto.id,
          ubicacion: this.ubicacionDe(dto),
          creado_por: userId,
          actualizado_por: userId,
          actualizado_en: new Date(),
        },
      });

      return { proyecto, obraId: obra.id };
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
      newValue: { ...serialized, obraId },
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
      ...(dto.calle !== undefined && { calle: dto.calle?.trim() ?? null }),
      ...(dto.colonia !== undefined && { colonia: dto.colonia?.trim() ?? null }),
      ...(dto.municipio !== undefined && { municipio: dto.municipio?.trim() ?? null }),
      ...(dto.ciudad !== undefined && { ciudad: dto.ciudad?.trim() ?? null }),
      ...(dto.estadoUbicacion !== undefined && { estado_ubicacion: dto.estadoUbicacion?.trim() ?? null }),
      ...(dto.codigoPostal !== undefined && { codigo_postal: dto.codigoPostal ?? null }),
      actualizado_por: userId,
    };

    const { proyecto, estadoObraPrevio, estadoObra } = await this.prisma.$transaction(
      async (tx) => {
        const obra = await tx.obras.findFirst({
          where: { proyecto_id: id, eliminado_en: null },
        });

        const proyecto = await tx.proyectos.update({
          where: { id },
          data,
          include: PROYECTO_INCLUDE,
        });

        // La obra es el espejo del proyecto: nombre y estado (PAUSADO no existe en EstadoObra).
        const obraData: Prisma.obrasUncheckedUpdateInput = {
          ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
          ...(dto.estado !== undefined &&
            dto.estado !== EstadoProyecto.PAUSADO && {
              estado: this.estadoObraDe(dto.estado),
            }),
        };
        const obraActualizada =
          obra && Object.keys(obraData).length > 0
            ? await tx.obras.update({
                where: { id: obra.id },
                data: {
                  ...obraData,
                  actualizado_por: userId,
                  actualizado_en: new Date(),
                },
              })
            : obra;

        return {
          proyecto,
          estadoObraPrevio: obra?.estado ?? null,
          estadoObra: obraActualizada?.estado ?? null,
        };
      },
    );

    const serialized = this.serialize(proyecto);

    await this.auditService.log({
      action: AuditAction.PROYECTO_ACTUALIZADO,
      entityType: 'proyectos',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: { ...this.serialize(existente as never), estadoObra: estadoObraPrevio },
      newValue: { ...serialized, estadoObra },
    });

    return serialized;
  }

  // ────────────────────────────────────────────
  //  ACTUALIZAR FINANZAS (ingreso cobrado / gasto acumulado)
  // ────────────────────────────────────────────
  async actualizarFinanzas(id: string, dto: FinanzasProyectoDto, userId: string) {
    if (dto.ingresoCobrado === undefined && dto.gastado === undefined) {
      throw new BadRequestException(
        'Debe enviar al menos un campo: ingresoCobrado o gastado',
      );
    }

    const existente = await this.prisma.proyectos.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      throw new NotFoundException(`Proyecto con id "${id}" no encontrado`);
    }

    const proyecto = await this.prisma.proyectos.update({
      where: { id },
      data: {
        ...(dto.ingresoCobrado !== undefined && { ingreso_cobrado: dto.ingresoCobrado }),
        ...(dto.gastado !== undefined && { gastado: dto.gastado }),
        actualizado_por: userId,
      },
      include: PROYECTO_INCLUDE,
    });

    const serialized = this.serialize(proyecto);

    await this.auditService.log({
      action: AuditAction.PROYECTO_FINANZAS_ACTUALIZADO,
      entityType: 'proyectos',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: {
        ingresoCobrado: Number(existente.ingreso_cobrado),
        gastado: Number(existente.gastado),
      },
      newValue: {
        ingresoCobrado: serialized.ingresoCobrado,
        gastado: serialized.gastado,
      },
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

    // No se puede eliminar un proyecto con CxC abiertas: la deuda quedaría
    // huérfana apuntando a un proyecto eliminado. Deben cobrarse/cancelarse
    // primero (CANCELADA/PAGADO no bloquean).
    const cxcAbiertas = await this.prisma.cuentas_por_cobrar.count({
      where: { proyecto_id: id, estado: { notIn: ['CANCELADA', 'PAGADO'] } },
    });
    if (cxcAbiertas > 0) {
      await this.fallir(
        id,
        'PROYECTO_CON_CXC_ABIERTAS',
        `No se puede eliminar el proyecto: tiene ${cxcAbiertas} cuenta(s) por cobrar abiertas. Cobre o cancele antes.`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.proyectos.update({
        where: { id },
        data: { eliminado_en: new Date(), activo: false },
      });
      // La obra 1:1 se va con su proyecto: no quedan obras huérfanas en catálogos.
      await tx.obras.updateMany({
        where: { proyecto_id: id, eliminado_en: null },
        data: {
          eliminado_en: new Date(),
          activo: false,
          actualizado_por: userId,
          actualizado_en: new Date(),
        },
      });
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
      calle: proyecto.calle ?? null,
      colonia: proyecto.colonia ?? null,
      municipio: proyecto.municipio ?? null,
      ciudad: proyecto.ciudad ?? null,
      estadoUbicacion: proyecto.estado_ubicacion ?? null,
      codigoPostal: proyecto.codigo_postal ?? null,
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
