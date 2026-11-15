# 2026-11-12 — /cotizaciones: la línea de turno de 8 horas entra a la plantilla de condiciones

## Qué se hizo

- **`apps/web/src/app/(dashboard)/cotizaciones/page.tsx`** — la plantilla de
  condiciones precargadas incluye ahora la línea
  *"El turno por día se tomará a 8 horas."*
  (la que traía el Word de renta COTIZACION 37 y que antes se dejaba fuera del
  default por ser propia de renta; el cliente la decidió parte del texto base).

## Verificación

- Cambio de una sola línea de texto; sin impacto en lógica. Cubierto por el
  build (tsc/eslint corridos en el commit previo).

## Pendientes / riesgos

- Todas las cotizaciones nuevas saldrán con la línea (renta o no); se puede
  borrar campo por campo si una cotización no la lleva.
