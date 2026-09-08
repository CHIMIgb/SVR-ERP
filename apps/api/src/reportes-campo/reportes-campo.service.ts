import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  Prisma,
  EstadoReporteCampo,
  Prioridad,
  TipoReporteCampo,
  AuditAction,
  AuditResult,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateReporteCampoDto } from './dto/create-reporte-campo.dto';
import { UpdateReporteCampoDto } from './dto/update-reporte-campo.dto';
import { QueryReportesCampoDto } from './dto/query-reportes-campo.dto';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';

const REPORTE_INCLUDE = {
  maquinas: { select: { id: true, codigo: true, nombre: true } },
  obras: { select: { id: true, nombre: true } },
  clientes: { select: { id: true, nombre: true } },
  proyectos: { select: { id: true, nombre: true } },
} as const;

const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

const TIPO_LABELS: Record<TipoReporteCampo, string> = {
  [TipoReporteCampo.MECANICO]: 'Mecanico',
  [TipoReporteCampo.OPERADOR]: 'Operador',
  [TipoReporteCampo.PIPERO]: 'Pipero',
  [TipoReporteCampo.CHECADOR]: 'Checador',
  [TipoReporteCampo.INCIDENTE]: 'Incidente',
  [TipoReporteCampo.INGENIERO]: 'Ingeniero',
  [TipoReporteCampo.TRABAJADOR]: 'Trabajador',
};

const ESTADO_LABELS: Record<EstadoReporteCampo, string> = {
  [EstadoReporteCampo.PENDIENTE]: 'Pendiente',
  [EstadoReporteCampo.VISTO]: 'Visto',
  [EstadoReporteCampo.ATENDIDO]: 'Atendido',
  [EstadoReporteCampo.EN_REVISION]: 'En Revisión',
  [EstadoReporteCampo.RESUELTO]: 'Resuelto',
  [EstadoReporteCampo.FACTURADO]: 'Facturado',
};

const PRIORIDAD_LABELS: Record<Prioridad, string> = {
  [Prioridad.BAJA]: 'Baja',
  [Prioridad.MEDIA]: 'Media',
  [Prioridad.ALTA]: 'Alta',
  [Prioridad.CRITICA]: 'Crítica',
};

/**
 * Flujo de seguimiento permitido — espejo exacto del frontend.
 * RESUELTO es terminal; EN_REVISION solo se alcanza desde VISTO si se
 * habilita en el futuro (hoy ninguna transición lleva a él salvo seed).
 */
const TRANSICIONES: Record<EstadoReporteCampo, EstadoReporteCampo[]> = {
  [EstadoReporteCampo.PENDIENTE]: [EstadoReporteCampo.VISTO],
  [EstadoReporteCampo.VISTO]: [EstadoReporteCampo.ATENDIDO],
  [EstadoReporteCampo.ATENDIDO]: [EstadoReporteCampo.RESUELTO],
  [EstadoReporteCampo.EN_REVISION]: [EstadoReporteCampo.RESUELTO],
  [EstadoReporteCampo.RESUELTO]: [],
  [EstadoReporteCampo.FACTURADO]: [],
};

