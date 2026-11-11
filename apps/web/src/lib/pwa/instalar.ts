"use client";

import { useEffect, useState } from "react";

/**
 * Instalación de la PWA (plan §7c — review del teléfono 2026-11-11).
 * El evento `beforeinstallprompt` se dispara UNA sola vez al cargar la
 * página y el usuario SIEMPRE aterriza primero en el login (donde no hay
 * listener) — por eso el script global del layout raíz lo captura y guarda
 * en `window.__svrPrompt` apenas carga cualquier página.
 */
export interface EventoInstalacion {
  prompt: () => Promise<void>;
}

declare global {
  interface Window {
    __svrPrompt?: EventoInstalacion;
  }
}

/** El evento capturado por el script global (o null si Chrome no lo entregó). */
export function obtenerPrompt(): EventoInstalacion | null {
  if (typeof window === "undefined") return null;
  return window.__svrPrompt ?? null;
}

/** ¿El navegador ya entregó el evento de instalación? */
export function hayPromptDisponible(): boolean {
  return obtenerPrompt() !== null;
}

/**
 * Lanza el DIÁLOGO NATIVO de instalación (Install/Cancel de Chrome).
 * Devuelve true si se lanzó; false si Chrome no entregó el evento
 * (enfriamiento tras descartarlo o HTTP en dev) — en ese caso la salida es
 * el menú ⋮ → «Instalar aplicación».
 */
export async function instalarApp(): Promise<boolean> {
  const e = obtenerPrompt();
  if (!e) return false;
  await e.prompt();
  return true;
}

/** Se suscribe a los cambios del evento (llega con el evento custom del script). */
export function suscribirseAPrompt(cb: () => void): () => void {
  window.addEventListener("svr-prompt-ready", cb);
  return () => window.removeEventListener("svr-prompt-ready", cb);
}
