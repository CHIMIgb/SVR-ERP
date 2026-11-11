"use client";

/**
 * Instalación de la PWA (petición del cliente 2026-11-11): modal propio
 * en cada acceso si la app no está instalada. El evento
 * `beforeinstallprompt` se dispara UNA vez al cargar la página y ANTES
 * de que React hidrate — el script inline del layout `(pwa)` lo captura
 * y lo guarda en `window.__svrPrompt` para que el modal lo lance con su
 * botón «Instalar».
 */

export interface EventoInstalacion {
  prompt: () => Promise<void>;
}

declare global {
  interface Window {
    __svrPrompt?: EventoInstalacion;
  }
}

/** El evento capturado por el script del layout (null si Chrome no lo entregó). */
export function obtenerPrompt(): EventoInstalacion | null {
  if (typeof window === "undefined") return null;
  return window.__svrPrompt ?? null;
}

/** ¿La app ya corre instalada (standalone)? */
export function estaInstalada(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Lanza el DIÁLOGO NATIVO de instalación. Devuelve false si Chrome no
 * entregó el evento (enfriamiento tras descartarlo u origen sin
 * confianza) — en ese caso el modal muestra la salida del menú ⋮.
 */
export async function instalarApp(): Promise<boolean> {
  const e = obtenerPrompt();
  if (!e) return false;
  try {
    await e.prompt();
    return true;
  } catch {
    return false;
  }
}
