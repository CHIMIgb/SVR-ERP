# Fase 4b: actualizar versiones de GitHub Actions

**Fecha:** 2026-11-18
**Autor:** Agente (autorizado por el usuario — Fase 4 del plan de corrección)

## Contexto

Los workflows usaban `actions/checkout@v4` y `actions/setup-node@v4`, que
GitHub ejecuta forzados sobre Node 24 y avisaba como deprecados. Las actions de
Docker también estaban desactualizadas (v3/v6). Se consultaron los tags reales
con `gh api repos/<owner>/<repo>/tags` para no inventar números de versión.

## Cambios realizados

- `.github/workflows/ci.yml` e `integration.yml`: `actions/checkout@v7.0.1`,
  `actions/setup-node@v7.1.0`.
- `.github/workflows/build-web.yml`: `actions/checkout@v7.0.1`,
  `docker/setup-buildx-action@v4.4.1`, `docker/login-action@v4.8.0`,
  `docker/build-push-action@v7.4.0`.
- `AGENTS.md` y `.opencode/agent/svr-erp.md`: documentado cómo consultar las
  versiones y que el runner sigue en `ubuntu-latest` (la migración a Ubuntu 26
  del 19-oct-2026 ya ocurrió; fijar `ubuntu-24.04` sería ir hacia atrás).

## Archivos tocados

- `.github/workflows/ci.yml` (modificado)
- `.github/workflows/integration.yml` (modificado)
- `.github/workflows/build-web.yml` (modificado)
- `AGENTS.md` (modificado)
- `.opencode/agent/svr-erp.md` (modificado)
- `historial-cambios/2026-11-18-actions-versiones.md` (creado)

## Pruebas / verificación

- Sintaxis YAML de los 3 workflows validada con `js-yaml`.
- Versiones obtenidas de la API de GitHub el 2026-11-18.
- `git diff --check`: limpio.
- Sin push: las corridas reales con las versiones nuevas quedan pendientes.

## Pendientes y riesgos

- Las actions mayores nuevas pueden cambiar comportamiento (en particular
  `build-push-action@v7`); la única forma de confirmarlo es correr los
  workflows en GitHub.
- Queda pendiente el lint (21 errores) y la decisión de alcance explicada en
  `2026-11-18-ci-integracion-y-smoke.md`.
