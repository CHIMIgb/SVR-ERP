# CD: volver al redeploy manual en Railway

**Fecha:** 2026-11-18
**Autor:** Agente (autorizado por el usuario — cambio de estrategia de CD)

## Contexto

El commit `f83da8b7` agregó un job `deploy` que requería un project token de
Railway para hacer redeploy automático. La verificación de cuenta necesaria para
crear ese token exige pago y el usuario está en el plan gratuito, así que se
descarta el deploy automático y se vuelve al flujo anterior: Actions publica la
imagen y el redeploy se aprieta a mano en Railway. No se creó ningún secreto ni
variable en GitHub.

## Cambios realizados

- `.github/workflows/build-web.yml`: eliminado el job `deploy` y los comentarios
  sobre `RAILWAY_TOKEN`/`RAILWAY_SERVICE`. Restaurada la nota de que Railway no
  redespliega solo. El build y el push a GHCR (`latest` + SHA) quedan intactos.
- `AGENTS.md`: la sección `CI/CD` ya no menciona el redeploy automático; la
  regla 4 describe ahora el procedimiento manual y el requisito del tag `:latest`.
- `.opencode/agent/svr-erp.md`: mismo ajuste en el inventario de workflows y en
  el diagnóstico; sin secretos de GitHub que configurar.
- `ci.yml` NO se tocó: los gates verdes y la deuda de lint/tests siguen igual.

## Archivos tocados

- `.github/workflows/build-web.yml` (modificado)
- `AGENTS.md` (modificado)
- `.opencode/agent/svr-erp.md` (modificado)
- `historial-cambios/2026-11-18-cd-redeploy-manual.md` (creado)

## Pruebas / verificación

- `git diff --check`: limpio.
- Sintaxis YAML de `build-web.yml` validada con `js-yaml`.
- No se corrió el workflow: sigue sin haberse hecho push a `main`.

## Pendientes y riesgos

- Cada push a `main` que toque el web publica imagen, pero **no despliega**:
  hay que entrar a Railway → servicio Web → **Redeploy**. Si se olvida,
  producción se queda con la versión anterior.
- El servicio debe apuntar al tag mutable `:latest`; con un tag por SHA el
  redeploy repite la imagen vieja.
- Si el paquete GHCR es privado, Railway necesita un token `read:packages` en
  Registry Credentials (esto no depende del plan de GitHub).
- `npm run lint` (21 errores) y los 2 tests de `cobranza` siguen rojos y fuera
  del CI; documentados en el registro anterior.
