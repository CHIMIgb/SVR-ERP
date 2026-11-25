/**
 * Helpers de la asistencia propia en la PWA (/m y /m/asistencia).
 *
 * Todo lo de aquí es AVISO para el trabajador: quien decide si la entrada fue puntual, si estaba en sitio o
 * si queda en omisión es la API al registrar (asistencia.service.ts). Si cambia una regla allá, se cambia aquí.
 */
import { mensajeErrorApi, type DiaAsistenciaSemanaDTO, type RegistroAsistenciaDTO } from '@/lib/api';
import { APP_TIMEZONE, formatHora12 } from '@/lib/formatters';

/** Igual que TOLERANCIA_RETARDO_MINUTOS de la API: pasada esta tolerancia la entrada queda en omisión. */
export const TOLERANCIA_RETARDO_MINUTOS = 15;

/** Texto que la API guarda como dispositivo del marcaje (2 a 100 caracteres). */
export const DISPOSITIVO_PWA = 'PWA móvil';

export interface UbicacionDispositivo {
  lat: number;
  lng: number;
  precisionGpsMetros: number;
}

/**
 * GPS del teléfono. Rechaza con un mensaje para el trabajador (nunca con el error crudo del navegador).
 * El navegador solo da ubicación en contexto seguro (HTTPS o localhost).
 */
export function obtenerUbicacion(): Promise<UbicacionDispositivo> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.isSecureContext) {
      reject(new Error('La ubicación solo funciona con conexión segura (HTTPS). Avisa a la oficina.'));
      return;
    }
    if (!('geolocation' in navigator)) {
      reject(new Error('Este teléfono no permite obtener la ubicación.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          precisionGpsMetros: Math.round(pos.coords.accuracy),
        }),
      (error) => reject(new Error(mensajeErrorGps(error))),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

function mensajeErrorGps(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Diste "no permitir" a la ubicación. Actívala en los permisos del navegador para poder checar.';
    case error.TIMEOUT:
      return 'Tardó mucho en encontrar tu ubicación. Sal a un lugar abierto e intenta de nuevo.';
    case error.POSITION_UNAVAILABLE:
      return 'No se pudo encontrar tu ubicación. Revisa que el GPS esté encendido.';
    default:
      return 'No se pudo obtener la ubicación del teléfono.';
  }
}

/** Distancia en metros (Haversine), la misma fórmula que usa la API. */
export function distanciaMetros(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Hora y minuto de `d` en la zona del negocio. Revisión de chimi (PR #24): la zona sale SOLO de APP_TIMEZONE
 * (NEXT_PUBLIC_TZ del .env), nunca de `getHours()` del teléfono: con el teléfono en otra zona el aviso
 * "llegas tarde" se desviaba de lo que decide la API. Sin NEXT_PUBLIC_TZ, Intl usa la zona del dispositivo.
 */
function horaEnZona(d: Date): { horas: number; minutos: number } {
  const partes = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: APP_TIMEZONE,
  }).formatToParts(d);
  const valor = (tipo: 'hour' | 'minute') => Number(partes.find((p) => p.type === tipo)?.value ?? 0);
  return { horas: valor('hour') % 24, minutos: valor('minute') };
}

/** Minutos tarde respecto a la entrada programada "HH:mm" (negativo = antes), en la zona del negocio. */
export function minutosTarde(entradaProgramada: string | undefined, ahora: Date): number | null {
  if (!entradaProgramada) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(entradaProgramada);
  if (!m) return null;
  const { horas, minutos } = horaEnZona(ahora);
  return horas * 60 + minutos - (Number(m[1]) * 60 + Number(m[2]));
}

/** "domingo, 8 de noviembre" en la zona del negocio (APP_TIMEZONE; nunca una zona fija en el código). */
export function fechaLarga(d: Date): string {
  return d.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: APP_TIMEZONE,
  });
}

