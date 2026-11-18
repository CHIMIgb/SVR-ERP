# CI: integrar los tests unitarios de la API

**Fecha:** 2026-11-18
**Autor:** Agente (autorizado por el usuario — se omiten los tests que fallan)

## Contexto

Hasta hoy `ci.yml` corría solo `tsc`, `nest build` y `prisma validate`. Los
unitarios de la API existen (`npm run test`, Jest + `@nestjs/testing`) pero no
eran gate: 2 de 1417 fallan por fechas fijas en el mock compartido de cobranza
(`2026-09-01` ya clasifica como `ATRASO_GRAVE` y los tests esperan
`AL_CORRIENTE` / un CSV sin ese estado). El usuario pidió integrarlos ahora y
arreglar esos 2 después. Los tests de integración quedan fuera: requieren la BD
restaurada de `svr_erp_export/` y `registro_auditoria` es inmutable.

## Cambios realizados

- `apps/api/src/cobranza/cobranza.service.spec.ts`: los 2 tests afectados pasan
  a `it.skip` con un comentario `shortcut:` que explica cuándo reactivarlos:
  - `findAll > devuelve items paginados y aplica filtros`
  - `exportar > genera CSV con BOM y encabezados`
- `.github/workflows/ci.yml`: nuevo paso `npm run test -- --runInBand` al final
  del job `api` (`--runInBand` evita workers que consumen memoria en el runner).
  Actualizado el comentario de cabecera.
- `AGENTS.md` y `.opencode/agent/svr-erp.md`: documentado que Jest ya corre en
  CI con 2 tests omitidos; lint sigue fuera y la integración sigue fuera.

## Archivos tocados

- `apps/api/src/cobranza/cobranza.service.spec.ts` (modificado)
- `.github/workflows/ci.yml` (modificado)
- `AGENTS.md` (modificado)
- `.opencode/agent/svr-erp.md` (modificado)
- `historial-cambios/2026-11-18-ci-tests-unitarios.md` (creado)

## Pruebas / verificación

- `npm run test -- --runInBand` en `apps/api` al integrarlos: **1415 passed,
  2 skipped, 1417 total** (antes: 1415 passed, 2 failed). Los 2 tests se
  reactivaron el mismo día; ver `2026-11-18-reactivar-tests-cobranza.md`.
- Estructura YAML de `ci.yml` validada con `js-yaml` + aserción de pasos.
- `git diff --check`: limpio.
- Sin push ni corrida en GitHub: el usuario eligió dejar el commit local.

## Pendientes y riesgos

- Reactivar los 2 `it.skip` cuando las fechas del mock de cobranza sean
  relativas a hoy (o se fije el reloj con `jest.useFakeTimers()`).
- `npm run lint` (21 errores) sigue fuera del CI.
- Los tests de integración (`npm run test:integration`) siguen sin correr en
  CI y se ejecutan solo en local con la BD restaurada.
- El job `api` pasa de ~50s a ~1.5 min por la suite de Jest.
