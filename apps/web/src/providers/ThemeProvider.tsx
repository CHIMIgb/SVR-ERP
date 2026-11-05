"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  CLAVE_TEMA,
  CONSULTA_OSCURO,
  TEMA_POR_DEFECTO,
  esPreferenciaTema,
  type PreferenciaTema,
} from "@/lib/tema";

interface ThemeContextValue {
  /** Lo que eligió el usuario: claro, oscuro o seguir al sistema. */
  preferencia: PreferenciaTema;
  /** Lo que se está mostrando de verdad (resuelve "system"). */
  temaAplicado: "light" | "dark";
  setPreferencia: (preferencia: PreferenciaTema) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/* ── Estado externo: preferencia guardada + preferencia del sistema ──
   El <html> lo pinta primero el script inicial del layout (antes de hidratar).
   Después solo se toca en respuesta a eventos (el usuario elige, cambia el
   sistema o cambia otra pestaña), nunca en un efecto de render: así no hay
   destellos al cargar. */

let preferenciaActual: PreferenciaTema | null = null;
const oyentesPreferencia = new Set<() => void>();

/** Valida un valor leído de localStorage. `null` = sin preferencia (caso normal). */
function interpretarValorGuardado(valor: string | null): PreferenciaTema {
  if (valor === null) return TEMA_POR_DEFECTO;
  if (esPreferenciaTema(valor)) return valor;
  console.warn(`[tema] Valor guardado no reconocido ("${valor}"); se usa el tema por defecto.`);
  return TEMA_POR_DEFECTO;
}

function leerPreferenciaGuardada(): PreferenciaTema {
  try {
    return interpretarValorGuardado(window.localStorage.getItem(CLAVE_TEMA));
  } catch (error) {
    console.warn("[tema] No se pudo leer la preferencia guardada; se usa el tema por defecto.", error);
    return TEMA_POR_DEFECTO;
  }
}

function obtenerPreferencia(): PreferenciaTema {
  if (preferenciaActual === null) preferenciaActual = leerPreferenciaGuardada();
  return preferenciaActual;
}

// matchMedia existe en todos los navegadores soportados; el guard evita tumbar el
// árbol completo (este provider vive en el layout raíz) en entornos sin él, como jsdom.
function consultaSistema(): MediaQueryList | null {
  return typeof window.matchMedia === "function" ? window.matchMedia(CONSULTA_OSCURO) : null;
}

function sistemaEnOscuro(): boolean {
  return consultaSistema()?.matches ?? false;
}

function resolverTema(preferencia: PreferenciaTema, sistemaOscuro: boolean): "light" | "dark" {
  return preferencia === "dark" || (preferencia === "system" && sistemaOscuro) ? "dark" : "light";
}

function aplicarEnDocumento(tema: "light" | "dark") {
  const raiz = document.documentElement;
  raiz.classList.toggle("dark", tema === "dark");
  raiz.style.colorScheme = tema;
}

function avisarCambioPreferencia() {
  oyentesPreferencia.forEach((oyente) => oyente());
}

function suscribirPreferencia(oyente: () => void) {
  oyentesPreferencia.add(oyente);

  // Si el usuario cambia el tema en otra pestaña, esta lo sigue.
  // key === null significa que otra pestaña vació el localStorage completo.
  const alCambiarStorage = (evento: StorageEvent) => {
    if (evento.key !== null && evento.key !== CLAVE_TEMA) return;
    preferenciaActual = evento.key === null ? leerPreferenciaGuardada() : interpretarValorGuardado(evento.newValue);
    aplicarEnDocumento(resolverTema(preferenciaActual, sistemaEnOscuro()));
    avisarCambioPreferencia();
  };
  window.addEventListener("storage", alCambiarStorage);

  return () => {
    oyentesPreferencia.delete(oyente);
    window.removeEventListener("storage", alCambiarStorage);
  };
}

function suscribirSistema(oyente: () => void) {
  const consulta = consultaSistema();
  if (!consulta) return () => {};
  const alCambiar = () => {
    if (obtenerPreferencia() === "system") {
      aplicarEnDocumento(consulta.matches ? "dark" : "light");
    }
    oyente();
  };
  consulta.addEventListener("change", alCambiar);
  return () => consulta.removeEventListener("change", alCambiar);
}

function guardarPreferencia(nueva: PreferenciaTema) {
  preferenciaActual = nueva;
  try {
    window.localStorage.setItem(CLAVE_TEMA, nueva);
  } catch (error) {
    // El tema se aplica igual en esta sesión; solo no se recordará al recargar.
    console.warn("[tema] No se pudo guardar la preferencia; se aplica solo en esta sesión.", error);
  }
  aplicarEnDocumento(resolverTema(nueva, sistemaEnOscuro()));
  avisarCambioPreferencia();
}

// En el servidor no hay localStorage ni matchMedia: se renderiza con el valor por
// defecto y React re-renderiza con el valor real justo después de hidratar.
const preferenciaServidor = () => TEMA_POR_DEFECTO;
const sistemaServidor = () => false;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preferencia = useSyncExternalStore(suscribirPreferencia, obtenerPreferencia, preferenciaServidor);
  const sistemaOscuro = useSyncExternalStore(suscribirSistema, sistemaEnOscuro, sistemaServidor);
  const temaAplicado = resolverTema(preferencia, sistemaOscuro);

  const setPreferencia = useCallback((nueva: PreferenciaTema) => guardarPreferencia(nueva), []);

  const value = useMemo(
    () => ({ preferencia, temaAplicado, setPreferencia }),
    [preferencia, temaAplicado, setPreferencia],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
