import { Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMaquinaDto } from './dto/create-maquina.dto';

/** Shape esperado por el frontend (packages/shared/types/maquinaria.ts). */
export interface MaquinaResponse {
  id: string;
  nombre: string;
  tipo: string;
  estado: 'Encendida' | 'Apagada' | 'Mantenimiento' | 'Movimiento';
  combustible: number;
  horometro: number;
  operador: string;
  lat: number;
  lng: number;
  dieselHoy: number;
  proximoMantenimiento: string;
  imagen?: string;
  consumoEsperadoLtsHora?: number;
  rendimientoActualLtsHora?: number;
  alertaConsumoAnormal?: boolean;
  horasOperadasHoy?: number;
  checklistHoy?: {
    id: string;
    estado: 'Aprobado' | 'Con Falla';
    hora: string;
    operador: string;
    observaciones?: string;
  };
}

const ESTADO_DB_A_UI: Record<string, MaquinaResponse['estado']> = {
  ENCENDIDA: 'Encendida',
  APAGADA: 'Apagada',
  MANTENIMIENTO: 'Mantenimiento',
  MOVIMIENTO: 'Movimiento',
};

const ESTADO_CHECKLIST_DB_A_UI: Record<string, 'Aprobado' | 'Con Falla'> = {
  APROBADO: 'Aprobado',
  CON_FALLA: 'Con Falla',
};

// El formulario de alta trae "Excavación" / "Grúa" / "Transporte" / "Criba"
// (categorias amplias de la UI), no el nombre exacto del catalogo real de
// tipos_maquina (que tiene nombres especificos como "Excavadora"). Se
// mapea a un tipo existente cuando aplica; si no hay match se crea el
// tipo nuevo en el catalogo (es administrable, no es un ENUM cerrado).
const TIPO_UI_A_CATALOGO: Record<string, string> = {
  Excavación: 'Excavadora',
  Grúa: 'Grúa',
  Transporte: 'Transporte',
  Criba: 'Criba',
};

