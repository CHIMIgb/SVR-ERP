"use client";

/**
 * Snapshot de datos para LEER sin señal (fase offline-lectura, 2026-11-20):
 * cada pantalla PWA guarda su último load exitoso y, sin conexión, muestra
 * esa copia con el aviso de antigüedad (AvisoSinConexion).
 *
 * Por qué localStorage con clave por usuario y no la caché del SW: la caché
 * del SW es POR ORIGEN — en un teléfono compartido serviría los datos del
 * usuario anterior al siguiente. Aquí la clave lleva el userId y el
 * AuthProvider limpia TODO el prefijo al cerrar/iniciar sesión.
 *
 * Presupuesto: un snapshot de listado (10 items + stats) pesa ~15-20 KB —
 * centésimas de la cuota de localStorage (~5 MB por origen). Best-effort:
 * si la cuota falla, se traga (el snapshot nunca rompe la vista).
 */

const PREFIJO = "svr-pwa-datos:";

export interface SnapshotDatos<T> {
  datos: T;
  /** ISO — el banner la muestra formateada para que nadie confunda datos viejos con actuales. */
  fechaGuardada: string;
}

function claveDe(userId: string, nombre: string): string {
  return `${PREFIJO}${userId}:${nombre}`;
}

/** Guarda (o actualiza) el snapshot de una pantalla. Devuelve la fecha ISO guardada. */
export function guardarDatos<T>(userId: string, nombre: string, datos: T): string | null {
  try {
    const snapshot: SnapshotDatos<T> = { datos, fechaGuardada: new Date().toISOString() };
    localStorage.setItem(claveDe(userId, nombre), JSON.stringify(snapshot));
    return snapshot.fechaGuardada;
  } catch {
    return null; // cuota llena / modo privado: best-effort, la vista sigue normal
  }
}

/** Lee el snapshot de una pantalla (null si no hay o está corrupto). */
export function leerDatos<T>(userId: string, nombre: string): SnapshotDatos<T> | null {
  try {
    const crudo = localStorage.getItem(claveDe(userId, nombre));
    if (!crudo) return null;
    return JSON.parse(crudo) as SnapshotDatos<T>;
  } catch {
    return null;
  }
}

/** Quita TODOS los snapshots (logout / login: nada de un usuario para el siguiente). */
export function limpiarDatosCache(): void {
  try {
    const borrables: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const clave = localStorage.key(i);
      if (clave?.startsWith(PREFIJO)) borrables.push(clave);
    }
    borrables.forEach((clave) => localStorage.removeItem(clave));
  } catch {
    // localStorage indisponible: nada que limpiar
  }
}

/** Pide al SW que borre el caché de navegaciones (svr-nav-v1). Best-effort. */
export function limpiarCacheNavegacion(): void {
  try {
    navigator.serviceWorker?.controller?.postMessage({ tipo: "limpiar-cache" });
  } catch {
    // sin SW (dev) o sin controller: nada que limpiar
  }
}
