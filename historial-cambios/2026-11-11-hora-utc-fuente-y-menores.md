# Bloque 8 + menores review PR#17: hora con ancla UTC (+ Intl fijo) y limpieza

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

### 1) `horaDelMomento()` — el bug de zona horaria que ya mordió antes
El patrón viejo construía la hora concatenando sobre `1970-01-01T…:00` SIN zona:
el parser resolvía según la TZ del runtime y — peor — la **tz database aplica los
offsets HISTÓRICOS de 1970 para America/Mexico_City (-07 en 1970, no el -06 vigente)**
→ las horas se desviaban caprichosamente ±1 h según el motor (verificado por
experimento con Prisma REAL: mismo patrón guardó 01:25/18:25 dependiendo de cómo
capturó el runtime; los rows históricos con hora==captura se debieron a corridas
con la zona -06 vigente).

- Ahora usa la fórmula **probada del repo** (`trabajadores.horaAUtc`): la pared
  del reloj se lee con `Intl.DateTimeFormat(..., { timeZone: 'America/Mexico_City' })`
  (anclada EXPLÍCITA — independiente de la TZ del host) y se guarda como
  `new Date(Date.UTC(1970, 0, 1, hh, mm, ss))` — la pared queda como parts UTC.
- El driver adapter-pg ya mapea `1970-01-01T18:25Z` → `18:25:00` (verificado con
  experimento integration real contra la BD: `[epoch 18:25Z] → almacenado:
  18:25:00`).
- El serialize ya NO usa `toTimeString()` (local, TZ-dependiente); ahora
  `hora.toISOString().slice(11, 16)` — TZ-independiente (CCO con el ancla UTC).
- **Tests de frontera:** 23:59 → `23:59:00Z`; 00:00 exacta (nunca cruza de día ni
  arrastra offsets históricos); capturas CST vs UTC equivalen a la misma pared;
  serialize '18:25' con ancla UTC.

### 2) Residuo del bloque 6 — drift de la BD local (auto-confesado)
Las corridas manuales de la migración 153000 (para su prueba idempotente)
**dropearon columnas** que una migración POSTERIOR (20261108200000) ya había
re-creado — el `DROP COLUMN IF EXISTS` SÍ es idempotente pero no distingue
"las columnas fueron recobradas más tarde" (por eso los writes de la suite
integration empezaron a fallar con el error esquivo `(not available)`).

Reparación:
- **Migración `20261111103000_reparar_drift_bloque6`**: re-crea
  `reportes_campo.proyecto_id` + FK a proyectos (SET NULL/CASCADE) + índice
  — idempotente con nodas `IF NOT EXISTS` / chequeo de `pg_constraint`.
- **Blindaje estructural en 153000**: los `DROP COLUMN` (cliente_id /
  proyecto_id / monto_servicio) SOLO corren si el tipo viejo
  `EstadoReporteCampoOld` aún existe (primer pasito del flujo) — en
  re-corridas, tras migraciones posteriores, ya no tocan nada. Con esto el
  caso "re-corrida parcial" queda cerrado de la forma más razonable sin
  rediseñar el orden de migraciones.
- Suite integration: **33/33** de nuevo (verificada y pasando tras la
  reparación).

### 3) Menores
- Comment corrupto en `reportes/page.tsx` (1396) → texto limpio en español.
- `apps/web/.turbo/` agregado a `.gitignore` y `turbo-lint.log` fuera del repo
  (`git rm --cached`).
- `apps/api/scripts/rotate-jwt-secrets.js` **eliminado** (dev-one-off con ruta
  del equipo e impresión de prefijos de secretos — la review lo señala).

## Archivos tocados

- `apps/api/src/reportes-campo/reportes-campo.service.ts`
  (horaDelMomento + serialize de hora)
- `apps/api/src/reportes-campo/reportes-campo.service.spec.ts` (5 tests de frontera)
- `apps/api/prisma/migrations/20261108153000_flujo_incidentes_v2/migration.sql`
  (DROP COLUMN condicionales al flujo v1)
- `apps/api/prisma/migrations/20261111103000_reparar_drift_bloque6/migration.sql` (nueva)
- `apps/web/src/app/(dashboard)/reportes/page.tsx` (comment limpio)
- `.gitignore` + `apps/api/scripts/rotate-jwt-secrets.js` (eliminado)

## Pruebas / verificación

- Unit reportes-campo: **103/103** (98 previos + 5 nuevos de frontera).
- Integración real: **33/33** (la BD quedó reparada; los writes vuelven a pasar).
- Experimento real del driver: `[epoch 18:25Z] → almacenado 18:25:00` y
  `[string sin Z] → almacenado 01:25:00` (justifica el ancla UTC).
- `tsc` API + web ✅.

## Pendientes y riesgos

- **Sin push (orden del usuario)** — commit local.
- El borde global del DataTable (opción de variante) sigue ABIERTO — la
  decisión fue pendiente del usuario; el rest de lesser items (doc
  retroactivo de commits sin registro) también.
- Los rows históricos (pre-fix) con hora mann lean via toISOString — p.ej.
  INC0057 (captura 00:41) tiene la hora guardada como 00:41 (la fila view
  concuerda); las corridas nuevas anclan UTC y su lectura sale igual. La
  revisión histórica de la data no fue requerida (los almacenados antiguos
  parecen consistentes — se verificó contra `creado_en`).
