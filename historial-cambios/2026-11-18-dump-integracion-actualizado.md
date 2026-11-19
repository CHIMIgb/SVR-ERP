# Regenerar el dump de integración desde la BD al día

**Fecha:** 2026-11-18
**Autor:** Agente (autorizado por el usuario — "Arreglarlo completo")

## Contexto

`svr_erp_export/svr_erp_sin_postgis.sql` restauraba un esquema del 20-ago con
8 migraciones, mientras el cliente Prisma generado corresponde al esquema actual
(100+ migraciones). El workflow `integration` restauraba ese dump y los tests
consultaban columnas/enums que aún no existían (`temperatura_motor`,
`trabajadores.usuario_id`, `facturas.cotizacion_id`, `AuditAction.FACTURA_CREADA`).
`migrate deploy` sobre el dump viejo se detiene en
`20261108200000_reporte_ubicacion_proyecto_gps` con `P3018 / ya existe la columna
proyecto_id` (historial reconstruido). No se usó `db push --accept-data-loss`:
además de estar bloqueado para agentes, es destructivo.

## Cambios realizados

- Regenerar el dump desde `svr_erp` (BD local al día, `migrate status` → "up to
  date", sin PostGIS ni columnas de geometría).
- Excluir los datos de tablas efímeras o sensibles, conservando esquema y datos
  semilla: `registro_auditoria`, `sessions`, `refresh_tokens`,
  `token_blacklist`, `intentos_login`, `usuarios_bloqueados`, `notificaciones`,
  `notificaciones_lecturas`, `reportes_adjuntos`. Los specs crean sus propios
  registros en esas tablas; el trigger de inmutabilidad de `registro_auditoria`
  viene en el esquema y sigue probándose.
- El dump pasa de 230 KB (viejo, esquema desactualizado) a 660 KB con el
  esquema vigente. `integration.yml` no cambió: sigue restaurando este mismo
  archivo y corriendo `npm run test:integration`.

## Archivos tocados

- `svr_erp_export/svr_erp_sin_postgis.sql` (reemplazado)
- `historial-cambios/2026-11-18-dump-integracion-actualizado.md` (creado)

## Pruebas / verificación

- Restaurado con `psql -v ON_ERROR_STOP=1` en BD efímera: sin errores (la
  primera versión sin excluir `notificaciones_lecturas` rompía FK; corregida).
- Sin sentencias `COPY` de las tablas sensibles listadas arriba; sin PostGIS.
- `npm run test:integration` contra esa BD efímera: **26 suites, 292 tests
  pasados** en ~90 s.
- `git diff --check`: sin errores.

## Pendientes y riesgos

- Falta el veredicto del workflow `integration` en GitHub; se registra aparte.
- El dump incluye datos de negocio de la BD de desarrollo (clientes, usuarios,
  proyectos con nombres reales de demo). Es el mismo tipo de contenido que ya
  tenía el dump anterior; si el repo se vuelve público habría que anonimizarlos.
- El historial de `_prisma_migrations` del dump no coincide con el disco, pero
  el workflow no ejecuta migraciones: restaura el esquema final tal cual.
