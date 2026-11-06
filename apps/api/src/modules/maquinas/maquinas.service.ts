import { Injectable, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateMaquinaDto } from './dto/create-maquina.dto';

const ENTITY_TYPE = 'maquinas';
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';
/**
 * Tope de las consultas de la flota. Las máquinas son datos maestros que alimentan los selects de varias vistas
 * (AGENTS.md exenta los catálogos de paginar); el tope evita una consulta sin límite.
 */
export const TOPE_CATALOGO_MAQUINAS = 500;
/** A cuántas horas (o menos) del próximo servicio se marca una máquina como "servicio cerca". */
export const UMBRAL_SERVICIO_HRS = 50;

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
  /**
   * Fecha de `maquinas.proximo_mantenimiento`. Ningún flujo la actualiza (solo trae lo sembrado): el próximo
   * servicio real es por horas, en `proximoServicioHoras` / `horasParaServicio`. Se deja por compatibilidad.
   */
  proximoMantenimiento: string;
  /** Horómetro al que toca el próximo servicio (del último registro de Mantenimiento). */
  proximoServicioHoras?: number;
  /** Horas que faltan para ese servicio; negativo = ya se pasó. */
  horasParaServicio?: number;
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
    metadata?: Record<string, unknown>,
  ): Promise<never> {
    await this.auditService.log({
      action: AuditAction.MAQUINA_CREADA,
      entityType: ENTITY_TYPE,
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
      metadata: metadata ?? null,
    });
    throw new Excepcion(message);
  }

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
        take: TOPE_CATALOGO_MAQUINAS,
      }),
      this.prisma.checklists_preoperacionales.findMany({
        where: { eliminado_en: null, fecha: { gte: hoy, lt: mañana } },
        include: { trabajadores: { select: { nombre: true } } },
        orderBy: { creado_en: 'desc' },
        take: TOPE_CATALOGO_MAQUINAS,
      }),
    ]);

    const proximoServicio = await this.proximoServicioPorMaquina(maquinas.map((m) => m.id));

    // El mas reciente por maquina (findMany ya viene ordenado desc).
    const checklistPorMaquina = new Map<string, (typeof checklistsHoy)[number]>();
    for (const c of checklistsHoy) {
      if (!checklistPorMaquina.has(c.maquina_id)) {
        checklistPorMaquina.set(c.maquina_id, c);
      }
    }

    return maquinas.map((m) => {
      const checklist = checklistPorMaquina.get(m.id);
      const proximo = proximoServicio.get(m.id);

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
        proximoServicioHoras: proximo,
        horasParaServicio: proximo === undefined ? undefined : Math.round((proximo - Number(m.horometro)) * 100) / 100,
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

  async create(dto: CreateMaquinaDto, userId: string): Promise<MaquinaResponse> {
    // El código se guarda en mayúsculas: se compara igual, si no "m005" pasaba la revisión y chocaba con "M005"
    // en la base (error 500 en vez de este aviso).
    const codigo = dto.id.trim().toUpperCase();
    const duplicada = () =>
      this.fallir(null, 'MAQUINA_DUPLICADA', ConflictException, `Ya existe una máquina con el código "${codigo}"`, {
        codigo,
      });
    const existente = await this.prisma.maquinas.findUnique({ where: { codigo } });
    if (existente) return duplicada();

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

    let creada;
    try {
      creada = await this.prisma.maquinas.create({
        data: {
          id: randomUUID(),
          codigo,
          nombre: dto.nombre.trim(),
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
          creado_por: userId,
          actualizado_por: userId,
          actualizado_en: new Date(),
        },
        include: {
          tipos_maquina: { select: { nombre: true } },
          trabajadores: { select: { nombre: true } },
        },
      });
    } catch (error) {
      // Dos altas del mismo código al mismo tiempo: las dos pasan la revisión de arriba y el índice único de
      // `codigo` frena a la segunda. Se responde el mismo 409 en vez de un 500.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return duplicada();
      throw error;
    }

    const serialized = this.serializarCreada(creada);
    await this.auditService.log({
      action: AuditAction.MAQUINA_CREADA,
      entityType: ENTITY_TYPE,
      entityId: creada.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: serialized,
    });
    return serialized;
  }

  private serializarCreada(
    creada: Prisma.maquinasGetPayload<{
      include: { tipos_maquina: { select: { nombre: true } }; trabajadores: { select: { nombre: true } } };
    }>,
  ) {
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

  /**
   * Horómetro al que toca el próximo servicio de cada máquina: el `proximo_servicio_horas` de su último registro
   * de Mantenimiento. Lo usan Flota, Horómetro y Mantenimiento (una sola regla para las tres vistas).
   * DISTINCT ON da exactamente una fila por máquina.
   */
  async proximoServicioPorMaquina(ids: string[]): Promise<Map<string, number>> {
    if (ids.length === 0) return new Map();
    const filas = await this.prisma.$queryRaw<{ maquina_id: string; proximo_servicio_horas: Prisma.Decimal }[]>`
      SELECT DISTINCT ON (maquina_id) maquina_id, proximo_servicio_horas
      FROM registros_mantenimiento
      WHERE eliminado_en IS NULL AND maquina_id = ANY(${ids}::uuid[])
      ORDER BY maquina_id, fecha DESC, creado_en DESC`;
    return new Map(filas.map((f) => [f.maquina_id, Number(f.proximo_servicio_horas)]));
  }

  /** Mapa interno codigo->id real (UUID), para que otros módulos puedan
   * resolver el FK real a partir del "M001" que usa el frontend. */
  async mapaCodigoAId(): Promise<Map<string, string>> {
    const maquinas = await this.prisma.maquinas.findMany({
      where: { eliminado_en: null, codigo: { not: null } },
      select: { id: true, codigo: true },
      take: TOPE_CATALOGO_MAQUINAS,
    });
    return new Map(maquinas.map((m) => [m.codigo as string, m.id]));
  }
}
