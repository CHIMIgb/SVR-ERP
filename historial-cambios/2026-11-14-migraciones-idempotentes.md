# Migraciones nuevas idempotentes (Opción 1) — review PR #20

**Fecha:** 2026-11-14/15
**Autor:** Agente (fase 3 del lote de fixes de la review del PR #20)

## Cambios realizados
- Los 13 archivos `migration.sql` del PR (migraciones 20261112030000 → 20261114020000)
  se editaron para que una **reaplicación a mano no truene**:
  - `CREATE TABLE` → `CREATE TABLE IF NOT EXISTS`
  - `ADD COLUMN` → `ADD COLUMN IF NOT EXISTS` (una columna por statement)
  - `CREATE [UNIQUE] INDEX` → `... IF NOT EXISTS`
  - `DROP INDEX` → `DROP INDEX IF EXISTS`
  - `ADD CONSTRAINT` y `CREATE TYPE` → envueltos en `DO $$ ... $$` con
    `pg_constraint`/`pg_type` (Postgres no tiene `IF NOT EXISTS` para esos).
  - Seed idempotente en `materiales_criba` (`NOT EXISTS` por nombre).
- Caso especial descubierto por el re-test: `20261113030000_notificaciones` creaba un
  índice sobre `leido_en`, columna que la migración posterior `20261113040000` movió a la
  tabla puente `notificaciones_lecturas`. Re-ejecutarla contra el esquema final fallaba
  ("no existe la columna leido_en"). Solución: guard por columna en `DO $$ ... $$`
  (`information_schema.columns` + `pg_indexes`).
- **Prefijos duplicados NO se tocan** (Opción 1 elegida sobre la 2): los directorios
  `20261114010000_*` y `20261114020000_*` (2 carpetas cada uno) quedan como deuda
  documentada; renombrarlos exigiría editar `_prisma_migrations` a mano en BDs vivas
  por un beneficio cosmético.

## Corrección del método de checksum (desviación del plan, documentada)
- El plan original decía refrescar checksums con `npx prisma migrate resolve --applied`.
  En Prisma 7 ese comando **rechaza** (P3008) una migración ya registrada como aplicada,
  así que los resolves no cambiaron nada (fallaron en silencio porque la salida se filtró).
- Método usado finalmente: `UPDATE _prisma_migrations SET checksum = ...` directo con el
  sha256 de los bytes del archivo en disco (algoritmo verificado empíricamente contra un
  par archivo/checksum conocido: `git show HEAD:...obras_1a1/migration.sql` → sha256 raw
  = checksum original en BD). 13 UPDATEs × 2 BDs (`svr_erp` y `svr-erp-backup`), todos
  `UPDATE 1`.

## Archivos tocados
- `apps/api/prisma/migrations/20261112030000_obras_1a1/migration.sql`
- `apps/api/prisma/migrations/20261112040000_proyectos_municipio/migration.sql`
- `apps/api/prisma/migrations/20261112060000_cotizacion_items/migration.sql`
- `apps/api/prisma/migrations/20261112140000_ventas_cliente_id/migration.sql`
- `apps/api/prisma/migrations/20261113020000_ordenes_compra_fecha_vencimiento/migration.sql`
- `apps/api/prisma/migrations/20261113030000_notificaciones/migration.sql` (guard por columna)
- `apps/api/prisma/migrations/20261113032000_notificaciones_descartada/migration.sql`
- `apps/api/prisma/migrations/20261113040000_notificaciones_lecturas/migration.sql`
- `apps/api/prisma/migrations/20261113050000_notificaciones_destinatarios/migration.sql`
- `apps/api/prisma/migrations/20261113060000_trabajadores_usuario_id/migration.sql`
- `apps/api/prisma/migrations/20261113070000_reportes_asignado_user_id/migration.sql`
- `apps/api/prisma/migrations/20261114010000_registros_criba_maquina_proyecto/migration.sql`
- `apps/api/prisma/migrations/20261114020000_materiales_criba/migration.sql`

## Verificación / pruebas
- Idempotencia real: los 13 SQL re-ejecutados con `psql -v ON_ERROR_STOP=1` contra el
  esquema FINAL en ambas BDs → **13/13 OK en `svr-erp-backup` y en `svr_erp`** (0 errores).
- Checksums: 13/13 sincronizados con el disco en ambas BDs (verificado comparando sha256
  del archivo vs `_prisma_migrations.checksum`).
- `npx prisma migrate status`: "Database schema is up to date!" en `svr_erp` (.env) y en
  `svr-erp-backup` (override de `DATABASE_URL`).
- Detector de no-idempotencia (regex excluyendo `DO $$ ... $$` blocks): 0 resultados.

## Pendientes / riesgos
- El detector regex de idempotencia da falsos positivos con los `DO $$ ... $$` — el guard
  correcto vive dentro del bloque; al auditar a futuro, excluirlos antes de matchear.
- `migrate deploy` NO valida checksums (solo `migrate dev`); con los checksums ya
  sincronizados, un `migrate dev` futuro en estas BDs no debe pedir reset por "migración
  modificada". No se probó `migrate dev` (riesgo de prompt de reset contra BD viva).
- Los prefijos duplicados de migración quedan como deuda cosmética (existían pares iguales
  desde agosto en main; no rompen el orden de aplicación).
- Estado de datos pendiente (no de este fix): en `svr_erp` fallan 2 unitarios de
  trabajadores por el rol `Tecnico` con permiso `sistema/notificaciones/ver` que lo excluye
  de `ROLES_ASIGNABLES_WHERE` — revisar seed en su momento.
