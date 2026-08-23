import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MaquinasService } from '../maquinas/maquinas.service';
import { CreateMantenimientoDto } from './dto/create-mantenimiento.dto';

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

@Injectable()
export class MantenimientoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly maquinasService: MaquinasService,
  ) {}

  async findAll(): Promise<MantenimientoResponse[]> {
    const registros = await this.prisma.registros_mantenimiento.findMany({
      where: { eliminado_en: null },
      include: { maquinas: { select: { id: true, codigo: true } } },
      orderBy: { fecha: 'desc' },
    });

    return registros.map((r) => this.toResponse(r));
  }

  async create(dto: CreateMantenimientoDto): Promise<MantenimientoResponse> {
    if (dto.proximoServicioHoras <= dto.horasServicio) {
      throw new BadRequestException(
        'El horómetro del próximo servicio debe ser mayor a las horas de servicio registradas',
      );
    }

    const mapa = await this.maquinasService.mapaCodigoAId();
    const maquinaUuid = mapa.get(dto.maquinaId);
    if (!maquinaUuid) throw new NotFoundException(`No existe la máquina "${dto.maquinaId}"`);

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
        actualizado_en: new Date(),
      },
      include: { maquinas: { select: { id: true, codigo: true } } },
    });

    return this.toResponse(creado);
  }

  private toResponse(r: {
    id: string;
    codigo: string | null;
    maquinas: { id: string; codigo: string | null };
    tipo: string;
    descripcion: string;
    fecha: Date;
    horas_servicio: unknown;
    costo: unknown;
    proximo_servicio_horas: unknown;
  }): MantenimientoResponse {
    return {
      id: r.codigo ?? r.id,
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
