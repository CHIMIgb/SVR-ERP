# Fase 6: cierre de detalles de CI/CD

**Fecha:** 2026-11-18
**Autor:** Agente (Fase 6 autorizada por el usuario como última del plan de
endurecimiento)

## Contexto

Última fase del `PLAN-CI-CD-ENDURECIMIENTO.md`: alinear `integration.yml` con
`ci.yml` en disparadores y concurrencia, e investigar el aviso del worker de
Jest al terminar los tests de integración.

## Cambios realizados

- `.github/workflows/integration.yml`:
  - `pull_request` pasa a `branches: [main]` (antes se disparaba en cualquier
    rama de una PR).
  - Nuevo bloque `concurrency` con
    `group: integration-${{ github.workflow }}-${{ github.ref }}` y
    `cancel-in-progress: true`, mismo patrón que `ci.yml`. Así un push rápido
    cancela el run anterior en vez de acumularlo.
- `apps/api/jest.integration.config.js`: **sin cambios**. Investigado el aviso
  `worker process failed to exit gracefully` / `Force exiting Jest: ...`:
  - `--detectOpenHandles --runInBand` sobre `gps.integration.spec.ts`: 0
    handles abiertos, 13/13 tests.
  - El mensaje `Force exiting Jest` aparece igual con y sin `--runInBand`:
    lo emite incondicionalmente `forceExit: true`, no un handle sin cerrar.
  - Los 26 specs comparten una sola BD, así que `maxWorkers: 1` es
    obligatorio. Quitar `forceExit` para silenciar el aviso podría colgar un
    run si apareciera un handle real. No hay fix pequeño y seguro: se
    documenta el ruido, como preveía el plan.
- Documentación de estado actualizada (no registros históricos): `AGENTS.md`,
  `.opencode/agent/svr-erp.md` y el plan, con Fase 6 ejecutada, brechas B8/B9
  cerradas y el plan completo marcado como terminado.

## Cosas nuevas

- PRs rápidos sobre `main` cancelan el run de integración anterior en vez de
  dejar varios corriendo a la vez.

## Archivos tocados

- `.github/workflows/integration.yml` (modificado)
- `AGENTS.md` (modificado)
- `.opencode/agent/svr-erp.md` (modificado)
- `docs-planes/PLAN-CI-CD-ENDURECIMIENTO.md` (modificado)
- `historial-cambios/2026-11-18-fase6-concurrencia-integration.md` (creado)

## Pruebas / verificación

- YAML de `integration.yml` parseado con `js-yaml`:
  `pull_request={"branches":["main"]}`,
  `concurrency={"group":"integration-...","cancel-in-progress":true}`.
- `git diff --check`: exit 0.
- `npm run test:integration` (Fase 5, dump anonimizado): 26 suites, 292/292,
  exit 0. El aviso de Jest es ruido, no fallo.
- No se corrió el workflow en GitHub: el cambio está local y no hay push
  autorizado.

## Pendientes y riesgos

- Falta verificación remota de todo el plan (Fases 4, 5 y 6): los jobs `web`,
  `api` e `integration` con las versiones nuevas no se corrieron. Un dispatch
  con `--ref main` ejecutaría la versión anterior; hay que hacer push primero.
- Check `api` rojo en `main` (run `44422735359`): 2 tests de
  `ventas.service.spec.ts` dependen del turno. No fue causado por este plan y
  no hay autorización para arreglarlo.
- El aviso de salida de Jest sigue apareciendo en cada run de integración; es
  cosmético y está documentado.
- No se hizo push ni PR (no ordenados).
