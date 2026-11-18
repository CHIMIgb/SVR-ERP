# CI: generar el cliente Prisma antes de compilar la API

**Fecha:** 2026-11-18
**Autor:** Agente (autorizado por el usuario — incidencia detectada en la primera corrida real)

## Contexto

Primera corrida real de `.github/workflows/ci.yml` (run `44388478857`) tras el push
de los commits `f83da8b7` y `60c2182e`: el job `web` pasó, pero el job `api` falló
en `npm run build` con errores `TS2339` sobre `prisma.users`, `prisma.sessions`,
`prisma.personas`, etc. La causa no era el código: `npm ci` dentro de `apps/api`
no genera el cliente Prisma (el paquete no tiene script `postinstall`) y en el
runner `@prisma/client` queda con tipos stub. En local el build pasaba porque el
cliente ya estaba generado en `node_modules`.

## Cambios realizados

- `.github/workflows/ci.yml`: paso `npx prisma generate` entre `npm ci` y
  `npm run build` en el job `api` (usa el `DATABASE_URL` dummy del job).
- `AGENTS.md` y `.opencode/agent/svr-erp.md`: documentado el gotcha para que un
  fallo `TS2339` en CI se diagnostique como cliente Prisma no generado.

## Archivos tocados

- `.github/workflows/ci.yml` (modificado)
- `AGENTS.md` (modificado)
- `.opencode/agent/svr-erp.md` (modificado)
- `historial-cambios/2026-11-18-ci-prisma-generate.md` (creado)

## Pruebas / verificación

- Corrida anterior: `ci` fallida en `api` (run `44388478857`), `web` verde.
- `git diff --check`: limpio.
- Sintaxis YAML validada con `js-yaml`.
- Revalidación en GitHub Actions: pendiente del push de este commit.

## Pendientes y riesgos

- El push anterior mostró el aviso de branch protection *"Changes must be made
  through a pull request"* y fue bypassado por la cuenta del usuario. Contribuidores
  sin ese permiso tendrán que abrir PR.
- `build-web` no corrió en ese push porque el diff neto de `build-web.yml` contra
  `main` fue cero (se agregó y se revirtió el job `deploy` en la misma subida).
- `npm run lint` (21 errores) y los 2 tests de `cobranza` siguen fuera del CI.
