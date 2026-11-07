# PR #15 — comentario de cierre C1–C4 (sugerencias reabiertas)

**Fecha:** 2026-11-06
**Autor:** agente OpenCode

## Cambios realizados
Push `21aa4e5c..00e6b6f2` con 5 commits:
- C1 `fix(api)`: reportes-campo — guard RESPONSABLE_REQUERIDO + carreras con updateMany + previousValue en asignar. (requiere revisar hash exacto con git log)
- C2 `fix(web)`: Topbar `/reportes` (1 línea).
- C3 `chore(db)`: 3 migraciones idempotentes (sandbox re-run 0 errores).
- C4 `test(api, chore)`: trigger inmutable en proyectos (10/10) + limpieza 29 scripts one-off.
- Registro C4.

Comentario de cierre en el PR:
https://github.com/CHIMIgb/SVR-ERP/pull/15#issuecomment-6696533897

## Pruebas / verificación
- Unitarios 1021 passed / 2 fallidas históricas (cobranza fecha) — sin regresión.
- Integración BD real: reportes-campo 16/16, proyectos 10/10.
- `tsc` verde en web y api.

## Pendientes y riesgos
- Los hashes exactos de commits están en `git log`; el comentario usa el
  rango general `21aa4e5c..00e6b6f2`.
- Body del PR regenerado (ver `2026-11-06-c4-trigger-scripts-body.md`).
- El front de reportes no tiene mensaje específico para 409
  CONFLICTO_CONCURRENCIA — cae al toast genérico.
