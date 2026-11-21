/**
 * Helpers de la asistencia propia en la PWA (/m y /m/asistencia).
 *
 * Todo lo de aquí es AVISO para el trabajador: quien decide si la entrada fue puntual, si estaba en sitio o
 * si queda en omisión es la API al registrar (asistencia.service.ts). Si cambia una regla allá, se cambia aquí.
 */
import type { RegistroAsistenciaDTO } from '@/lib/api';

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
 * Minutos tarde respecto a la entrada programada "HH:mm" (negativo = antes). Usa la hora local del
 * teléfono, igual que la API usa la hora local del servidor (ambos en America/Mexico_City).
 */
export function minutosTarde(entradaProgramada: string | undefined, ahora: Date): number | null {
  if (!entradaProgramada) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(entradaProgramada);
  if (!m) return null;
  return ahora.getHours() * 60 + ahora.getMinutes() - (Number(m[1]) * 60 + Number(m[2]));
}

/** "domingo 8 de noviembre" en la zona del negocio. */
export function fechaLarga(d: Date): string {
  return d.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Mexico_City',
  });
}

/** Hora actual "HH:mm" para mostrarla con formatHora12. */
export function horaActual(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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

/** Mensaje para el trabajador de un error de la API al checar o al cargar. */
export function mensajeDeApi(error: { code?: string; message?: string } | undefined, porDefecto: string): string {
  if (!error) return porDefecto;
  if (error.code === 'API_DOWN') return 'Sin conexión con el servidor. Revisa tu señal e intenta de nuevo.';
  return error.message || porDefecto;
}
