# Secretos JWT dummy de integración movidos al workflow

**Fecha:** 2026-11-18
**Autor:** Agente (autorizado por el usuario — pasos 2-4 de 4)

## Contexto

`jest.integration.config.js` asignaba `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET`
con valores dummy para que `JwtStrategy` pudiera inicializarse en CI (donde no
hay `.env`). Eso mezclaba configuración de entorno con configuración de Jest y
había quedado como parche tras la corrida fallida `44411690109`. El punto 2 del
plan acordado mueve esos valores al `env:` del workflow, junto a
`DATABASE_URL`/`TZ`/`TIMEZONE`.

## Cambios realizados

- `apps/api/jest.integration.config.js`: borradas las dos asignaciones
  `process.env.JWT_* ||= ...` y su comentario. Siguen `require('dotenv').config()`,
  `setupFiles: ['dotenv/config']`, `maxWorkers: 1`, `testTimeout` y `forceExit`.
- `.github/workflows/integration.yml`: agregados `JWT_ACCESS_SECRET` y
  `JWT_REFRESH_SECRET` con valores dummy al `env:` del job (nunca secretos
  reales ni de despliegue).
- `AGENTS.md` y `.opencode/agent/svr-erp.md`: nota en la regla de integración
  indicando que los secrets dummy viven en el `env:` del workflow, no en el
  config de Jest.

## Archivos tocados

- `apps/api/jest.integration.config.js` (modificado)
- `.github/workflows/integration.yml` (modificado)
- `AGENTS.md` (modificado)
- `.opencode/agent/svr-erp.md` (modificado)
- `historial-cambios/2026-11-18-integration-secretos-workflow.md` (creado)

## Pruebas / verificación

- `git diff --check`: sin errores (validación del YAML del workflow).
- Dispatch de sanity del punto 1 (trigger `pull_request` ya en `main`): run
  `44417002026`, **success** en 1m50s con los 292 tests de integración.
- El dispatch de verificación de este punto se lanza tras el push y se anota su
  run ID al cierre de la fase.

## Pendientes y riesgos

- Si el `env:` del workflow queda mal indentado, `JwtStrategy` vuelve a fallar
  con el mismo error de `44411690109`; el dispatch posterior lo detecta.
- En local los tests siguen leyendo los secretos del `.env` de `apps/api`:
  no se requiere ningún cambio para `npm run test:integration`.
- El gate de `pull_request` sigue sin probarse de extremo a extremo (no hay PR
  autorizado); `integration` aún debe marcarse como *required check* en GitHub.
