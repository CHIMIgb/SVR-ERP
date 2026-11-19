# Análisis y plan de endurecimiento del CI/CD

**Fecha:** 2026-11-18
**Autor:** Agente (análisis y plan solicitados por el usuario)

## Cambios realizados

- Creado `docs-planes/PLAN-CI-CD-ENDURECIMIENTO.md` con el análisis definitivo
  del CI/CD y un plan por fases (0 a 6), criterio de terminado y riesgos
  residuales. Es un documento de planeación: **no se ejecutó ninguna fase**.
- El análisis se basó en verificación real, no en memoria: contenido de los 3
  workflows, el ruleset `Protección main` (id `21267691`), sus reglas y
  `bypass_actors`, búsqueda de tests en skip sobre `apps/api/src` y de
  geometrías en `schema.prisma`.
- **Decisión del usuario respetada:** el `bypass_always` de `CHIMIgb` NO se
  quita, NO se limita y NO se propone alternativa. El plan lo registra como
  riesgo aceptado (§5) y la Fase 0 solo agrega `required_status_checks`.
- Corrección del análisis previo: no hay tests en `it.skip`; los 1417 tests
  corren completos. El comment de `ci.yml` y la referencia en `AGENTS.md` son
  deuda documental (Fase 2 del plan), no deuda de tests.

## Cosas nuevas

- `docs-planes/PLAN-CI-CD-ENDURECIMIENTO.md` (creado)
- `historial-cambios/2026-11-18-plan-cicd-endurecimiento.md` (creado)

## Archivos tocados

- `docs-planes/PLAN-CI-CD-ENDURECIMIENTO.md` (creado)
- `historial-cambios/2026-11-18-plan-cicd-endurecimiento.md` (creado)

## Pruebas / verificación

- `git diff --check`: sin errores.
- Verificaciones de lectura ya ejecutadas: `gh api` del ruleset (sin
  `required_status_checks`, bypass `always` de `CHIMIgb`), `Select-String`
  sobre los `*.spec.ts` (0 skips) y sobre `schema.prisma` (0 geometrías).
- Ninguna fase del plan fue ejecutada: no se tocó GitHub, workflows ni código.

## Pendientes y riesgos

- El plan está a la espera de autorización para ejecutar cada fase. La Fase 0
  requiere autorización explícita adicional por ser administración de GitHub.
- El bypass `always` se mantiene por decisión del usuario: los required checks
  protegerán los PR de los demás actores, pero el owner podrá seguir haciendo
  push directo a `main` sin pasar por los gates.
- No se hizo push de este commit: el usuario no lo ordenó.
