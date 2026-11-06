# Sugerencias review PR #15 (C4) — trigger inmutable en proyectos, limpieza de scripts y body del PR regenerado

**Fecha:** 2026-11-06
**Autor:** agente OpenCode

## Cambios realizados
1. **Trigger inmutable probado también en proyectos** (sugerencia 5):
   `proyectos.integration.spec.ts` + `describe('REGISTRO_AUDITORIA —
   inmutabilidad real (trigger)')` — DELETE físico contra
   `registro_auditoria` rechazado por `trg_audit_immutable_delete` y el
   registro sobrevive (espejo del spec de reportes-campo). **10/10**
   tests de integración de proyectos con BD real.
2. **Limpieza de scripts one-off** (sugerencia 6): borrados 29 archivos de
   `apps/api/scripts` (`oscuro-fase1..9*`, `scan-soft50`, `check-dark-css`,
   `find-white-css`, `diag-400s`, `check-uuidver`, `close-tail`, `dbg-dto`,
   `depth-check`, `fix-dbg`, `fix-spec-2`, `fix-spec-tail`, `fix3-dtospec`,
   `fix3b`, `move-match`, `pr15-fix1/2/3`, `add-timestamptz-to-schema.ts`,
   `migrate-to-timestamptz.ts`) y la carpeta `qa/` vacía. **Quedan los
   reutilizables**: `audit-pagination.cjs`, `audit-ops-comercial.cjs` y
   los `seed-*.ts` (seeds de desarrollo). Sin referencias en configs
   (turbo.json / package.json verificados).
3. **Body del PR #15 regenerado** (sugerencia 7): la descripción anterior
   tenía TODOS los acentos corruptos a nivel byte (126 secuencias con
   `U+001C/FFFD` — irreconstruible mecánicamente), no solo "ya汽油"/
   "Usuario汞". Reescrito completo y limpio siguiendo
   `.github/PULL_REQUEST_TEMPLATE.md`, con los estados reales de hoy:
   recepción OC (real desde el bloqueador 1: specs 56/56 + integración
   8/8), trigger inmutable probado en ambos módulos, 1021 unitarios,
   migraciones idempotentes y limpieza de scripts.

## Pruebas / verificación
- Integración proyectos **10/10** (BD real) ✔ · suite completa
  **1021 passed / 2 fallidas** (históricas de cobranza) ✔.
- Body verificado: 0 caracteres corruptos, via API de GitHub antes y
  después; el dump por shell-redirect en ANSI fue la causa raíz del
  mojibake original (nota técnica para futuros `gh pr edit`).

## Archivos tocados
- `apps/api/src/proyectos/proyectos.integration.spec.ts`
- 29 archivos detrás de `apps/api/scripts/` (removidos)
- body del PR #15 via `gh pr edit` (no toca repo)

## Pendientes y riesgos
- `gh pr view -q .body > archivo` corrompe por la codificación de la
  redirección de PowerShell 5.1 — usar `-Encoding utf8` o node/fetch.
- El resto del body (checklists) ya refleja el estado real; si el
  reviewer cuestiona una caja específica, se ajusta de inmediato.
