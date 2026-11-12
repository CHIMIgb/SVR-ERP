/**
 * Preferencia de tema (claro / oscuro / sistema).
 *
 * La lee el script inicial del layout raíz (antes del primer pintado, para que
 * no parpadee) y la administra ThemeProvider. Ambos usan estas constantes para
 * no desincronizarse.
 */

export type PreferenciaTema = "light" | "dark" | "system";

export const CLAVE_TEMA = "svr-tema";

/** Sin preferencia guardada se sigue al sistema: la PWA nace con el tema del teléfono (petición del cliente 2026-11-11). */
export const TEMA_POR_DEFECTO: PreferenciaTema = "system";

export const CONSULTA_OSCURO = "(prefers-color-scheme: dark)";

export function esPreferenciaTema(valor: unknown): valor is PreferenciaTema {
  return valor === "light" || valor === "dark" || valor === "system";
}

/**
 * Script que corre en <head> antes de pintar: pone `.dark` en <html> y el
 * color-scheme según la preferencia guardada. Si localStorage no está
 * disponible (modo privado, bloqueado), avisa en consola y usa el tema por
 * defecto.
 */
export const SCRIPT_TEMA_INICIAL = `(function () {
  var preferencia = ${JSON.stringify(TEMA_POR_DEFECTO)};
  try {
    var guardada = window.localStorage.getItem(${JSON.stringify(CLAVE_TEMA)});
    if (guardada === "light" || guardada === "dark" || guardada === "system") {
      preferencia = guardada;
    }
  } catch (error) {
    console.warn("[tema] No se pudo leer la preferencia guardada; se usa el tema por defecto.", error);
  }
  var oscuro = preferencia === "dark" ||
    (preferencia === "system" && typeof window.matchMedia === "function" &&
      window.matchMedia(${JSON.stringify(CONSULTA_OSCURO)}).matches);
  var raiz = document.documentElement;
  raiz.classList.toggle("dark", oscuro);
  raiz.style.colorScheme = oscuro ? "dark" : "light";
})();`;
