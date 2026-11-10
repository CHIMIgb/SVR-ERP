# F2 ajuste — KPIs con spinner (corrección del usuario) + delay 3s en TODAS las vistas con carga

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Cambios realizados
1. **`StatsCard.loading` → SPINNER (corrección del usuario):** en el commit anterior
   las KPIs cargaban con skeleton de barras — el usuario corrigió: las KPIs siempre
   muestran números, así que su estado de carga es un **spinner centrado** que
   conserva la tarjeta y su tamaño (nunca "0" falso). `StatsCard.tsx` actualizado
   (border-spinner vía `Loader2 animate-spin text-primary`; sin import Skeleton).
2. **`AGENTS.md`** regla dura re-redactada con la excepción: tablas = skeleton,
   **KPIs = spinner**, bloques = skeleton, refetches = RefreshOverlay, Button
   skeleton para acciones; kit actualizado (incluye `StatsCard.loading` y
   `Button.loading/skeleton`). Titular ajustado: "nunca bloque vacío ni 0 falso:
   tablas con skeleton, KPIs con spinner".
3. **`COMPONENTS.md`** §4.1 actualizado: StatsCard.loading = spinner centrado.
4. **Delay de 3s extendido a TODAS las vistas con carga de datos:** 9 páginas
   extra (asistencia, combustible, horometro, mantenimiento, maquinaria, nomina,
   trabajadores, configuracion, ventas/cierres) — junto con las 13 anteriores,
   casi todo el dashboard carga con sleepDemo(3000) (solo quedan fuera: dashboard,
   documentos, gps y ui-showcase porque son mock/estáticos sin pipeline de datos).

## Verificación
- `npx tsc --noEmit`: 0 errores. Mojibake en diff: 0 (re-aplicación con node UTF-8).

## Pendientes y riesgos
- El delay demo ahora cubre ~22 vistas: **ojo al quitarlo tras el martes** (marcados
  los helpers; es 1 línea por vista + imports).
- dashboard/documentos/gps siguen sin delay ni skeletons por ser mock (deuda F4).
