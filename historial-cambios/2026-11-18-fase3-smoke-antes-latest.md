# Fase 3: smoke antes de mover `latest` en build-web

**Fecha:** 2026-11-18
**Autor:** Agente (autorizado por el usuario — "ahora la siguiente fase Fase 3")

## Contexto

`.github/workflows/build-web.yml` publicaba `latest` y el tag por SHA en un
solo `build-push`, y corría el smoke *después*: un contenedor que no arranca
dejaba `latest` apuntando a una imagen rota. La Fase 3 convierte el smoke en
condición para publicar `latest`. El usuario pidió además marcar las fases
anteriores como completadas: la Fase 2 no se había ejecutado, así que se cerró
antes en su propio commit (`7c13f913`).

## Cambios realizados

- **`.github/workflows/build-web.yml`:**
  1. El `build-push` publica **solo** `:${{ github.sha }}` (se quitó `latest`
     de la lista de tags). Mantiene build-args y caché GHA.
  2. El smoke corre contra `:${{ github.sha }}` en vez de `:latest`.
  3. Nuevo paso "Publicar latest" después del smoke:
     `docker buildx imagetools create --prefer-index=false -t ghcr.io/chimigb/svr-erp-web:latest ghcr.io/chimigb/svr-erp-web:${{ github.sha }}`.
- **Desviación deliberada del plan:** el plan proponía un segundo
  `build-push` reutilizando caché. `imagetools create` logra lo mismo con una
  línea: re-apunta `latest` al manifiesto ya publicado, sin recompilar ni
  subir capas. Sintaxis confirmada con la documentación de Docker Buildx
  (`-t` para el destino, fuente en el mismo registry, `--prefer-index=false`
  para preservar el formato del manifiesto).
- **Documentación:** plan con Fases 0-3 ejecutadas y Fase 3 detallada; tabla de
  workflows en `AGENTS.md` y `.opencode/agent/svr-erp.md` actualizada con el
  orden SHA → smoke → latest.

## Cosas nuevas

- Paso "Publicar latest" condicionado al éxito del smoke.
- `latest` deja de publicarse en el mismo paso que el tag por SHA.

## Archivos tocados

- `.github/workflows/build-web.yml` (modificado)
- `AGENTS.md` (modificado)
- `.opencode/agent/svr-erp.md` (modificado)
- `docs-planes/PLAN-CI-CD-ENDURECIMIENTO.md` (modificado)
- `historial-cambios/2026-11-18-fase3-smoke-antes-latest.md` (creado)

## Pruebas / verificación

- `git diff --check`: sin errores.
- Orden de pasos revisado en el archivo final: build+push SHA → smoke →
  Publicar latest.
- Sintaxis de `docker buildx imagetools create` verificada contra la doc de
  Docker Buildx (Context7).
- **No se corrió el workflow** ni se validó el YAML con un parser: no hay push
  autorizado (`--ref main` ejecutaría la versión anterior del workflow) y la
  máquina local no tiene Docker ni módulos `yaml` de Python/Node.
- Referencia histórica: digest anterior de `latest`
  `sha256:222efb49b22947f50f2e5a31f265486ced6e8eb6c434e4cefd425ef53080f3e1`.

## Pendientes y riesgos

- Al autorizar push/PR: correr `build-web`, confirmar en el log que
  "Publicar latest" va después de "Contenedor respondiendo", y anotar el SHA y
  digest nuevos en `historial-cambios/`.
- Si `imagetools create` falla en el runner, el job falla y `latest` no se
  mueve: fallo visible, no silencioso.
- El Redeploy en Railway sigue siendo manual. No se hizo push ni PR (no
  ordenados).