/** Hora actual "HH:mm" en la zona del negocio, para mostrarla con formatHora12. */
export function horaActual(d: Date): string {
  const { horas, minutos } = horaEnZona(d);
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

/** Hoy como YYYY-MM-DD en la zona del negocio (mismo patrón que el Dashboard de escritorio). */
export function fechaHoyEnZona(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
}

export type VarianteEstado = 'success' | 'warning' | 'error' | 'info' | 'neutral';

/** Color del estado del registro; mismo criterio que la vista de escritorio, con la omisión en aviso. */
export function varianteEstado(estado: RegistroAsistenciaDTO['estado']): VarianteEstado {
  switch (estado) {
    case 'Puntual':
      return 'success';
    case 'Retardo':
    case 'Salida Anticipada':
    case 'Omisión':
      return 'warning';
    case 'Falta':
    case 'No Presentado':
      return 'error';
    case 'Justificado':
      return 'info';
    default:
      return 'neutral';
  }
}

/**
 * Texto cuando no hay conexión con el servidor. Sirve para los dos casos: el `API_DOWN` del apiClient (refresh
 * sin red) y el `catch` de cada llamada, porque el apiClient LANZA cuando fetch falla (API caída / sin señal).
 */
export const MENSAJE_SIN_CONEXION = 'Sin conexión con el servidor. Revisa tu señal e intenta de nuevo.';

/**
 * Mensaje para el trabajador de un error de la API al checar o al cargar. Revisión de chimi (PR #24): la regla
 * es UN solo helper (mensajeErrorApi, que une los details[] del 422 para decir QUÉ campo falló); aquí solo se
 * agrega el caso sin conexión. No volver a leer `error.message` directo.
 */
export function mensajeDeApi(
  error: { code?: string; message?: string; details?: unknown[] } | undefined,
  porDefecto: string,
): string {
  if (error?.code === 'API_DOWN') return MENSAJE_SIN_CONEXION;
  return mensajeErrorApi(error, porDefecto);
}

/** ¿El usuario ve la asistencia de su equipo? (permiso rrhh.mi_equipo:ver: Residente y Administrador). */
export function puedeVerEquipo(permisos: { modulo: string; recurso: string; accion: string }[] | undefined): boolean {
  return (permisos ?? []).some((p) => p.modulo === 'rrhh' && p.recurso === 'mi_equipo' && p.accion === 'ver');
}

/** Iniciales para el avatar: primera letra de las dos primeras palabras. */
export function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Cómo va cada trabajador del equipo en el día. "presente" y "tarde" ya llegaron; "falta", "sin-checar" y
 * "pendiente" no han llegado; "descanso" y "sin-jornada" no cuentan.
 */
export type GrupoMiembro = 'presente' | 'tarde' | 'falta' | 'sin-checar' | 'pendiente' | 'descanso' | 'sin-jornada';

export function clasificarMiembro(
  dia: DiaAsistenciaSemanaDTO | null,
  estadoTrabajador: 'ACTIVO' | 'INACTIVO' | 'VACACIONES',
): { grupo: GrupoMiembro; etiqueta: string; variante: VarianteEstado } {
  const hora = dia?.horaEntrada ? ` ${formatHora12(dia.horaEntrada)}` : '';
  if (!dia) {
    return {
      grupo: 'sin-jornada',
      etiqueta: estadoTrabajador === 'VACACIONES' ? 'De vacaciones' : estadoTrabajador === 'INACTIVO' ? 'De baja' : 'Sin jornada',
      variante: 'neutral',
    };
  }
  switch (dia.estado) {
    case 'Puntual':
      return { grupo: 'presente', etiqueta: `Presente${hora}`, variante: 'success' };
    case 'Justificado':
      return { grupo: 'presente', etiqueta: 'Justificado', variante: 'info' };
    case 'Salida Anticipada':
      return { grupo: 'presente', etiqueta: 'Salió antes', variante: 'warning' };
    case 'Retardo':
      return { grupo: 'tarde', etiqueta: `Retardo${hora}`, variante: 'warning' };
    case 'Omisión':
      // Con entrada: llegó tarde y espera la revisión de la oficina. Sin entrada: aún no checa (puede justificarse hoy).
      return dia.horaEntrada
        ? { grupo: 'tarde', etiqueta: `Tarde${hora}`, variante: 'warning' }
        : { grupo: 'sin-checar', etiqueta: 'Sin checar', variante: 'warning' };
    case 'Pendiente':
      return { grupo: 'pendiente', etiqueta: 'En tolerancia', variante: 'neutral' };
    case 'Falta':
      // Pasadas las 17:00 la API marca como falta la omisión sin resolver aunque SÍ haya checado (llegó tarde
      // y nadie la justificó): está en la obra, pero para nómina cuenta como falta hasta que la oficina resuelva.
      return dia.horaEntrada
        ? { grupo: 'tarde', etiqueta: `Tarde${hora} · sin justificar`, variante: 'error' }
        : { grupo: 'falta', etiqueta: 'No asistió', variante: 'error' };
    case 'Descanso':
      return { grupo: 'descanso', etiqueta: 'Descanso', variante: 'neutral' };
    default:
      return { grupo: 'sin-jornada', etiqueta: dia.estado, variante: 'neutral' };
  }
}

export const GRUPOS_LLEGARON: GrupoMiembro[] = ['presente', 'tarde'];
export const GRUPOS_FALTAN: GrupoMiembro[] = ['falta', 'sin-checar', 'pendiente'];

export interface ConteoEquipo {
  total: number;
  llegaron: number;
  tarde: number;
  faltan: number;
}

/**
 * Conteo del equipo del día. Revisión de chimi (PR #24): es la ÚNICA copia; la usan el Inicio ("Mi equipo
 * hoy") y /m/asistencia ("Mi equipo"), para que los dos números no se separen.
 */
export function contarEquipo(grupos: GrupoMiembro[]): ConteoEquipo {
  return {
    total: grupos.length,
    llegaron: grupos.filter((g) => GRUPOS_LLEGARON.includes(g)).length,
    tarde: grupos.filter((g) => g === 'tarde').length,
    faltan: grupos.filter((g) => GRUPOS_FALTAN.includes(g)).length,
  };
}
