# Fase 3: trazabilidad del deploy manual

**Fecha:** 2026-11-18
**Autor:** Agente (autorizado por el usuario — Fase 3 del plan de corrección)

## Contexto

El servicio de Railway apunta al tag mutable `:latest`, así que após dos pushes
seguidos quien aprieta Redeploy no sabe qué commit está jalando. El tag por SHA
existe en GHCR pero Railway no lo usa, y crear un token para automatizarlo sigue
siendo imposible en el plan gratuito. La corrección acordada es disciplina, no
código.

## Cambios realizados

- `AGENTS.md` y `.opencode/agent/svr-erp.md`: nueva regla de procedimiento — en
  cada Redeploy manual se anota en `historial-cambios/` el SHA y el digest que
  imprimió `build-web` (ej. `:57e35d84…`, `sha256:6dcd42b…`), para saber qué
  versión hay en producción.

## Archivos tocados

- `AGENTS.md` (modificado)
- `.opencode/agent/svr-erp.md` (modificado)
- `historial-cambios/2026-11-18-trazabilidad-deploy.md` (creado)

## Pruebas / verificación

- Solo documentación; no hay código ni workflows que ejecutar.
- `git diff --check`: limpio.

## Pendientes y riesgos

- La trazabilidad depende de que la persona que haga el Redeploy escriba el
  registro; no hay mecanismo automático.
- Fase 4 sigue en curso: reactivación de 2 tests, actions y lint.
