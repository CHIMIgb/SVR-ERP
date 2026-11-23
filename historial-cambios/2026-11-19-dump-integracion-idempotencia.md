# Regeneración del dump de integración con idempotencia_key

**Fecha:** 2026-11-19
**Autor:** agente
**Contexto:** deuda registrada en `historial-cambios/2026-11-18-pwa-idempotencia-reportes-api.md` — el dump `svr_erp_export/svr_erp_sin_postgis.sql` no incluía la columna `idempotencia_key` y el job `integration` de CI fallaría el `migrate diff` en el próximo PR a `main`.

## Cambios realizados
- Dump regenerado desde `svr_erp` (PostgreSQL 18 local, 102 migraciones al día) con las exclusiones y anonimización del estándar del repo:
  - `pg_dump --no-owner --no-privileges` + `--exclude-table-data` de las 9 tablas efímeras (`registro_auditoria`, `sessions`, `refresh_tokens`, `token_blacklist`, `intentos_login`, `usuarios_bloqueados`, `notificaciones`, `notificaciones_lecturas`, `reportes_adjuntos`).
  - `node apps/api/scripts/anonimizar-dump.cjs` sobre el dump (emails, teléfonos, nombres y textos de negocio anonimizados).
- Validaciones del propio script, ejecutadas a mano:
  - `idempotencia_key` presente en el dump ✓
  - Sin `COPY` de datos para las tablas excluidas ✓
  - Sin `CREATE EXTENSION ... postgis` ✓
- Verificación de CI: `npx prisma migrate diff --from-config-datasource --to-schema=prisma/schema.prisma --exit-code` → **0** (diff vacío; el schema de la BD coincide con `schema.prisma`). El próximo PR con la migración de idempotencia nace verde en el check `integration`.

## Archivos tocados
- `svr_erp_export/svr_erp_sin_postgis.sql` (regenerado, 673 KB)
- `historial-cambios/2026-11-19-dump-integracion-idempotencia.md` (creado)

## Verificación / pruebas
- `npx prisma migrate status`: 102 migraciones, "Database schema is up to date!".
- Validaciones del dump listadas arriba, todas en verde.

## Pendientes y riesgos
- **El script `regenerar-dump-integracion.ps1` falló bajo Windows PowerShell 5.1** (el equipo no tiene `pwsh`/PowerShell 7): `pg_dump` salió con código 1 dentro del script pero corrió bien a mano con los mismos argumentos. Las diferencias de entorno entre la sesión madre y el hijo de `-File` no se diagnosticaron a fondo; los pasos equivalentes se ejecutaron manualmente y quedaron validados. Si se vuelve a regenerar, usar `pwsh` o repetir el procedimiento manual.
- El dump restaurado en CI no se probó de punta a punta en un Postgres efímero local (eso lo hará el job `integration` en el próximo PR o un `workflow_dispatch`).
- Sin push: el commit queda local, como indica la regla del repo.
