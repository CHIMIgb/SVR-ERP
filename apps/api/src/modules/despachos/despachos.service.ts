import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MaquinasService } from '../maquinas/maquinas.service';
import { CatalogosService } from '../catalogos/catalogos.service';
import { CreateDespachoDto } from './dto/create-despacho.dto';

/** Shape esperado por el frontend (packages/shared/types/maquinaria.ts). */
export interface DespachoResponse {
  id: string;
  maquinaId: string;
  proyectoId: string;
  fechaInicio: string;
  fechaFin: string;
}

@Injectable()
export class DespachosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly maquinasService: MaquinasService,
    private readonly catalogosService: CatalogosService,
  ) {}

  async findAll(): Promise<DespachoResponse[]> {
    const despachos = await this.prisma.despachos_maquina.findMany({
      where: { eliminado_en: null },
      include: {
        maquinas: { select: { id: true, codigo: true } },
        proyectos: { select: { id: true, codigo: true } },
      },
      orderBy: { fecha_inicio: 'asc' },
    });

    return despachos.map((d) => ({
      id: d.codigo ?? d.id,
      maquinaId: d.maquinas.codigo ?? d.maquinas.id,
      proyectoId: d.proyectos.codigo ?? d.proyectos.id,
      fechaInicio: d.fecha_inicio.toISOString().split('T')[0],
      fechaFin: d.fecha_fin.toISOString().split('T')[0],
    }));
  }

  async create(dto: CreateDespachoDto): Promise<DespachoResponse> {
    if (dto.fechaInicio > dto.fechaFin) {
      throw new BadRequestException('La fecha de inicio no puede ser posterior a la fecha de fin');
    }

    const [mapaMaquinas, mapaProyectos] = await Promise.all([
      this.maquinasService.mapaCodigoAId(),
      this.catalogosService.mapaCodigoAId(),
    ]);

    const maquinaUuid = mapaMaquinas.get(dto.maquinaId);
    if (!maquinaUuid) throw new NotFoundException(`No existe la máquina "${dto.maquinaId}"`);

    const proyectoUuid = mapaProyectos.get(dto.proyectoId);
    if (!proyectoUuid) throw new NotFoundException(`No existe el proyecto "${dto.proyectoId}"`);

    // Regla de negocio (la misma que ya valida el frontend, pero aquí es
    // la fuente de verdad — el cliente no es confiable): una máquina no
    // puede tener dos despachos con rangos de fecha traslapados.
    const inicio = new Date(dto.fechaInicio);
    const fin = new Date(dto.fechaFin);
    const traslape = await this.prisma.despachos_maquina.findFirst({
      where: {
        maquina_id: maquinaUuid,
        eliminado_en: null,
        fecha_inicio: { lte: fin },
        fecha_fin: { gte: inicio },
      },
      include: { proyectos: { select: { nombre: true, codigo: true } } },
    });

    if (traslape) {
      throw new ConflictException(
        `La máquina ya está asignada a "${traslape.proyectos.nombre}" del ${traslape.fecha_inicio.toISOString().split('T')[0]} al ${traslape.fecha_fin.toISOString().split('T')[0]}`,
      );
    }

    const creado = await this.prisma.despachos_maquina.create({
      data: {
        id: randomUUID(),
        maquina_id: maquinaUuid,
        proyecto_id: proyectoUuid,
        fecha_inicio: inicio,
        fecha_fin: fin,
        actualizado_en: new Date(),
      },
      include: {
        maquinas: { select: { id: true, codigo: true } },
        proyectos: { select: { id: true, codigo: true } },
      },
    });

    return {
      id: creado.codigo ?? creado.id,
      maquinaId: creado.maquinas.codigo ?? creado.maquinas.id,
      proyectoId: creado.proyectos.codigo ?? creado.proyectos.id,
      fechaInicio: creado.fecha_inicio.toISOString().split('T')[0],
      fechaFin: creado.fecha_fin.toISOString().split('T')[0],
    };
  }
}
