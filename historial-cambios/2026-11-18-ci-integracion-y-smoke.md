# CI/CD: workflow de integración y smoke del contenedor

**Fecha:** 2026-11-18
**Autor:** Agente (autorizado por el usuario — Fase 1 + 2 del plan de corrección)

## Contexto

El CI cubría compilación y unitarios, pero los tests de integración (los únicos
que tocan BD real, transacciones y `registro_auditoria`) no corrían en ningún
lado automatizado. Además, `build-web` publicaba la imagen sin verificar que el
contenedor arrancara: el build ocurre en 7 GB de GitHub y el runtime en 1 GB de
Railway. El usuario autorizó crear el workflow de integración y el smoke.

## Cambios realizados

- `.github/workflows/integration.yml` (nuevo): `workflow_dispatch`, service
  `postgres:18` con health check, `npm ci` + `npx prisma generate` en `apps/api`,
  restore de `svr_erp_export/svr_erp_sin_postgis.sql` (0.22 MB, sin PostGIS)
  con `psql -v ON_ERROR_STOP=1`, y `npm run test:integration`. No corre
  `migrate deploy`: el historial de migraciones fue baselined y desde cero no
  crea las tablas base.
- `.github/workflows/build-web.yml`: step de smoke después del push, que
  arranca la imagen en el puerto 3000, hace `curl -fsSL` con 20 reintentos,
  volcando `docker logs` si falla y borrando el contenedor siempre.
- `AGENTS.md` y `.opencode/agent/svr-erp.md`: inventario actualizado con el
  tercer workflow y documentación de integración y smoke.

## Archivos tocados

- `.github/workflows/integration.yml` (creado)
- `.github/workflows/build-web.yml` (modificado)
- `AGENTS.md` (modificado)
- `.opencode/agent/svr-erp.md` (modificado)
- `historial-cambios/2026-11-18-ci-integracion-y-smoke.md` (creado)

## Pruebas / verificación

- Sintaxis YAML de los 3 workflows validada con `js-yaml`.
- `git diff --check`: limpio.
- Sin push ni corrida real: el usuario pidió dejarlo en commit local.

## Pendientes y riesgos

- El smoke corre **después** del push: detecta un contenedor que no arranca,
  pero no impide publicar la imagen. Cambiar el orden exige build local →
  smoke → push, más cambio del que vale hoy.
- `integration.yml` es manual (`workflow_dispatch`); no es gate de PR todavía.
- Los runners de GitHub traen `psql`; si esa imagen cambiara, habría que
  instalar `postgresql-client` explícitamente.
- El dump incluye datos de prueba y se restaura en un runner efímero; no
  contamina la BD local. `registro_auditoria` queda intacto (inmutable).
- Fase 3 (trazabilidad SHA/digest) quedó registrada en
  `2026-11-18-trazabilidad-deploy.md`. Fase 4 cerrada: tests reactivados,
  actions actualizadas y lint dejado como deuda por decisión del usuario
  (`2026-11-18-cierre-fase4-lint-deuda.md`).
