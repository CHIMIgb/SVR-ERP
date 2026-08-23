import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MaquinasService } from '../maquinas/maquinas.service';
import { CreateLecturaHorometroDto } from './dto/create-lectura-horometro.dto';

/** Shape esperado por el frontend (packages/shared/types/operaciones.ts). */
export interface LecturaHorometroResponse {
  id: string;
  maquinaId: string;
  fecha: string;
  lecturaInicial: number;
  lecturaFinal: number;
  horasTrabajadas: number;
}

@Injectable()
export class HorometroService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly maquinasService: MaquinasService,
  ) {}

  async findAll(): Promise<LecturaHorometroResponse[]> {
    const lecturas = await this.prisma.lecturas_horometro.findMany({
      where: { eliminado_en: null },
      include: { maquinas: { select: { id: true, codigo: true } } },
      orderBy: { fecha: 'desc' },
    });

    return lecturas.map((l) => ({
      id: l.codigo ?? l.id,
      maquinaId: l.maquinas.codigo ?? l.maquinas.id,
      fecha: l.fecha.toISOString().split('T')[0],
      lecturaInicial: Number(l.lectura_inicial),
      lecturaFinal: Number(l.lectura_final),
      horasTrabajadas: Number(l.horas_trabajadas),
    }));
  }

  async create(dto: CreateLecturaHorometroDto): Promise<LecturaHorometroResponse> {
    if (dto.lecturaFinal < dto.lecturaInicial) {
      throw new BadRequestException('La lectura final no puede ser menor a la lectura inicial');
    }

    const mapa = await this.maquinasService.mapaCodigoAId();
    const maquinaUuid = mapa.get(dto.maquinaId);
    if (!maquinaUuid) {
      throw new NotFoundException(`No existe la máquina "${dto.maquinaId}"`);
    }

    const horasTrabajadas = Number((dto.lecturaFinal - dto.lecturaInicial).toFixed(2));

    const creada = await this.prisma.lecturas_horometro.create({
      data: {
        id: randomUUID(),
        maquina_id: maquinaUuid,
        fecha: new Date(dto.fecha),
        lectura_inicial: dto.lecturaInicial,
        lectura_final: dto.lecturaFinal,
        horas_trabajadas: horasTrabajadas,
        actualizado_en: new Date(),
      },
      include: { maquinas: { select: { id: true, codigo: true } } },
    });

    return {
      id: creada.codigo ?? creada.id,
      maquinaId: creada.maquinas.codigo ?? creada.maquinas.id,
      fecha: creada.fecha.toISOString().split('T')[0],
      lecturaInicial: Number(creada.lectura_inicial),
      lecturaFinal: Number(creada.lectura_final),
      horasTrabajadas: Number(creada.horas_trabajadas),
    };
  }
}
