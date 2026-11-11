"use client";

/**
 * Detector e interruptor de versión (plan PWA §7a — única fuente de verdad).
 * Las pantallas NO implementan detección propia; los layouts se defienden a
 * sí mismos con `vistaEfectiva()`.
 */
export type VistaForzada = "movil" | "escritorio" | null;
const CLAVE = "svr_vista";
const UMBRAL_MOVIL_PX = 767; // < 768px = móvil

/** Override manual guardado en localStorage (null = automático). */
export function vistaForzada(): VistaForzada {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(CLAVE);
  return v === "movil" || v === "escritorio" ? v : null;
}

/** Fija el override (null = volver a automático). */
export function forzarVista(v: VistaForzada): void {
  if (typeof window === "undefined") return;
  if (v) localStorage.setItem(CLAVE, v);
  else localStorage.removeItem(CLAVE);
}

/** Ancho del viewport < 768px → móvil. */
export function esAnchoMovil(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(max-width: ${UMBRAL_MOVIL_PX}px)`).matches;
}

/** La vista que TOCA: override manual ?? ancho de pantalla. */
export function vistaEfectiva(): "movil" | "escritorio" {
  const forzada = vistaForzada();
  if (forzada) return forzada;
  return esAnchoMovil() ? "movil" : "escritorio";
}
