# KPIs de /m/reportes no cargaban + margen del modal en pantalla chica

**Fecha:** 2026-11-19
**Autor:** agente
**Reporte:** teléfono real (PWA en LAN, HTTPS) — el modal de «Nuevo reporte» roza los bordes y las KPIs quedan en spinner.

## Cambios realizados
1. **KPIs (bug propio, introducido en `1dc1a53f`):** la carga inicial de
   `(pwa)/m/reportes` solo llamaba `recargar()` — `cargarStats()` solo
   corría al evento `online` o tras encolar, así que las stats nacían
   `null` y el spinner de `StatsCard` quedaba eterno. Ahora la carga
   inicial también llama `cargarStats()`. Además, si `stats` falla, se
   fijan en 0 (ya no "cargando" eterno; la carga NUNCA muestra 0 falso —
   el 0 aparece solo tras un intento fallido).
   - Diagnóstico por API: `GET /reportes-campo/stats` responde 200 con
     datos para el rol Trabajador (`{nuevos:1, criticosActivos:0...}`) —
     el backend nunca fue el problema.
2. **Margen del modal (kit compartido):** `Modal.tsx` envolvía la tarjeta
   con `Overlay` de `p-2 sm:p-4` (8px en el teléfono) — rozaba los bordes.
   Ahora `p-4` fijo: 16px en todos lados (arriba/abajo/lados) en móvil y
   **el escritorio (≥ sm) queda exactamente igual** (ya tenía 16px).

## Archivos tocados
- `apps/web/src/app/(pwa)/m/reportes/page.tsx`
- `apps/web/src/components/ui/Modal/Modal.tsx` (1 clase del Overlay)
- `historial-cambios/2026-11-19-pwa-kpis-modal-margen.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 37 warnings preexistentes.
- `git diff --check`: sin errores.
- Endpoint `stats` probado por curl con token real de `TRA-0142` (200).
- Smoke pendiente en el teléfono: KPIs visibles al abrir /m/reportes y modal con aire en 320px.

## Pendientes y riesgos
- El cambio del kit `Modal` (padding del Overlay) afecta a TODOS los modales en pantallas < sm (escritorio en ventana angosta incluido): revisar una vista de escritorio si algo se ve apretado.
- Sin push: los commits quedan locales.
