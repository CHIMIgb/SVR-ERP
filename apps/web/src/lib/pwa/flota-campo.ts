/**
 * Lógica pura de "Flota y obras" (PWA del Técnico, /m/flota-obras). Sin React ni fetch para poder probarla
 * aparte: etiqueta del estado, búsqueda, agrupado por obra y la liga al mapa del teléfono.
 *
 * La lista viene completa de GET /maquinas/campo y todo se filtra aquí: así la búsqueda es instantánea y
 * sigue funcionando sin señal con la copia guardada.
 */
import type { EstadoMaquinaCampo, FlotaCampoDTO, MaquinaCampoDTO } from '@/lib/api';

export type VarianteEstadoMaquina = 'success' | 'warning' | 'neutral';

/** Texto y color del chip. El estado ya viene clasificado de la API (misma regla del panel del Administrador). */
export const ESTADO_MAQUINA: Record<EstadoMaquinaCampo, { etiqueta: string; variante: VarianteEstadoMaquina }> = {
  operando: { etiqueta: 'Operando', variante: 'success' },
  en_taller: { etiqueta: 'En taller', variante: 'warning' },
  // El diseño solo trae Operando / En taller; "Detenida" es la apagada (decisión 2026-11-24).
  detenida: { etiqueta: 'Detenida', variante: 'neutral' },
};

/**
 * Chip de un estado. Un valor que no conoce el teléfono (copia guardada con otra versión, estado nuevo del
 * servidor) se muestra "Sin estado" en vez de tronar la pantalla o inventar uno (revisión 2026-11-24).
 */
export function estadoUi(estado: string): { etiqueta: string; variante: VarianteEstadoMaquina } {
  return ESTADO_MAQUINA[estado as EstadoMaquinaCampo] ?? { etiqueta: 'Sin estado', variante: 'neutral' };
}

/** Mismo umbral que la API (MINUTOS_SIN_SENAL de gps.service): un ping más viejo deja la máquina sin señal. */
export const MINUTOS_SIN_SENAL = 15;

/**
 * ¿El último ping ya está viejo? Se recalcula con el reloj del teléfono además del flag del servidor: en una
 * copia guardada hace dos días, `sinSenal` venía en false y la tarjeta presumía un GPS reciente que ya no lo
 * es (revisión 2026-11-24).
 */
export function pingSinSenal(posicion: NonNullable<MaquinaCampoDTO['posicion']>, ahora: Date = new Date()): boolean {
  return posicion.sinSenal || (ahora.getTime() - new Date(posicion.fechaHora).getTime()) / 60_000 > MINUTOS_SIN_SENAL;
}

/**
 * La copia de localStorage se acepta solo si tiene la forma que pinta la pantalla. Una copia corrupta o de una
 * versión vieja se ignora (como si no hubiera copia) en vez de dejar la pantalla en blanco al render
 * (revisión 2026-11-24). La clave de la copia además lleva versión (`flota-campo:v1` en la página).
 */
export function esFlotaValida(datos: unknown): datos is FlotaCampoDTO {
  const d = datos as Partial<FlotaCampoDTO> | null;
  if (!d || typeof d.fecha !== 'string' || !Array.isArray(d.maquinas)) return false;
  return d.maquinas.every((m) => {
    const x = m as Partial<MaquinaCampoDTO> | null;
    return (
      !!x &&
      typeof x.id === 'string' &&
      typeof x.nombre === 'string' &&
      typeof x.estado === 'string' &&
      (x.obraHoy === null || (typeof x.obraHoy === 'object' && typeof x.obraHoy?.nombre === 'string')) &&
      (x.encargado === null || (typeof x.encargado === 'object' && typeof x.encargado?.nombre === 'string')) &&
      (x.posicion === null ||
        (typeof x.posicion === 'object' && typeof x.posicion?.lat === 'number' && typeof x.posicion?.fechaHora === 'string'))
    );
  });
}

