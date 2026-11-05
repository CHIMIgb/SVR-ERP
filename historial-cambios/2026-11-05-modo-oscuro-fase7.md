# Modo oscuro Ops/Comercial — FASE 7 (barrido de revisión del usuario)

**Fecha:** 2026-11-05
**Autor:** agente OpenCode (por capturas nuevas del usuario)

## Diagnóstico
Fases anteriores aplicaban mapas parciales; las páginas troncales conservaban
clases crudas `slate-*`/"bg-white" en columnas y botones — texto invisible y
botones grises fuera de contraste al activar el modo oscuro.

## Cambios realizados
- **102 reemplazos** con `scripts/oscuro-fase7-sweep.cjs` aplicando la regla
  oficial de migración de `globals.css` (líneas 30-33): `bg-white→bg-surface`
  y `slate-N→ui-N` por archivo:
  - `proyectos/page.tsx` (25) — captura #2 (columnas y textos).
  - `reportes/page.tsx` (31) — captura #1 (fechas/labels/columnas de la tabla).
  - `cobranza/page.tsx` (41) — capturas #7 (restaurando del listado) y #8.
  - `clientes/page.tsx` (4) — botones Ver/Cuenta (captura #4).
  - `criba/page.tsx` (1).
- `DataTable.styles.ts`: 0 ocurrencias (ya tokens del PR13 — el componente era
  correcto; el problema estaba en las columnas render por página).
- Los botones de acento grises desaparecen en dark: sus clases ya son ui-100/ui-200
  que se invierten con el en cierta medida (los sólidos intactos).

## Pruebas / verificación
- Scan: **slate remanente = 0** en las 13 carpetas del alcance; `tsc web` ✔.
- captura por captura página: reportes/cobranza/proyectos re-revisar tras este paso.

## Pendientes y riesgos
- Si algo puntual queda a medias, se tomara con captura específica.
