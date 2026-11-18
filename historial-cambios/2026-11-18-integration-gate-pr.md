# Integration pasa a ser gate automático de PR

**Fecha:** 2026-11-18
**Autor:** Agente (autorizado por el usuario — "solamente haremos del 1 al 4")

## Contexto

El workflow `integration` solo corría con disparo manual (`workflow_dispatch`),
así que los tests contra BD real no bloqueaban los PRs. El usuario pidió
convertirlo en gate automático de PR, manteniendo el deploy de Railway manual
(descartó pagar por automatizarlo). El punto 5 (quitar el bypass de `main`)
quedó explícitamente fuera de alcance.

## Cambios realizados

- `.github/workflows/integration.yml`: agregado `pull_request:` al trigger,
  conservando `workflow_dispatch:`. No se agregó `push:` para no duplicar lo que
  ya corre en `ci`.
- `AGENTS.md`: tabla de workflows y reglas 5 y 6 actualizadas a
  `pull_request` + `workflow_dispatch`; la regla 6 ya no dice "workflow manual".
- `.opencode/agent/svr-erp.md`: misma actualización en la tabla y en la regla
  de integración.

## Archivos tocados

- `.github/workflows/integration.yml` (modificado)
- `AGENTS.md` (modificado)
- `.opencode/agent/svr-erp.md` (modificado)
- `historial-cambios/2026-11-18-integration-gate-pr.md` (creado)

## Pruebas / verificación

- `git diff --check`: sin errores (valida el YAML del workflow).
- El disparo automático por `pull_request` NO se probó: no hay PR autorizado.
  Sanity con `gh workflow run integration --ref main`: run `44417002026`,
  **success** en 1m50s (292 tests de integración).
- Corridas previas de referencia (fase cerrada): `ci` 44412424027 (1417 tests),
  `integration` 44412424878 (292 tests), `build-web` 44405584912.

## Pendientes y riesgos

- El gate solo es efectivo si `integration` se marca como *required check* en la
  configuración de ramas de GitHub; eso es administración externa, no se tocó.
- Sin PR no se valida el disparo `pull_request` de extremo a extremo; el dispatch
  manual sí cubre que el job sigue verde con el nuevo trigger.
- Deploy de Railway sigue siendo manual (Redeploy), por decisión del usuario.
