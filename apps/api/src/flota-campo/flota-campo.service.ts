import { Injectable } from '@nestjs/common';
import { EstadoMaquina, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TOPE_CATALOGO_MAQUINAS } from '../modules/maquinas/maquinas.service';
import { MINUTOS_SIN_SENAL } from '../gps/gps.service';
import { hoyEnZona } from '../common/validacion';

/** Cómo ve el técnico a la máquina en la PWA (pestañas Maquinaria / En taller). */
export type EstadoCampo = 'operando' | 'en_taller' | 'detenida';

/**
 * Misma regla que el panel del Administrador en la PWA (PanelEmpresa): "operando" es encendida o en
 * movimiento. Sale de la columna `maquinas.estado`, igual que el escritorio.
 * Tipado con el enum de Prisma (revisión 2026-11-24): si el enum gana un valor, esto deja de compilar en vez
 * de mostrar "Detenida" en silencio. Ojo: ningún flujo actualiza hoy esa columna (es lo sembrado); el PR lo dice.
 */
const ESTADO_CAMPO: Record<EstadoMaquina, EstadoCampo> = {
  ENCENDIDA: 'operando',
  MOVIMIENTO: 'operando',
  MANTENIMIENTO: 'en_taller',
  APAGADA: 'detenida',
};

/**
 * Flota para la PWA del rol Técnico ("Flota y obras"). Solo lectura y sin auditoría de éxito (como los GET
 * "lo mío" de asistencia).
 *
 * Devuelve SOLO lo que muestra la pantalla: máquina, estado, obra de hoy, operador o chofer y última
 * posición GPS. Nada de costos, horómetro, combustible ni mantenimiento: por eso tiene su propio permiso
 * (maquinaria.flota_campo:ver) en vez de abrirle al técnico toda la API de flota (maquinaria.flota:ver).
 *
 * La lista va completa (la flota es chica, tope de catálogo): la búsqueda y las pestañas se hacen en el
 * teléfono, así funcionan también sin señal con la copia guardada.
 */
@Injectable()
export class FlotaCampoService {
  constructor(private readonly prisma: PrismaService) {}

  async findCampo() {
    const fecha = hoyEnZona();
    // fecha_inicio / fecha_fin son @db.Date: se comparan contra la medianoche UTC del día de la empresa
    // (misma convención que la regla de traslape de despachos). No usar new Date() con setHours: es la
    // hora local del servidor y en la tarde-noche de México daría el día siguiente.
    const hoy = new Date(`${fecha}T00:00:00Z`);

    const filas = await this.prisma.maquinas.findMany({
      where: { eliminado_en: null, activo: true },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        estado: true,
        tipos_maquina: { select: { nombre: true } },
        // El operador vigente es maquinas.operador_id: lo mantiene el alta/edición/baja de trabajadores.
        // (maquina_operadores y despachos_maquina.operador_id no los escribe ningún flujo.)
        trabajadores: { select: { nombre: true, puesto: true, eliminado_en: true } },
        despachos_maquina: {
          where: {
            eliminado_en: null,
            activo: true,
            fecha_inicio: { lte: hoy },
            fecha_fin: { gte: hoy },
            proyectos: { eliminado_en: null },
          },
          // El traslape está prohibido al crear; si un dato sembrado se encima, gana el que empieza más tarde y,
          // si empiezan el mismo día, el creado al último (desempate determinista, revisión 2026-11-24).
          orderBy: [{ fecha_inicio: 'desc' }, { creado_en: 'desc' }],
          take: 1,
          select: {
            proyectos: {
              select: {
                id: true,
                nombre: true,
                // Obra 1:1 con el proyecto (migración 20261112030000_obras_1a1).
                obras: {
                  where: { eliminado_en: null },
                  take: 1,
                  select: { id: true, nombre: true, ubicacion: true, lat: true, lng: true },
                },
              },
            },
          },
        },
      },
      orderBy: [{ codigo: 'asc' }, { nombre: 'asc' }],
      take: TOPE_CATALOGO_MAQUINAS + 1,
    });

    const truncado = filas.length > TOPE_CATALOGO_MAQUINAS;
    const maquinas = truncado ? filas.slice(0, TOPE_CATALOGO_MAQUINAS) : filas;
    const posiciones = await this.ultimaPosicionPorMaquina(maquinas.map((m) => m.id));
    const ahora = Date.now();

    return {
      fecha,
      truncado,
      maquinas: maquinas.map((m) => {
        const proyecto = m.despachos_maquina[0]?.proyectos;
        const obra = proyecto?.obras[0];
        const operador = m.trabajadores && !m.trabajadores.eliminado_en ? m.trabajadores : null;
        const ping = posiciones.get(m.id);
        return {
          id: m.id,
          codigo: m.codigo,
          nombre: m.nombre,
          tipo: m.tipos_maquina.nombre,
          estado: ESTADO_CAMPO[m.estado],
          obraHoy: proyecto
            ? {
                proyectoId: proyecto.id,
                // La obra lleva el nombre del sitio; si el proyecto aún no tiene obra, el del proyecto.
                nombre: obra?.nombre ?? proyecto.nombre,
                ubicacion: obra?.ubicacion ?? null,
                lat: obra?.lat != null ? Number(obra.lat) : null,
                lng: obra?.lng != null ? Number(obra.lng) : null,
              }
            : null,
          encargado: operador
            ? {
                nombre: operador.nombre,
                // La etiqueta sale del puesto del trabajador (el formulario solo asigna Operador o Chofer).
                rol: /chofer/i.test(operador.puesto) ? ('Chofer' as const) : ('Operador' as const),
              }
            : null,
          // Sin ping no hay posición: NO se cae a maquinas.lat/lng, que en el alta nace con un punto por
          // defecto que no es una ubicación real (el escritorio sí lo usa para pintar el mapa).
          posicion: ping
            ? {
                lat: Number(ping.lat),
                lng: Number(ping.lng),
                fechaHora: ping.fecha_hora.toISOString(),
                sinSenal: (ahora - ping.fecha_hora.getTime()) / 60000 > MINUTOS_SIN_SENAL,
              }
            : null,
        };
      }),
    };
  }

  /** Último ping de cada máquina en un solo query (DISTINCT ON), igual que el GPS en vivo. */
  private async ultimaPosicionPorMaquina(ids: string[]) {
    if (ids.length === 0) return new Map<string, { fecha_hora: Date; lat: Prisma.Decimal; lng: Prisma.Decimal }>();
    const filas = await this.prisma.$queryRaw<
      Array<{ maquina_id: string; fecha_hora: Date; lat: Prisma.Decimal; lng: Prisma.Decimal }>
    >`
      SELECT DISTINCT ON (maquina_id) maquina_id, fecha_hora, lat, lng
      FROM rastreo_gps
      WHERE maquina_id IN (${Prisma.join(ids)}) AND activo = true
      ORDER BY maquina_id, fecha_hora DESC
    `;
    return new Map(filas.map((f) => [f.maquina_id, f]));
  }
}
