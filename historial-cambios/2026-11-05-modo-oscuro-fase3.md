# Modo oscuro Ops/Comercial — FASE 3 (finanzas, facturas, modales cliente/cotización)

**Fecha:** 2026-11-05
**Autor:** agente OpenCode

## Cambios realizados
- Migración a tokens (que se voltean con `.dark`) de los 5 archivos del
  alcance — **171 reemplazos** con `scripts/oscuro-fase3.cjs`:
  - `finanzas/page.tsx` (23): tab Movimientos + Flujo Neto (encabezados, celdas,
    cards) — capturas #6.
  - `components/finanzas/ConciliacionBancaria.tsx` (17): selects, card del
    panel y empty state — captura #7.
  - `facturas/page.tsx` (42): form de conceptos de Nueva Factura + listados —
    captura #10.
  - `clientes/page.tsx` (57): modal "Detalle del Cliente" (cajas internas
    bg-white → surface, textos gris) — captura #4.
  - `cotizaciones/page.tsx` (32): modal "Detalle de Cotización" — captura #5.
- Reemplazos aplicados: `bg-white→bg-surface`, `bg-slate-50/100→bg-ui-50/100`,
  `border-slate-100/200/300→border-ui-*`, `text-slate-400…900→text-ui-…`,
  `placeholder`.
- `npx tsc --noEmit` web ✔ (0 errores).

## Archivos tocados
- 5 archivos de arriba + `apps/api/scripts/oscuro-fase3.cjs`.

## Pruebas / verificación
- `npx tsc --noEmit` web: 0 ✔ — visual pendiente del usuario.

## Pendientes y riesgos
- Colored soft-colors (`bg-red-50` etc.) en estos 5 archivos NO se tocaron en
  esta fase (solo slates/blancos); quedan para el barrido de fase 6 por
  archivo (evitar mezclar patrones).
- El range picker / Charts con hex de la fase 6 (Charts.styles ya migró el PR13
  pero quedan hex en props de Charts usados por finanzas/dashboard).
