# Bloque 6 review PR#17: migración flujo_incidentes_v2 idempotente

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

`20261108153000_flujo_incidentes_v2` tenía solo 3 guardas en todo el SQL:
`CREATE TYPE`, `CREATE TABLE`, `RENAME COLUMN`, `ADD VALUE` y los INSERTs
terminaban en error si la migración se re-aplicaba. Ahora todo protegido
(patrones prisma/pg estándar):

1. **RENAMES y CREATE TYPE con catálogo:** DROP/RENAME del tipo viejo
   (`EstadoReporteCampo` → `EstadoReporteCampoOld`) escritos con chequeo
   `pg_type`; `CREATE TYPE "EstadoIncidente"` con `IF NOT EXISTS`-equivalente.
2. **La conversión de columna `estado`** (toda la sección CASE WHEN
   PENDIENTE→NUEVO...) sólo corre si la columna aún usa el tipo viejo
   (`information_schema.columns c ... c.udt_name = 'EstadoReporteCampoOld'`;
   con PG 18 `udt_oid` NO existe en esa vista — primera corrida lo puso de
   manifestito y se corrigió).
3. **RENAME `resuelto_en` → `cerrado_en`** sólo si la columna vieja existe.
4. **DROP COLUMN** conservados (v2 sin esos campos) ya con `IF EXISTS`.
5. **CREATE TABLE / CREATE INDEX** todos con `IF NOT EXISTS`;
   **ADD CONSTRAINT** (FK de actividades y adjuntos) con chequeo de `pg_constraint`.
6. **Seed de subcategorías idempotente:** reescrito como INSERT...SELECT con
   `WHERE NOT EXISTS` (el índice único (categoria, nombre) es el respaldo) —
   sin `ON CONFLICT` no habría vía de retiro para re-corridas parciales.
7. **ADD VALUE de enum** (`REPORTE_COMENTADO` / `REPORTE_ADJUNTO`) con chequeo
   `pg_enum` (idempotente; el bloque 3 ya añadió los patrones iguales para
   REPORTE_ACCESO_DENEGADO).

**Prueba real de idempotencia:** el archivo editado corrió 2 VECES contra la
BD local con `ON_ERROR_STOP=1` → **0 errores SQL en ambas**; sólo NOTICE
benignos ("ya existe, omitiendo"); conteos de subcategorías 9/9 sin
duplicados y sub-consultas intactas de actividades/adjuntos (3/7).

**Conciliación de checksums:** `prisma migrate resolve --applied` para la
migración editada + `migrate status` = "Database schema is up to date!" +
`prisma validate` OK.

## Archivos tocados

- `apps/api/prisma/migrations/20261108153000_flujo_incidentes_v2/migration.sql`
  (rewritten but leche-guard-completo)

## Pruebas / verificación

- 2 corridas idempotentes contra BD real (0 errores, NOTICEs benignos).
- `prisma migrate status` = up to date; `prisma validate` = OK.

## Pendientes y riesgos

- **Sin push (orden del usuario)**: el commit queda local.
- El siguiente del plan es el fix del acento en
  `20261108221000_roles_tecnicos_descriptivos` ('Tecnico' vs 'Técnico') que
  usa `prisma migrate resolve` del mismo modo.
- Leapfrog del reviewer: "No corrí la integración contra Postgres ni lo
  vi en el navegador" — en el cierre del PR se correra `test:integration`
  completo + smoke del navegador.
