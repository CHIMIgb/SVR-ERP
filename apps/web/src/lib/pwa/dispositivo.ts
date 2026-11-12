"use client";

/**
 * Detector de dispositivo (plan §7a, opción B — decisión del cliente
 * 2026-11-11): cada cara vive en el dispositivo PARA EL QUE FUE CREADA —
 * la PWA en teléfonos/tablets y el escritorio en computadoras.
 *
 * Se detecta por SISTEMA OPERATIVO + tipo de entrada, NO por ancho de
 * ventana (ajustar/redimensionar la ventana de la PC no cambia de cara).
 * Sin override manual: el usuario no elige cara, el dispositivo la define.
 */

const UA_MOVIL = /Android|iPhone|iPod/i;

/** ¿El sistema operativo es móvil (Android/iOS)? */
export function sistemaMovil(): boolean {
  if (typeof navigator === "undefined") return false;
  if (UA_MOVIL.test(navigator.userAgent)) return true;
  // iPadOS 13+ se hace pasar por Macintosh — el táctil con multitouch lo delata
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/** ¿Entrada táctil sin hover (dedo, sin mouse)? — el clásico "es un teléfono". */
export function esEntradaTactil(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}

/** Teléfono/tablet (Android/iOS o táctil puro) → PWA; computadora → escritorio. */
export function esDispositivoMovil(): boolean {
  if (typeof window === "undefined") return false;
  return sistemaMovil() || esEntradaTactil();
}

export function vistaEfectiva(): "movil" | "escritorio" {
  return esDispositivoMovil() ? "movil" : "escritorio";
}
