# PR #15 — push re-revisión + comentario de cierre

**Fecha:** 2026-11-06
**Autor:** agente OpenCode

## Cambios realizados
- Push `a562cd0e..eefa6630` (3 commits: `3fe07c81` bloqueador RBAC bool_or,
  `50581fe2` scripts de main restaurados + carreras de asignación,
  `eefa6630` registro de verificación ON CONFLICT en BD real).
- Comentario de cierre publicado con qué/dónde/cómo/porqué de los 3 items:
  https://github.com/CHIMIgb/SVR-ERP/pull/15#issuecomment-6702251411

## Verificación
- Sandbox con el archivo real (sección extraída por bytes): 3 roles
  (Operador conserva crear, RRHH no gana, admin intacto, idempotente).
- BD real `svr_erp`: ON CONFLICT DO UPDATE validado en transacción con
  probe + ROLLBACK (OR-merge, BD intacta).

## Pendientes y riesgos
- Re-review final del reviewer → aprobar/merge.
- Pre-flight #3 en el servidor post-deploy (queda en el header del SQL).