@Injectable()
export class MaquinasService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista de solo lectura, usada por las vistas que necesitan resolver
   * nombre/operador/horómetro de una máquina (Horómetro, Mantenimiento,
   * Combustible, GPS) además de la propia vista de Flota. El CRUD
   * completo de creación vive aquí; edición/baja de maquinaria quedan
   * fuera de alcance porque la UI actual no tiene esos controles.
   */
  async findAll(): Promise<MaquinaResponse[]> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    const [maquinas, checklistsHoy] = await Promise.all([
      this.prisma.maquinas.findMany({
        where: { eliminado_en: null },
        include: {
          tipos_maquina: { select: { nombre: true } },
          trabajadores: { select: { nombre: true } },
        },
        orderBy: { codigo: 'asc' },
      }),
      this.prisma.checklists_preoperacionales.findMany({
        where: { eliminado_en: null, fecha: { gte: hoy, lt: mañana } },
        include: { trabajadores: { select: { nombre: true } } },
        orderBy: { creado_en: 'desc' },
      }),
    ]);

    // El mas reciente por maquina (findMany ya viene ordenado desc).
    const checklistPorMaquina = new Map<string, (typeof checklistsHoy)[number]>();
    for (const c of checklistsHoy) {
      if (!checklistPorMaquina.has(c.maquina_id)) {
        checklistPorMaquina.set(c.maquina_id, c);
      }
    }

    return maquinas.map((m) => {
      const checklist = checklistPorMaquina.get(m.id);

      return {
        id: m.codigo ?? m.id,
        nombre: m.nombre,
        tipo: m.tipos_maquina.nombre,
        estado: ESTADO_DB_A_UI[m.estado] ?? 'Apagada',
        combustible: Number(m.combustible),
        horometro: Number(m.horometro),
        operador: m.trabajadores?.nombre ?? 'Sin asignar',
        lat: Number(m.lat),
        lng: Number(m.lng),
        dieselHoy: Number(m.diesel_hoy),
        proximoMantenimiento: m.proximo_mantenimiento?.toISOString().split('T')[0] ?? '',
        imagen: m.imagen ?? undefined,
        consumoEsperadoLtsHora: m.consumo_esperado_lts_hora != null ? Number(m.consumo_esperado_lts_hora) : undefined,
        rendimientoActualLtsHora: m.rendimiento_actual_lts_hora != null ? Number(m.rendimiento_actual_lts_hora) : undefined,
        alertaConsumoAnormal: m.alerta_consumo_anormal,
        horasOperadasHoy: m.horas_operadas_hoy != null ? Number(m.horas_operadas_hoy) : undefined,
        checklistHoy: checklist
          ? {
              id: checklist.codigo ?? checklist.id,
              estado: ESTADO_CHECKLIST_DB_A_UI[checklist.estado],
              hora: checklist.hora.toISOString().split('T')[1].slice(0, 5),
              operador: checklist.trabajadores?.nombre ?? '',
              observaciones: checklist.observaciones ?? undefined,
            }
          : undefined,
      };
    });
  }

  async create(dto: CreateMaquinaDto): Promise<MaquinaResponse> {
    const existente = await this.prisma.maquinas.findUnique({ where: { codigo: dto.id } });
    if (existente) {
      throw new BadRequestException(`Ya existe una máquina con el código "${dto.id}"`);
    }

    const nombreTipo = TIPO_UI_A_CATALOGO[dto.tipo] ?? dto.tipo;
    let tipo = await this.prisma.tipos_maquina.findUnique({ where: { nombre: nombreTipo } });
    if (!tipo) {
      tipo = await this.prisma.tipos_maquina.create({
        data: { id: randomUUID(), nombre: nombreTipo, actualizado_en: new Date() },
      });
    }

    // El operador se captura como texto libre en el alta (todavia no hay
    // un catalogo de Trabajadores poblado — esa es otra tarea). Si ya
    // existe un trabajador con ese nombre exacto se vincula; si no, la
    // maquina queda sin operador asignado en vez de fallar.
    let operadorId: string | undefined;
    if (dto.operador?.trim()) {
      const trabajador = await this.prisma.trabajadores.findFirst({
        where: { nombre: dto.operador.trim(), eliminado_en: null },
      });
      operadorId = trabajador?.id;
    }

    const creada = await this.prisma.maquinas.create({
      data: {
        id: randomUUID(),
        codigo: dto.id.toUpperCase(),
        nombre: dto.nombre,
        tipo_id: tipo.id,
        estado: 'APAGADA',
        horometro: dto.horometro ?? 0,
        combustible: dto.combustible ?? 100,
        operador_id: operadorId,
        // Sin geolocalizacion real todavia al dar de alta: se usa el
        // centro de operaciones por defecto (CDMX) hasta que se asigne
        // un dispositivo GPS real (ver tarea de GPS).
        lat: 19.4326,
        lng: -99.1332,
        diesel_hoy: 0,
        consumo_esperado_lts_hora: dto.consumoEsperado ?? 14.0,
        rendimiento_actual_lts_hora: dto.consumoEsperado ?? 14.0,
        alerta_consumo_anormal: false,
        actualizado_en: new Date(),
      },
      include: {
        tipos_maquina: { select: { nombre: true } },
        trabajadores: { select: { nombre: true } },
      },
    });

    return {
      id: creada.codigo ?? creada.id,
      nombre: creada.nombre,
      tipo: creada.tipos_maquina.nombre,
      estado: ESTADO_DB_A_UI[creada.estado] ?? 'Apagada',
      combustible: Number(creada.combustible),
      horometro: Number(creada.horometro),
      operador: creada.trabajadores?.nombre ?? 'Sin asignar',
      lat: Number(creada.lat),
      lng: Number(creada.lng),
      dieselHoy: Number(creada.diesel_hoy),
      proximoMantenimiento: '',
      consumoEsperadoLtsHora: creada.consumo_esperado_lts_hora != null ? Number(creada.consumo_esperado_lts_hora) : undefined,
      rendimientoActualLtsHora: creada.rendimiento_actual_lts_hora != null ? Number(creada.rendimiento_actual_lts_hora) : undefined,
      alertaConsumoAnormal: creada.alerta_consumo_anormal,
    };
  }

  /** Mapa interno codigo->id real (UUID), para que otros módulos puedan
   * resolver el FK real a partir del "M001" que usa el frontend. */
  async mapaCodigoAId(): Promise<Map<string, string>> {
    const maquinas = await this.prisma.maquinas.findMany({
      where: { eliminado_en: null, codigo: { not: null } },
      select: { id: true, codigo: true },
    });
    return new Map(maquinas.map((m) => [m.codigo as string, m.id]));
  }
}
