# Push fase a (commit 2) — dump de integración regenerado con push_suscripciones

**Fecha:** 2026-11-20
**Autor:** agente

## Cambios realizados
- `apps/api/scripts/regenerar-dump-integracion.ps1`: **`push_suscripciones`**
  agregada a la lista de tablas con datos excluidos (sus efímeras de
  dispositivo, igual que `sessions`/`notificaciones`).
- **Dump `svr_erp_export/svr_erp_sin_postgis.sql` regenerado** (677 KB) con
  los pasos del script ejecutados a mano (pg_dump + anonimización) — el
  script oficial falla bajo PS 5.1 (ya documentado en 2026-11-19).

## Verificación / pruebas
- La tabla `push_suscripciones` **SÍ está en el dump** (17 menciones,
  CREATE TABLE presente) y **SIN `COPY` de datos** (excluida).
- Sin datos de `registro_auditoria`, con `idempotencia_key` y sin PostGIS ✓.
- **`migrate diff --from-config-datasource --exit-code` = 0** — el job
  `integration` de CI no fallará con la migración nueva.

## Archivos tocados
- `apps/api/scripts/regenerar-dump-integracion.ps1`
- `svr_erp_export/svr_erp_sin_postgis.sql` (regenerado)
- `historial-cambios/2026-11-20-push-fase-a-dump.md` (creado)

## Pendientes y riesgos
- El dump restaurado en CI no se probó de punta a punta en Postgres efímero
  (eso lo hará el job `integration` en el próximo PR o `workflow_dispatch`).
- Sin push: el commit queda local.
