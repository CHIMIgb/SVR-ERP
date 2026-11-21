# 2026-11-20 — Migraciones idempotentes (20261118020000 y 20261120010000) — menor 1 PR #23

## Cambios realizados

**Menor 1 de la review del PR #23:** las migraciones del PR no tenían `IF NOT EXISTS`
ni bloque `DO` — si se re-ejecutaran en el servidor (BD ya alterada a mano, restore
parcial, etc.), `migrate deploy` tronaba con duplicate_column/duplicate_table.

Fix:
- `20261118020000_reportes_campo_idempotencia_key`: `ADD COLUMN IF NOT EXISTS` +
  `CREATE UNIQUE INDEX IF NOT EXISTS`.
- `20261120010000_push_suscripciones`: `CREATE TABLE IF NOT EXISTS` +
  `CREATE UNIQUE INDEX IF NOT EXISTS` + `CREATE INDEX IF NOT EXISTS`. La FK no tiene
  `IF NOT EXISTS` nativo: bloque `DO $$ ... IF NOT EXISTS (SELECT 1 FROM
  pg_constraint WHERE conname = 'fk_push_suscripciones_usuario') THEN ALTER ... $$`.

## Cosas nuevas

- Ninguna (semitácticas de idempotencia estándar de PostgreSQL).

## Archivos tocados

- `apps/api/prisma/migrations/20261118020000_reportes_campo_idempotencia_key/migration.sql`
- `apps/api/prisma/migrations/20261120010000_push_suscripciones/migration.sql`

## Verificación / pruebas

- **Re-ejecución real de ambos archivos con `psql` contra `svr_erp` local**
  (exactamente el escenario "re-ejecutar en el servidor"): pasaron sin error, solo
  NOTICEs benignos de "ya existe, omitiendo" — idempotencia probada contra BD real.
- `npx prisma migrate resolve --applied <cada una>` — refresca el checksum grabado en
  `_prisma_migrations` tras editar los archivos (sin esto, cualquier `migrate deploy`
  local futura habría fallado por "migración modificada").
- `npx prisma migrate deploy` → 105 migraciones, "No pending migrations to apply", sin
  error de checksum — la BD y el historial quedan consistentes.
- No se tocó `schema.prisma` ni la BD: el dump de integración sigue coincidiendo
  (`migrate diff` de CI no se ve afectado; integration.yml no corre `migrate deploy`).

## Pendientes / riesgos

- Si el entorno del servidor YA registró estos archivos con el checksum viejo, al
  actualizar el repo habría que correr `prisma migrate resolve --applied` por cada uno
  (como se hizo en local) — queda documentado aquí. Si el servidor NUNCA los aplicó
  (el PR sigue abierto), simplemente los aplicará idempotentes la primera vez.