@Injectable()
export class ReportesCampoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ────────────────────────────────────────────
  //  LISTAR (con búsqueda, filtros y paginación)
  // ────────────────────────────────────────────
  async findAll(query: QueryReportesCampoDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const where: Prisma.reportes_campoWhereInput = {
      eliminado_en: null,
    };

    if (query.search) {
      where.OR = [
        { usuario: { contains: query.search, mode: 'insensitive' } },
        { descripcion: { contains: query.search, mode: 'insensitive' } },
        { obra_texto: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.estado) where.estado = query.estado;
    if (query.tipo) where.tipo = query.tipo;
    if (query.prioridad) where.prioridad = query.prioridad;

    // Banner de críticos: INCIDENTE con prioridad Alta/Crítica sin resolver
    if (query.criticos === 'true') {
      where.tipo = TipoReporteCampo.INCIDENTE;
      where.prioridad = { in: [Prioridad.ALTA, Prioridad.CRITICA] };
      where.estado = { not: EstadoReporteCampo.RESUELTO };
    }

    const [items, total] = await Promise.all([
      this.prisma.reportes_campo.findMany({
        where,
        include: REPORTE_INCLUDE,
        orderBy: [{ fecha: 'desc' }, { hora: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.reportes_campo.count({ where }),
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
    const reporte = await this.prisma.reportes_campo.findFirst({
      where: { id, eliminado_en: null },
      include: REPORTE_INCLUDE,
    });

    if (!reporte) {
      throw new NotFoundException(`Reporte de campo con id "${id}" no encontrado`);
    }

    return this.serialize(reporte);
  }

  // ────────────────────────────────────────────
  //  CREAR
  // ────────────────────────────────────────────
  async create(dto: CreateReporteCampoDto, userId: string) {
    if (dto.maquinaId) {
      await this.resolverMaquina(dto.maquinaId, AuditAction.REPORTE_CREADO, null);
    }
    if (dto.obraId) {
      await this.resolverObra(dto.obraId, AuditAction.REPORTE_CREADO, null);
    }

    const reporte = await this.prisma.reportes_campo.create({
      data: {
        id: randomUUID(),
        tipo: dto.tipo,
        usuario: dto.usuario.trim(),
        usuario_id: userId,
        maquina_id: dto.maquinaId ?? null,
        obra_id: dto.obraId ?? null,
        obra_texto: dto.obraTexto.trim(),
        cliente_id: dto.clienteId ?? null,
        proyecto_id: dto.proyectoId ?? null,
        monto_servicio: dto.montoServicio ?? null,
        fecha: new Date(dto.fecha),
        hora: new Date(`1970-01-01T${dto.hora}:00`),
        descripcion: dto.descripcion.trim(),
        estado: EstadoReporteCampo.PENDIENTE,
        prioridad: dto.prioridad ?? null,
        creado_por: userId,
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
      include: REPORTE_INCLUDE,
    });

    const serialized = this.serialize(reporte);

    await this.auditService.log({
      action: AuditAction.REPORTE_CREADO,
      entityType: 'reportes_campo',
      entityId: reporte.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: serialized,
    });

    return serialized;
  }

  // ────────────────────────────────────────────
  //  ACTUALIZAR — solo permitido mientras PENDIENTE
  // ────────────────────────────────────────────
  async update(id: string, dto: UpdateReporteCampoDto, userId: string) {
    const existente = await this.prisma.reportes_campo.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.REPORTE_ACTUALIZADO,
        id,
        'REPORTE_NO_ENCONTRADO',
        NotFoundException,
        `Reporte de campo con id "${id}" no encontrado`,
      );
    }

    if (existente.estado !== EstadoReporteCampo.PENDIENTE) {
      return this.fallir(
        AuditAction.REPORTE_ACTUALIZADO,
        id,
        'EDITAR_SOLO_PENDIENTES',
        BadRequestException,
        `Solo los reportes Pendientes pueden editarse (estado actual: ${ESTADO_LABELS[existente.estado as EstadoReporteCampo]})`,
      );
    }

    if (dto.maquinaId) {
      await this.resolverMaquina(dto.maquinaId, AuditAction.REPORTE_ACTUALIZADO, id);
    }
    if (dto.obraId) {
      await this.resolverObra(dto.obraId, AuditAction.REPORTE_ACTUALIZADO, id);
    }

    const reporte = await this.prisma.reportes_campo.update({
      where: { id },
      data: {
        ...(dto.tipo !== undefined && { tipo: dto.tipo }),
        ...(dto.usuario !== undefined && { usuario: dto.usuario.trim() }),
        ...(dto.maquinaId !== undefined && { maquina_id: dto.maquinaId ?? null }),
        ...(dto.obraId !== undefined && { obra_id: dto.obraId ?? null }),
        ...(dto.obraTexto !== undefined && { obra_texto: dto.obraTexto.trim() }),
        ...(dto.clienteId !== undefined && { cliente_id: dto.clienteId ?? null }),
        ...(dto.proyectoId !== undefined && { proyecto_id: dto.proyectoId ?? null }),
        ...(dto.montoServicio !== undefined && { monto_servicio: dto.montoServicio ?? null }),
        ...(dto.fecha !== undefined && { fecha: new Date(dto.fecha) }),
        ...(dto.hora !== undefined && { hora: new Date(`1970-01-01T${dto.hora}:00`) }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion.trim() }),
        ...(dto.prioridad !== undefined && { prioridad: dto.prioridad }),
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
      include: REPORTE_INCLUDE,
    });

    const serialized = this.serialize(reporte);

    await this.auditService.log({
      action: AuditAction.REPORTE_ACTUALIZADO,
      entityType: 'reportes_campo',
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
  //  CAMBIAR ESTADO (flujo de seguimiento)
  // ────────────────────────────────────────────
  async cambiarEstado(id: string, dto: CambiarEstadoDto, userId: string) {
    const existente = await this.prisma.reportes_campo.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.ESTATUS_CAMBIADO,
        id,
        'REPORTE_NO_ENCONTRADO',
        NotFoundException,
        `Reporte de campo con id "${id}" no encontrado`,
      );
    }

    const estadoActual = existente.estado as EstadoReporteCampo;
    const permitidos = TRANSICIONES[estadoActual] ?? [];

    if (!permitidos.includes(dto.estado)) {
      const permitidosLabel = permitidos.map((e) => ESTADO_LABELS[e]).join(', ') || 'ninguno (terminal)';
      return this.fallir(
        AuditAction.ESTATUS_CAMBIADO,
        id,
        'TRANSICION_NO_VALIDA',
        BadRequestException,
        `Transición no válida: de ${ESTADO_LABELS[estadoActual]} solo puede avanzar a ${permitidosLabel}`,
      );
    }

    const reporte = await this.prisma.reportes_campo.update({
      where: { id },
      data: {
        estado: dto.estado,
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
      include: REPORTE_INCLUDE,
    });

    const serialized = this.serialize(reporte);

    await this.auditService.log({
      action: AuditAction.ESTATUS_CAMBIADO,
      entityType: 'reportes_campo',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: { estado: ESTADO_LABELS[estadoActual] },
      newValue: { estado: ESTADO_LABELS[dto.estado] },
    });

    return serialized;
  }

  // ────────────────────────────────────────────
  //  ELIMINAR (soft delete)
  // ────────────────────────────────────────────
  async remove(id: string, userId: string) {
    const existente = await this.prisma.reportes_campo.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.REPORTE_ELIMINADO,
        id,
        'REPORTE_NO_ENCONTRADO',
        NotFoundException,
        `Reporte de campo con id "${id}" no encontrado`,
      );
    }

    await this.prisma.reportes_campo.update({
      where: { id },
      data: { eliminado_en: new Date(), activo: false },
    });

    await this.auditService.log({
      action: AuditAction.REPORTE_ELIMINADO,
      entityType: 'reportes_campo',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.serialize(existente as never),
    });

    return { message: 'Reporte eliminado exitosamente' };
  }

  // ────────────────────────────────────────────
  //  FACTURAR (reporte RESUELTO → CxC, O5)
  // ────────────────────────────────────────────
  /**
   * Cierra el reporte de campo facturado y hace nacer la CxC en una sola
   * transacción: estado FACTURADO (guard anti doble clic) + cuenta por cobrar
   * PENDIENTE a 30 días. Emite los audits REPORTE_CAMPO_FACTURADO +
   * CXC_CREADA (SUCCESS). Permiso: operaciones.reportes_campo.editar
   */
  async facturar(id: string, userId: string) {
    const reporte = await this.prisma.reportes_campo.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!reporte) {
      return this.fallir(
        AuditAction.REPORTE_CAMPO_FACTURADO,
        id,
        'REPORTE_NO_ENCONTRADO',
        NotFoundException,
        `Reporte de campo con id "${id}" no encontrado`,
      );
    }

    if (reporte.estado !== EstadoReporteCampo.RESUELTO) {
      return this.fallir(
        AuditAction.REPORTE_CAMPO_FACTURADO,
        id,
        'REPORTE_NO_RESUELTO',
        ConflictException,
        `Solo los reportes Resueltos pueden facturarse (estado actual: ${ESTADO_LABELS[reporte.estado as EstadoReporteCampo]})`,
      );
    }

    if (!reporte.cliente_id || !reporte.monto_servicio) {
      return this.fallir(
        AuditAction.REPORTE_CAMPO_FACTURADO,
        id,
        'DATOS_FACTURACION_INCOMPLETOS',
        ConflictException,
        'El reporte necesita cliente y monto de servicio para facturarse',
      );
    }
    const clienteId = reporte.cliente_id;
    const monto = Number(reporte.monto_servicio);

    const cliente = await this.prisma.clientes.findFirst({
      where: { id: clienteId, activo: true, eliminado_en: null },
      select: { id: true },
    });
    if (!cliente) {
      return this.fallir(
        AuditAction.REPORTE_CAMPO_FACTURADO,
        id,
        'CLIENTE_INACTIVO',
        ConflictException,
        'El cliente del reporte está inactivo',
      );
    }

    const proyectoId = reporte.proyecto_id ?? null;
    const now = new Date();
    const vencimiento = new Date();
    vencimiento.setDate(vencimiento.getDate() + 30);
    const idCxc = randomUUID();

    try {
      await this.prisma.$transaction(async (tx) => {
        // Guard anti doble clic: solo marca FACTURADO la fila que sigue RESUELTO.
        const actualizada = await tx.reportes_campo.updateMany({
          where: { id, estado: EstadoReporteCampo.RESUELTO },
          data: { estado: EstadoReporteCampo.FACTURADO, actualizado_por: userId, actualizado_en: now },
        });
        if (actualizada.count === 0) {
          throw new ConflictException('El reporte ya fue facturado');
        }

        await tx.cuentas_por_cobrar.create({
          data: {
            id: idCxc,
            cliente_id: clienteId,
            proyecto_id: proyectoId,
            monto,
            fecha_vencimiento: vencimiento,
            estado: 'PENDIENTE',
            activo: true,
            actualizado_en: now,
          },
        });
      });
    } catch (e) {
      // Carrera de doble clic: el updateMany no marcó nada → conflicto con audit FAIL.
      if (e instanceof ConflictException) {
        return this.fallir(
          AuditAction.REPORTE_CAMPO_FACTURADO,
          id,
          'REPORTE_YA_FACTURADO',
          ConflictException,
          'El reporte ya fue facturado',
        );
      }
      throw e;
    }

    await this.auditService.log({
      action: AuditAction.REPORTE_CAMPO_FACTURADO,
      entityType: 'reportes_campo',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: { codigo: reporte.codigo, monto, proyectoId, cuentaId: idCxc },
    });

    await this.auditService.log({
      action: AuditAction.CXC_CREADA,
      entityType: 'cuentas_por_cobrar',
      entityId: idCxc,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: {
        reporteId: id,
        codigo: reporte.codigo,
        monto,
        proyectoId,
        vencimiento: vencimiento.toISOString().slice(0, 10),
      },
    });

    return {
      cuenta: {
        id: idCxc,
        reporteId: id,
        codigo: reporte.codigo,
        clienteId: reporte.cliente_id,
        proyectoId,
        monto,
        fechaVencimiento: vencimiento.toISOString().slice(0, 10),
        estado: 'PENDIENTE',
      },
      reporte: { id, codigo: reporte.codigo, estado: 'Facturado' },
    };
  }

  // ────────────────────────────────────────────
  //  ESTADÍSTICAS (alimentan las tarjetas y el banner)
  // ────────────────────────────────────────────
  async findStats() {
    const baseWhere = { eliminado_en: null };

    const [pendientes, enRevision, atendidos, resueltos, criticosActivos] =
      await Promise.all([
        this.prisma.reportes_campo.count({
          where: { ...baseWhere, estado: EstadoReporteCampo.PENDIENTE },
        }),
        this.prisma.reportes_campo.count({
          where: { ...baseWhere, estado: EstadoReporteCampo.EN_REVISION },
        }),
        this.prisma.reportes_campo.count({
          where: { ...baseWhere, estado: EstadoReporteCampo.ATENDIDO },
        }),
        this.prisma.reportes_campo.count({
          where: { ...baseWhere, estado: EstadoReporteCampo.RESUELTO },
        }),
        this.prisma.reportes_campo.count({
          where: {
            ...baseWhere,
            tipo: TipoReporteCampo.INCIDENTE,
            prioridad: { in: [Prioridad.ALTA, Prioridad.CRITICA] },
            estado: { not: EstadoReporteCampo.RESUELTO },
          },
        }),
      ]);

    return { pendientes, enRevision, atendidos, resueltos, criticosActivos };
  }

  // ────────────────────────────────────────────
  //  PRIVADOS
  // ────────────────────────────────────────────

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
      entityType: 'reportes_campo',
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
    });
    throw new Excepcion(message);
  }

  private async resolverMaquina(
    maquinaId: string,
    action: AuditAction,
    entityId: string | null,
  ): Promise<string> {
    const maquina = await this.prisma.maquinas.findFirst({
      where: { id: maquinaId, eliminado_en: null },
      select: { id: true },
    });
    if (!maquina) {
      return this.fallir(
        action,
        entityId,
        'MAQUINA_NO_ENCONTRADA',
        BadRequestException,
        `Máquina con id "${maquinaId}" no encontrada`,
      );
    }
    return maquina.id;
  }

  private async resolverObra(
    obraId: string,
    action: AuditAction,
    entityId: string | null,
  ): Promise<string> {
    const obra = await this.prisma.obras.findFirst({
      where: { id: obraId, eliminado_en: null },
      select: { id: true },
    });
    if (!obra) {
      return this.fallir(
        action,
        entityId,
        'OBRA_NO_ENCONTRADA',
        BadRequestException,
        `Obra con id "${obraId}" no encontrada`,
      );
    }
    return obra.id;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serialize(reporte: any) {
    return {
      id: reporte.id,
      codigo: reporte.codigo,
      tipo: TIPO_LABELS[reporte.tipo as TipoReporteCampo] ?? reporte.tipo,
      usuario: reporte.usuario,
      usuarioId: reporte.usuario_id,
      maquinaId: reporte.maquina_id,
      maquinaCodigo: reporte.maquinas?.codigo ?? null,
      maquinaNombre: reporte.maquinas?.nombre ?? null,
      obraId: reporte.obra_id,
      obra: reporte.obra_texto,
      clienteId: reporte.cliente_id,
      cliente: reporte.clientes?.nombre ?? null,
      proyectoId: reporte.proyecto_id,
      proyecto: reporte.proyectos?.nombre ?? null,
      montoServicio: reporte.monto_servicio != null ? Number(reporte.monto_servicio) : null,
      fecha:
        reporte.fecha instanceof Date
          ? reporte.fecha.toISOString().split('T')[0]
          : String(reporte.fecha).split('T')[0],
      hora:
        reporte.hora instanceof Date
          ? reporte.hora.toTimeString().slice(0, 5)
          : String(reporte.hora).slice(0, 5),
      descripcion: reporte.descripcion,
      estado: ESTADO_LABELS[reporte.estado as EstadoReporteCampo] ?? reporte.estado,
      prioridad:
        reporte.prioridad != null
          ? PRIORIDAD_LABELS[reporte.prioridad as Prioridad]
          : null,
      detalles: reporte.detalles,
      activo: reporte.activo,
      creadoEn: reporte.creado_en?.toISOString?.() ?? reporte.creado_en,
      actualizadoEn: reporte.actualizado_en?.toISOString?.() ?? reporte.actualizado_en,
    };
  }
}
