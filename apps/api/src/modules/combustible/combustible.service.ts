import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCargaCombustibleDto } from './dto/create-carga-combustible.dto';

/** Shape esperado por el frontend (packages/shared/types/operaciones.ts). */
export interface CargaCombustibleResponse {
  id: string;
  maquinaId: string;
  fecha: string;
  litros: number;
  costo: number;
  operador: string;
  lugar: string;
  horometroActual: number;
  horasTrabajadasPeriodo: number;
  consumoEsperadoLtsHora: number;
  rendimientoLtsHora: number;
  alertaOrdena: boolean;
  desviacionPorcentaje: number;
}

/** Más del 35% de sobreconsumo vs lo esperado se marca como posible ordeña. */
const UMBRAL_ALERTA_PORCENTAJE = 35;
const PRECIO_LITRO_DEFAULT = 23;

@Injectable()
export class CombustibleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<CargaCombustibleResponse[]> {
    const cargas = await this.prisma.cargas_combustible.findMany({
      where: { eliminado_en: null },
      include: {
        maquinas: { select: { id: true, codigo: true } },
        trabajadores: { select: { nombre: true } },
      },
      orderBy: { fecha: 'desc' },
    });

    return cargas.map((c) => this.toResponse(c));
  }

  async create(dto: CreateCargaCombustibleDto): Promise<CargaCombustibleResponse> {
    const maquina = await this.prisma.maquinas.findFirst({
      where: { codigo: dto.maquinaId, eliminado_en: null },
      include: { trabajadores: { select: { nombre: true } } },
    });
    if (!maquina) throw new NotFoundException(`No existe la máquina "${dto.maquinaId}"`);

    // Regla de negocio (la misma que ya calculaba el frontend, pero aquí es
    // la fuente de verdad — el cliente no decide su propio rendimiento ni
    // si dispara una alerta de ordeña): litros/hora reales vs lo esperado
    // por el catálogo de la máquina.
    const esperado = maquina.consumo_esperado_lts_hora != null ? Number(maquina.consumo_esperado_lts_hora) : 14.0;
    const rendimiento = dto.horasTrabajadasPeriodo > 0 ? dto.litros / dto.horasTrabajadasPeriodo : esperado;
    const desviacion = ((rendimiento - esperado) / esperado) * 100;
    const alertaOrdena = desviacion > UMBRAL_ALERTA_PORCENTAJE;

    // OJO: fecha es @db.Date (sin timezone) — mismo cuidado que en
    // checklists.service.ts para no desfasar el día al usar la hora local.
    const ahora = new Date();
    const fecha = dto.fecha ? new Date(dto.fecha) : new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

    const operador = dto.operador?.trim() || maquina.trabajadores?.nombre || 'Sin registrar';
    const costo = dto.costo ?? Number((dto.litros * PRECIO_LITRO_DEFAULT).toFixed(2));

    // Igual que en checklists.service.ts: se vincula al Trabajador real si
    // el nombre coincide exacto; si no existe (catálogo aún no poblado),
    // la carga queda sin operador_id pero conserva el texto capturado.
    const trabajador = await this.prisma.trabajadores.findFirst({
      where: { nombre: operador, eliminado_en: null },
    });

    const creada = await this.prisma.cargas_combustible.create({
      data: {
        id: randomUUID(),
        maquina_id: maquina.id,
        operador_id: trabajador?.id,
        fecha,
        litros: dto.litros,
        costo,
        lugar: dto.lugar,
        horometro_actual: Number(maquina.horometro) + dto.horasTrabajadasPeriodo,
        horas_trabajadas_periodo: dto.horasTrabajadasPeriodo,
        consumo_esperado_lts_hora: esperado,
        rendimiento_lts_hora: Number(rendimiento.toFixed(2)),
        alerta_ordena: alertaOrdena,
        desviacion_porcentaje: Number(desviacion.toFixed(1)),
        actualizado_en: new Date(),
      },
      include: {
        maquinas: { select: { id: true, codigo: true } },
        trabajadores: { select: { nombre: true } },
      },
    });

    return { ...this.toResponse(creada), operador };
  }

  private toResponse(c: {
    id: string;
    codigo: string | null;
    maquinas: { id: string; codigo: string | null };
    trabajadores: { nombre: string } | null;
    fecha: Date;
    litros: unknown;
    costo: unknown;
    lugar: string;
    horometro_actual: unknown;
    horas_trabajadas_periodo: unknown;
    consumo_esperado_lts_hora: unknown;
    rendimiento_lts_hora: unknown;
    alerta_ordena: boolean;
    desviacion_porcentaje: unknown;
  }): CargaCombustibleResponse {
    return {
      id: c.codigo ?? c.id,
      maquinaId: c.maquinas.codigo ?? c.maquinas.id,
      fecha: c.fecha.toISOString().split('T')[0],
      litros: Number(c.litros),
      costo: Number(c.costo),
      operador: c.trabajadores?.nombre ?? 'Sin registrar',
      lugar: c.lugar,
      horometroActual: Number(c.horometro_actual),
      horasTrabajadasPeriodo: Number(c.horas_trabajadas_periodo),
      consumoEsperadoLtsHora: Number(c.consumo_esperado_lts_hora),
      rendimientoLtsHora: Number(c.rendimiento_lts_hora),
      alertaOrdena: c.alerta_ordena,
      desviacionPorcentaje: Number(c.desviacion_porcentaje),
    };
  }
}
