import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateDespachoDto } from './dto/create-despacho.dto';
import { QueryDespachoDto } from './dto/query-despacho.dto';

/** Shape esperado por el frontend (packages/shared/types/maquinaria.ts). */
export interface DespachoResponse {
  id: string;
  maquinaId: string;
  proyectoId: string;
  fechaInicio: string;
  fechaFin: string;
}

const ENTITY_TYPE = 'despachos_maquina';
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

const DESPACHO_INCLUDE = {
  maquinas: { select: { id: true, codigo: true } },
  proyectos: { select: { id: true, codigo: true } },
} as const;

type DespachoConRelaciones = Prisma.despachos_maquinaGetPayload<{ include: typeof DESPACHO_INCLUDE }>;

const soloFecha = (d: Date) => d.toISOString().split('T')[0];

@Injectable()
export class DespachosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /** Audita un fallo de negocio y lanza la excepción (el actor sale del JWT en el contexto de request). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async fallir<A extends new (message: string) => any>(
    entityId: string | null,
    errorCode: string,
    Excepcion: A,
    message: string,
    metadata: Record<string, unknown>,
  ): Promise<never> {
    await this.auditService.log({
      action: AuditAction.DESPACHO_CREADO,
      entityType: ENTITY_TYPE,
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
      metadata,
    });
    throw new Excepcion(message);
  }

  async findAll(query: QueryDespachoDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const where: Prisma.despachos_maquinaWhereInput = { eliminado_en: null };
    if (query.maquinaId) where.maquinas = { codigo: query.maquinaId.trim() };
    // Ventana de fechas: los despachos que se enciman con [desde, hasta].
    if (query.hasta) where.fecha_inicio = { lte: new Date(query.hasta.slice(0, 10)) };
    if (query.desde) where.fecha_fin = { gte: new Date(query.desde.slice(0, 10)) };

    const [items, total] = await Promise.all([
      this.prisma.despachos_maquina.findMany({
        where,
        include: DESPACHO_INCLUDE,
        // Programados y en curso arriba; los terminados más recientes después.
        orderBy: [{ fecha_inicio: 'desc' }, { creado_en: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.despachos_maquina.count({ where }),
    ]);

    return {
      items: items.map((d) => this.toResponse(d)),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async create(dto: CreateDespachoDto, userId: string): Promise<DespachoResponse> {
    const contexto = { maquinaId: dto.maquinaId, proyectoId: dto.proyectoId, fechaInicio: dto.fechaInicio, fechaFin: dto.fechaFin };
    const inicio = new Date(dto.fechaInicio.slice(0, 10));
    const fin = new Date(dto.fechaFin.slice(0, 10));

    if (inicio > fin) {
      return this.fallir(null, 'FECHAS_INVALIDAS', BadRequestException, 'La fecha de inicio no puede ser posterior a la fecha de fin', contexto);
    }

    const [maquina, proyecto] = await Promise.all([
      this.prisma.maquinas.findFirst({ where: { codigo: dto.maquinaId, eliminado_en: null }, select: { id: true } }),
      this.prisma.proyectos.findFirst({ where: { codigo: dto.proyectoId, eliminado_en: null }, select: { id: true } }),
    ]);
    if (!maquina) {
      return this.fallir(null, 'MAQUINA_NO_ENCONTRADA', NotFoundException, `No existe la máquina "${dto.maquinaId}"`, contexto);
    }
    if (!proyecto) {
      return this.fallir(null, 'PROYECTO_NO_ENCONTRADO', NotFoundException, `No existe el proyecto "${dto.proyectoId}"`, contexto);
    }

    const creado = await this.prisma.$transaction(async (tx) => {
      // Candado sobre la máquina: dos despachos de la misma máquina al mismo tiempo se revisan uno después del
      // otro, así el segundo ve el traslape del primero (antes los dos pasaban la revisión).
      await tx.$queryRaw`SELECT id FROM maquinas WHERE id = ${maquina.id}::uuid FOR UPDATE`;

      // Regla de negocio: una máquina no puede tener dos despachos con rangos de fecha traslapados.
      const traslape = await tx.despachos_maquina.findFirst({
        where: { maquina_id: maquina.id, eliminado_en: null, fecha_inicio: { lte: fin }, fecha_fin: { gte: inicio } },
        include: { proyectos: { select: { nombre: true } } },
      });
      if (traslape) {
        return this.fallir(
          traslape.id,
          'DESPACHO_TRASLAPADO',
          ConflictException,
          `La máquina ya está asignada a "${traslape.proyectos.nombre}" del ${soloFecha(traslape.fecha_inicio)} al ${soloFecha(traslape.fecha_fin)}`,
          contexto,
        );
      }

      return tx.despachos_maquina.create({
        data: {
          id: randomUUID(),
          maquina_id: maquina.id,
          proyecto_id: proyecto.id,
          fecha_inicio: inicio,
          fecha_fin: fin,
          creado_por: userId,
          actualizado_por: userId,
          actualizado_en: new Date(),
        },
        include: DESPACHO_INCLUDE,
      });
    });

    const serialized = this.toResponse(creado);
    await this.auditService.log({
      action: AuditAction.DESPACHO_CREADO,
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

  private toResponse(d: DespachoConRelaciones) {
    return {
      id: d.codigo ?? d.id,
      maquinaId: d.maquinas.codigo ?? d.maquinas.id,
      proyectoId: d.proyectos.codigo ?? d.proyectos.id,
      fechaInicio: soloFecha(d.fecha_inicio),
      fechaFin: soloFecha(d.fecha_fin),
    };
  }
}
