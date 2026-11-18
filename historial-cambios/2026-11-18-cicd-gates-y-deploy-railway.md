# CI/CD: gates verdes en PR y deploy automático a Railway

**Fecha:** 2026-11-18
**Autor:** Agente (autorizado por el usuario — opción "gates verdes ahora" + deploy automático a Railway)

## Cambios realizados

- El repo ya tenía CD parcial (`.github/workflows/build-web.yml` publica la imagen del web en GHCR), pero ninguna validación en PR y la documentación decía lo contrario. Se agregó CI con los gates que hoy están verdes y se completó el CD con redeploy automático.
- `npm run lint` (21 errores) y `npm run test` de la API (2 fallos de `cobranza.service.spec.ts` por fechas) quedan FUERA del CI de entrada y se documentan como deuda: convertirlos en gates con el estado actual haría que toda PR naciera roja.

## Cosas nuevas

- `.github/workflows/ci.yml`: `pull_request` a `main`, `push` a `main` y `workflow_dispatch`; `concurrency` para cancelar corridas obsoletas. Job `web`: Node 26 + `npm ci` raíz + `npx tsc --noEmit`. Job `api`: `npm ci` dentro de `apps/api` + `npm run build` + `npx prisma validate` con `DATABASE_URL` dummy.
- `.github/workflows/build-web.yml`: job `deploy` con `needs: build` que ejecuta `npx -y @railway/cli@latest redeploy --service "${{ vars.RAILWAY_SERVICE || 'Web' }}" --yes` usando `secrets.RAILWAY_TOKEN`. Se documentó que el redeploy depende del tag mutable `:latest`.
- Sección `CI/CD (GitHub Actions)` en `AGENTS.md` con inventario de workflows, reglas duras y gotchas (API fuera de workspaces, lockfile de Windows, `NEXT_PUBLIC_*` horneado, TZ solo `.env`, integración fuera de CI, deuda de lint/tests).
- Sección `CI/CD — conocimiento especializado` en `.opencode/agent/svr-erp.md`: se reemplazó la afirmación falsa de que no existen Actions; incluye inventario, diagnóstico de fallos y reglas para el agente (no tocar workflows/secretos sin autorización, no imprimir tokens, push/PR solo si se ordena).

## Archivos tocados

- `.github/workflows/ci.yml` (creado)
- `.github/workflows/build-web.yml` (modificado: comentarios + job `deploy`)
- `AGENTS.md` (modificado: línea de "no CI" corregida + sección nueva)
- `.opencode/agent/svr-erp.md` (modificado: CI/CD real + sección nueva)
- `historial-cambios/2026-11-18-cicd-gates-y-deploy-railway.md` (creado)

## Pruebas / verificación

- `npx tsc --noEmit` en `apps/web`: verde (gate propuesto).
- `npx prisma validate` en `apps/api` con `DATABASE_URL` dummy: verde (gate propuesto).
- `npm run build` en `apps/api`: verde (gate propuesto).
- `npm run lint` en raíz: rojo, 21 errores + 37 avisos (deuda preexistente, documentada).
- `npm run test -- --runInBand` en `apps/api`: rojo, 2 fallos de 1417 en `cobranza.service.spec.ts` (deuda preexistente, documentada).
- Sintaxis YAML de ambos workflows validada con `js-yaml`; `git diff --check`: limpio.

## Pendientes y riesgos

- Hay que crear el secreto de repositorio **`RAILWAY_TOKEN`** (project token de Railway) y, si el servicio no se llama `Web`, la variable **`RAILWAY_SERVICE`**. Sin el secreto, el job `deploy` falla aunque el build termine bien.
- El servicio de Railway debe apuntar al tag mutable `:latest`: si apunta a un tag por SHA, el redeploy repite la imagen anterior.
- No se hicieron push ni PR: el PR de forks no recibe secrets, así que el deploy solo se probará con el primer push a `main` del repo base. No verifiqué la ejecución real de Actions ni el redeploy en Railway.
- Lint y Jest siguen rojos: cuando se arreglen, hay que agregarlos a `ci.yml` y actualizar estas notas.
