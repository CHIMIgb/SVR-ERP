# Sugerencias review PR #15 (C3) — las 3 migraciones del PR son idempotentes

**Fecha:** 2026-11-06
**Autor:** agente OpenCode

## Cambios realizados
Idempotencia (sugerencia 4 del review): un re-run ya no rompe —

1. `20261104000000_unificar_reportes`:
   - `ADD VALUE 'ADMINISTRATIVO'` → `DO $$` con check de `pg_enum`.
   - `ADD COLUMN` ×4 → `ADD COLUMN IF NOT EXISTS`.
   - `ADD CONSTRAINT fkey` → `DO $$` con check de `pg_constraint` (no existe
     `IF NOT EXISTS` para constraints).
   - `CREATE INDEX` ×2 → `IF NOT EXISTS`.
   - **La migración de datos (INSERT incidentes→reportes_campo + DROP) ahora
     vive en un `DO $$ IF EXISTS(incidentes)`** → en un re-run (table gone)
     se salta completa; `DROP TABLE/TYPE` con `IF EXISTS`.
   - La sección RBAC ya era re-runnable (borra por ruta + inserciones con
     `NOT EXISTS`) — sin cambios.
2. `20261104000100_auditaction_asignar`: `ADD VALUE 'REPORTE_ASIGNADO'` →
   `DO $$` con check de `pg_enum`.
3. `20261104003000_proyectos_ubicacion`: `ADD COLUMN` ×5 → `IF NOT EXISTS`.

## Pruebas / verificación
- Sandbox (copia completa de `svr_erp`, donde estas migraciones YA están
  aplicadas): corrido el SQL completo de las 3 migraciones → **0 errores**;
  solo NOTICEs benignos de "ya existe, omitiendo"; 0 vistas fantasmas
  (`/incidentes`/`/reportes-campo`) y los 2 role_vistas de `/reportes`
  intactos (el re-vínculo idempotente NO duplicó).
- Segmento de datos: el `DO $$ IF EXISTS` corre el INSERT una única vez
  (en el servidor), y en re-run lo salta.
- `prisma migrate status`: up to date, 56 migraciones ✔.

## Archivos tocados
- 3 `migration.sql` en `apps/api/prisma/migrations/20261104*` (nada más).

## Pendientes y riesgos
- El servidor aplicará la versión idempotente vía `migrate deploy`
  (transaccional por migración) — el pre-flight de incidentes del header
  del SQL sigue vigente.
- PG ≥ 12 requerido para `ADD VALUE` dentro de `DO $$` (Postgres 18 en
  local y servidor — sin riesgo conocido).