export type PestanaFlota = 'maquinaria' | 'obras' | 'taller';

/** Minúsculas y sin acentos, para que "camion" encuentre "Camión" y "perez" a "Pérez". */
export function normalizar(texto: string): string {
  // Marcas diacríticas que deja NFD (acentos, diéresis) por su propiedad Unicode "M". Antes el rango iba con los
  // caracteres combinantes escritos tal cual (invisibles en el editor): un reformateo lo rompía sin aviso
  // (revisión 2026-11-24). Los espacios repetidos cuentan como uno ("criba  1" encuentra "Criba 1").
  return texto.normalize('NFD').replace(/\p{M}/gu, '').replace(/\s+/g, ' ').toLowerCase().trim();
}

/**
 * Búsqueda "Máquina, obra o encargado": nombre o código de la máquina, su tipo, la obra de hoy (nombre y
 * ubicación) y el operador o chofer. El ingeniero de la obra no se busca porque todavía no existe en los datos
 * (pregunta al cliente).
 */
export function filtrarMaquinas(maquinas: MaquinaCampoDTO[], busqueda: string): MaquinaCampoDTO[] {
  const q = normalizar(busqueda);
  if (!q) return maquinas;
  return maquinas.filter((m) =>
    [m.nombre, m.codigo, m.tipo, m.obraHoy?.nombre, m.obraHoy?.ubicacion, m.encargado?.nombre].some(
      (campo) => campo && normalizar(campo).includes(q),
    ),
  );
}

/** Cuántas máquinas tiene hoy cada obra, SIN la búsqueda: el encabezado de la obra dice su total real. */
export function totalPorObra(maquinas: MaquinaCampoDTO[]): Map<string, number> {
  const total = new Map<string, number>();
  for (const m of maquinas) {
    if (m.obraHoy) total.set(m.obraHoy.proyectoId, (total.get(m.obraHoy.proyectoId) ?? 0) + 1);
  }
  return total;
}

export interface ObraConMaquinas {
  proyectoId: string;
  nombre: string;
  ubicacion: string | null;
  lat: number | null;
  lng: number | null;
  maquinas: MaquinaCampoDTO[];
}

/** Pestaña "Obras": las obras que tienen máquinas hoy, con sus máquinas. Las que no tienen obra hoy no salen. */
export function agruparPorObra(maquinas: MaquinaCampoDTO[]): ObraConMaquinas[] {
  const porObra = new Map<string, ObraConMaquinas>();
  for (const m of maquinas) {
    if (!m.obraHoy) continue;
    const obra = porObra.get(m.obraHoy.proyectoId) ?? { ...m.obraHoy, maquinas: [] };
    obra.maquinas.push(m);
    porObra.set(m.obraHoy.proyectoId, obra);
  }
  return [...porObra.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-MX'));
}

/** Conteos de las pestañas, sobre lo que ya filtró la búsqueda. */
export function contarPestanas(maquinas: MaquinaCampoDTO[]): Record<PestanaFlota, number> {
  return {
    maquinaria: maquinas.length,
    obras: agruparPorObra(maquinas).length,
    taller: maquinas.filter((m) => m.estado === 'en_taller').length,
  };
}

/**
 * Liga que abre el mapa del teléfono en ese punto: la URL universal de Google Maps la mandan a su app Android
 * e iOS. Va en un <a target="_blank">, no en window.open, que en la PWA de iOS se bloquea como popup.
 */
export function urlMapa(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/**
 * "hace 3 min" desde un instante ISO. La resta de instantes no depende de la zona; `haceTiempo` de formatters
 * pide fecha y hora sueltas en la zona del negocio y aquí el ping ya viene como timestamp.
 */
export function haceCuanto(iso: string, ahora: Date = new Date()): string {
  const minutos = Math.floor((ahora.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutos < 1) return 'hace un momento';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return horas === 1 ? 'hace 1 h' : `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? 'ayer' : `hace ${dias} días`;
}
