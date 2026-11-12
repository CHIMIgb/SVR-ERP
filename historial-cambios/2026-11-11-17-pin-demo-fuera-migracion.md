# 2026-11-11 — Fix review PR #18 #1: PIN demo fuera de la migración

## Problema (review del PR #18, bloqueante 1)

La migración `20261111150000_pwa_seed_identidad_demo` asignaba un **PIN de
desarrollo público** (`SVR26DEM`, documentado en el README de un repo
público) al admin demo y a todo usuario con número de empleado y sin PIN.
Como `migrate deploy` la ejecuta en cualquier BD, ese administrador quedaba
accesible por `POST /api/auth/login-pin` con una credencial leíble por
cualquiera.

## Cambios

- **`apps/api/prisma/migrations/20261111150000_pwa_seed_identidad_demo/migration.sql`**
  — retirado el bloque `UPDATE ... pin_hash`. La migración se queda solo con
  los `numero_empleado` (sin `pin_hash` no dan acceso a login-pin y son los
  ejemplos del spec §6.4).
- **`apps/api/prisma/demo-seed-pin.sql` (nuevo)** — seed manual solo-dev con
  el mismo mecanismo del `demo-seed.sql` del PR #17: el **hash bcrypt llega
  por variable psql** (`-v pin_hash='<hash>'`), el valor en claro nunca se
  escribe en el repo. Costo 12 (igual que `PinService.SALT_ROUNDS`).
  Mejora sobre la versión original: filtra `activo = true AND eliminado_en
  IS NULL` (la anterior pegaba PIN también a usuarios inactivos de tests).
- **`README.md`** — fuera la tabla de números + PIN `SVR26DEM`; en su lugar
  los comandos del script manual (generar hash → psql con variable → login).
- **`pwa-docs/checklist-smoke-paso7.md`** — redactados el PIN demo
  (`SVR26DEM`) y el temporal real que quedó documentado (`7KPDR3BA`, ya
  roitado pero era un patrón de credencial en texto plano en el repo).

## Verificación / pruebas

- `psql` contra la BD local (la migración ya estaba aplicada del 10-nov):
  el script corre con `UPDATE 0` (idempotente — los demo activos ya tienen
  PIN, los inactivos quedan excluidos por el guard nuevo).
- Incidente durante la prueba y reparado: la primera corrida se hizo con la
  variable vacía (bcryptjs no resuelve desde la raíz del repo, hay que
  `cd apps/api`) y marcó `UPDATE 2` sobre 2 basuras de tests de integración
  (`inttest-*`, `activo = false`, `pin_hash` NULL → `''`). Se restauraron a
  `NULL` (`UPDATE users SET pin_hash = NULL WHERE pin_hash = ''`, verificado
  0 filas con `pin_hash = ''`). Ese accidente es lo que motivó el guard
  `activo = true`.
- La BD local conserva los PINs demo que le puso la migración original — el
  dev local no pierde nada.

## Pendientes / riesgos

- **Checksum de migración:** la migración ya aplicada en local fue editada;
  si `prisma migrate dev` llega a marcar drift de checksum en esta BD, es
  esto (no cambia el schema). En BDs nuevas y en el merge del PR no hay
  problema — `migrate deploy` no re-verifica checksums de migraciones ya
  aplicadas y en BDs nuevas corre la versión corregida.
- Los registros históricos de `historial-cambios/` siguen mencionando el
  PIN `SVR26DEM` (son bitácora fechada, no se reescriben). Con este fix el
  valor ya no tiene efecto en ninguna BD nueva: el PIN lo elige cada dev al
  correr el script.
- No verificado end-to-end el login-pin con un PIN asignado por el script
  (requeriría pisar el PIN de un demo activo en la BD local); el mecanismo
  psql + bcrypt cost 12 es idéntico al que ya usa `PinService`.
