# PWA — color de las barras del sistema en la app instalada (WebAPK)

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base`

## Cambios realizados

**Diagnóstico:** la app instalada en Android es un WebAPK — Chrome graba
el `theme_color` del manifest AL INSTALAR y pinta status/nav bars con ese
valor fijo; el `<meta>` dinámico (que sí funciona en la pestaña) no se
aplica en vivo en la instalada (confirmado por capturas del usuario:
naranja en ambos temas).

**Fix (las dos palancas que Chrome soporta):**

1. `scriptCaptura` del layout `(pwa)` (corre al parsear, antes del primer
   pintado) también fija el `<meta name="theme-color">` según el tema ya
   resuelto (lee la clase `dark` que el script de tema puso en `<html>`).
   Si el Chrome del teléfono lee el meta al cargar, la app instalada
   arranca con la barra del tema correcto.
2. `manifest.json`: `theme_color` naranja → `#0f172a` — lo que Chrome
   graba al instalar; coincide con el `background_color` del splash.
3. El effect del `MutationObserver` queda intacto (toggle en vivo en
   pestaña del navegador).

**Límite de Chrome (documentado):** el cambio AL VUELO al alternar tema
dentro de la app instalada no existe en Chrome Android — la barra se
pinta al arrancar la app (tema activo en ese momento).

## Archivos tocados

- `apps/web/src/app/(pwa)/layout.tsx` (3 líneas en el script inline)
- `apps/web/public/manifest.json` (theme_color)

## Pruebas / verificación

- `tsc --noEmit` ✅; eslint ✅.
- Verificación en el teléfono: **desinstalar y reinstalar** la PWA
  (Chrome re-acuña el WebAPK con el nuevo valor del manifest) y probar
  ambos temas.

## Pendientes y riesgos

- Sin push (orden del usuario).
- Si el Chrome del teléfono solo usa el valor del manifest, la barra
  queda oscura en ambos temas (menos raro que blanca sobre oscuro; y
  coherente con el splash). Ver test del teléfono para saber cuál de las
  dos conductas aplica en esa versión de Chrome.
