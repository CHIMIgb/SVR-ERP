# PR #15 — comentario de status del bloqueador 4 publicado

**Fecha:** 2026-11-06
**Autor:** agente OpenCode

## Cambios realizados
- Pieza A: `unificar_reportes/migration.sql` — TZ determinista
  (`AT TIME ZONE 'America/Mexico_City'`), preservación de
  `reporto_id/reporte_descripcion/reportado_en` en `detalles` (jsonb
  condicional) y header operacional (pre-flight SELECT + deploy-only).
- Pieza B: removidas las migraciones `drop_permisos_fantasma` y
  `restore_permisos` (neto cero peligroso — dropearía el `permisos` del
  servidor y lo recrearía vacío); `_prisma_migrations` local limpio de
  esas 2 filas; `migrate status` up to date; drift DB↔schema 0.
- Verificación: semántica TZ/JSON probada en psql; `tsc` ✔; suite api
  1018 passed (solo las 2 fallas históricas de cobranza).
- Push `2a231657..7d7c2163` + comentario en el PR:
  https://github.com/CHIMIgb/SVR-ERP/pull/15#issuecomment-6696103540

## Notas del flujo
- Corregí una colación accidental: los `git rm` de la pieza B entraron en
  el commit A (reset --soft + re-commit en 2 commits atómicos limpios:
  `2e7044e3` y `7d7c2163`).
- `prisma.config.ts` se tocó temporalmente para un diff (shadowDatabaseUrl)
  y se revirtió — queda sin cambios en el diff final.

## Pendientes y riesgos
- Operador del servidor: correr el pre-flight del header ANTES del deploy;
  si los counts difieren de lo esperado, investigar antes de aplicar.
- Si el servidor ya aplicó las 2 migraciones de permisos en un deploy
  intermedio, reconciliar su `_prisma_migrations` (DELETE de esas 2 filas).
- `migrate diff --from-migrations` sigue siendo inusable en este repo
  (baseline sin init) — la verificación de drift se hace DB↔schema.
