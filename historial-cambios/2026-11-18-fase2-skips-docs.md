# Fase 2: limpieza documental de los "skips"

**Fecha:** 2026-11-18
**Autor:** Agente (autorizado por el usuario al pedir "marca las anteriores
como completadas" antes de ejecutar la Fase 3)

## Contexto

El análisis del plan (`docs-planes/PLAN-CI-CD-ENDURECIMIENTO.md`) detectó que
`ci.yml` y `AGENTS.md` seguían afirmando que había 2 tests de cobranza en
`it.skip`, cuando los 1417 tests corren completos. La Fase 2 cierra esa deuda
documental. No se ejecutó antes de este cambio, por eso se hace ahora.

## Cambios realizados

- `.github/workflows/ci.yml`: el comment de cabecera ahora dice que Jest corre
  los 1417 tests sin skips y que la integración va en `integration.yml`
  (BD real + restore del dump).
- `AGENTS.md`: la fila de `ci.yml` en la tabla de workflows dice
  "(1417 tests, sin skips)" en lugar de "(2 tests de cobranza en `it.skip`)".
- Plan: Fase 2 marcada como ejecutada; brecha documental cerrada.
- `.opencode/agent/svr-erp.md` no se tocó: ya decía "1417 tests pasan sin
  `skip`".

## Cosas nuevas

- Ninguna. Solo se corrigieron comentarios y documentación.

## Archivos tocados

- `.github/workflows/ci.yml` (modificado)
- `AGENTS.md` (modificado)
- `docs-planes/PLAN-CI-CD-ENDURECIMIENTO.md` (modificado)
- `historial-cambios/2026-11-18-fase2-skips-docs.md` (creado)

## Pruebas / verificación

- Búsqueda de `it.skip|test.skip|describe.skip|xit|xdescribe` sobre todos los
  `*.spec.ts` de `apps/api/src`: **0 resultados**.
- Búsqueda de `it.skip` / "2 tests de cobranza" en `ci.yml`, `AGENTS.md` y
  `.opencode/agent/svr-erp.md`: **0 resultados**.
- `git diff --check`: sin errores.

## Pendientes y riesgos

- Ninguno: no se tocó código ejecutable. No se hizo push ni PR (no ordenado).
