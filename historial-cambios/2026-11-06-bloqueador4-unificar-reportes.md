# Bloqueador 4 del review PR #15 (parte A) — unificar_reportes preserva datos y fija TZ

**Fecha:** 2026-11-06
**Autor:** agente OpenCode

## Cambios realizados
`apps/api/prisma/migrations/20261104000000_unificar_reportes/migration.sql`:

1. **Header operacional para el servidor**: pre-flight
   `SELECT count(*), count(reporte_descripcion), count(reportado_en) FROM incidentes;`
   + instrucción de aplicar SOLO con `npx prisma migrate deploy`
   (transaccional: si falla el INSERT, el DROP revierte; nunca psql crudo
   sin `-1 / ON_ERROR_STOP=1`, que es como el review marcó la pérdida).
2. **TZ determinista**: `(i.fecha AT TIME ZONE 'America/Mexico_City')::date`
   y `::time` — el cast directo de un timestamptz dependía de la TZ de la
   sesión (con UTC quedaba corrida 6 h, mismo bug de horas recurrente).
   Verificado: `21:30 UTC → 2026-11-06 / 15:30` en sesión UTC.
3. **Preservación de datos que antes se perdían (100% → 0)**:
   `reporto_id` (trabajador que reportó), `reporte_descripcion` y
   `reportado_en` ahora van a `reportes_campo.detalles` (jsonb nullable,
   índice GIN ya existente) — condicional: solo se construye el JSON si al
   menos uno es no-NULL (`CASE` + `jsonb_strip_nulls`; nunca objeto vacío).

## Archivos tocados
- `apps/api/prisma/migrations/20261104000000_unificar_reportes/migration.sql` (solo este archivo)

## Pruebas / verificación
- Semántica de casts TZ y construcción condicional del JSON probada en psql
  (sesión UTC: fecha/hora correctas; all-null → NULL; con datos → JSON limpio).
- `npx tsc --noEmit` (api) ✔ · `npm run test` 1018 passed, solo las 2 fallas
  históricas de cobranza ✔ · drift BD↔schema = 0 ✔.
- BD local: esta migración ya está aplicada; el cambio de SQL rige para el
  deploy del servidor (flujo aceptado del repo: editar SQL post-apply).

## Pendientes y riesgos
- En el servidor, correr el pre-flight ANTES del deploy: si
  `count(reporte_descripcion/reportado_en) > 0`, los 2 incidentes con data
  preservada quedará en `detalles` — si el count difiere de los reportados,
  investigar antes de aplicar.
- El JSON en `detalles` es preservación, no desnormalización activa: la UI
  de reportes no lo consume hoy (puede leerse vía SQL si se necesita).
