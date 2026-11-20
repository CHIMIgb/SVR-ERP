# Cámara directa en la PWA: «Tomar foto» + «Galería» (opción 2)

**Fecha:** 2026-11-19
**Autor:** agente
**Origen:** duda del usuario — que al adjuntar imagen en la PWA se abra la cámara del teléfono.

## Cambios realizados
- Los dos file-inputs de imagen de la PWA ahora ofrecen **dos acciones**:
  - **«Tomar foto»** — `capture="environment"`: el input abre la CÁMARA
    trasera del teléfono directamente (sin selector, un paso menos en obra).
  - **«Galería»** — `accept="image/*"` sin capture: el selector de archivos
    de siempre, para adjuntar una foto ya existente (capturas, fotos del día).
- Mismo handler en ambos (`agregarImagen` / `handleAdjuntar`): WebP local +
  límites + cola/adjunte — nada cambia en el procesamiento.
- Alcance **solo PWA**: `ModalNuevoReporte` (crear) y el detalle de
  `/m/reportes`. El escritorio conserva su «Agregar imagen» único sin
  capture (en PC no aplica).

## Archivos tocados
- `apps/web/src/components/pwa/ModalNuevoReporte/ModalNuevoReporte.tsx`
- `apps/web/src/app/(pwa)/m/reportes/page.tsx`
- `historial-cambios/2026-11-19-pwa-camara-directa.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 37 warnings preexistentes.
- `git diff --check`: sin errores.
- **Smoke pendiente en el teléfono:** «Tomar foto» abre la cámara (con HTTPS ya funciona el permiso de cámara), «Galería» muestra el selector; ambas terminan en preview/adjunte.

## Pendientes y riesgos
- En el detalle, mientras `adjuntando` está activo el texto cambia a «Subiendo...» SOLO en el label de cámara (el de galería no refleja el estado): menor, aceptado.
- Con `capture` el comportamiento exacto depende del navegador del teléfono (Chrome abre la app de cámara); en desktop/tablet sin cámara el input con capture cae al selector normal.
- Sin push: el commit queda local.
