# Tema por defecto de la app = el del sistema (teléfono)

**Fecha:** 2026-11-11
**Autor:** agente SVR-ERP (GLM-5.3-Flash)

## Cambios realizados
- `TEMA_POR_DEFECTO` pasa de `"light"` a `"system"`: sin preferencia guardada, la PWA
  nace con el tema del teléfono (`matchMedia prefers-color-scheme`, en vivo) — petición
  del cliente. Afecta a escritorio y PWA por igual (comparten la constante y la clave
  `svr-tema` de localStorage).
- El login sigue fijo oscuro y el status bar sigue fijo claro (no cambian).

## Archivos tocados
- `apps/web/src/lib/tema.ts` (una constante + comentario)

## Pruebas / verificación
- El script inicial y `ThemeProvider` ya leen la constante (cero cambios extra).
- Pendiente smoke: borrar `svr-tema` de localStorage y comprobar que la PWA arranca
  con el tema del teléfono y reacciona al cambiarlo en el sistema.

## Pendientes y riesgos
- En SSR el primer render asume no-oscuro (preexistente); el script del head corrige
  la clase antes del primer pintado, así que no hay flash.
