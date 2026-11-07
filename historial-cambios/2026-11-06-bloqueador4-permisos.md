# Bloqueador 4 del review PR #15 (parte B) — remover migraciones de permisos que se cancelan

**Fecha:** 2026-11-06
**Autor:** agente OpenCode

## Cambios realizados
Remedio #1 exacto del review ("quitar las dos migraciones, o comprobar
SELECT count(*) FROM permisos en el servidor antes de aplicarlas"):

1. `git rm -r` de:
   - `apps/api/prisma/migrations/20261104002000_drop_permisos_fantasma/`
   - `apps/api/prisma/migrations/20261104002100_restore_permisos/`
   Las dos se cancelan entre sí ( efecto neto: dropear la tabla `permisos`
   del servidor y recrearla VACÍA — si el server tiene solicitudes de
   vacaciones/incapacidad, se pierden). Al removerlas del directorio,
   `migrate deploy` en el servidor no tocará la tabla `permisos` de
   producción y sus datos quedan intactos.
2. **BD local**: `DELETE FROM _prisma_migrations WHERE migration_name IN
   ('20261104002000_drop_permisos_fantasma','20261104002100_restore_permisos');`
   (las filas de los resolve previos — la tabla física `permisos` local
   queda restaurada/igual que schema.prisma, y ya no hay registro de esas
   migraciones en el historial local).

## Archivos tocados
- 2 carpetas de migración removidas del directorio `prisma/migrations/`
- BD local `svr_erp`: 2 filas borradas de `_prisma_migrations` (operación de entorno, no de repo)

## Pruebas / verificación
- `npx prisma migrate status`: 56 migraciones, "Database schema is up to date!" ✔
- Drift BD↔schema (`migrate diff --from-config-datasource`): vacío (exit 0) ✔
- Nota: `migrate diff --from-migrations` NO es usable en este repo (baseline
  reconstruido sin init: seed_rbac no encuentra `roles`) — verificación vía
  DB↔schema, como se indica en la documentación del baseline.

## Pendientes y riesgos
- Si el servidor YA aplicó ambas migraciones antes de este PR (deploy
  intermedio), removelsing las filas de ambas migraciones de su
  `_prisma_migrations`analytics también — sino, aceptar que su tabla está
  restaurada vacía.
- Pendientes y riesgos: en el servidor puede haber versión intermedia de
  migraciones ya aplicadas; el registro debe reconciliarse manualmente con
  `prisma migrate resolve` o DELETE si ya corrieron.
