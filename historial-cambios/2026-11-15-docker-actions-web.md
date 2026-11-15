# Build del web vía GitHub Actions + imagen Docker (Railway plan gratis 1 GB)

**Fecha:** 2026-11-15
**Autor:** Agente (autorizado por el usuario — opción A del plan de despliegue)

## Contexto

Los builds de Railway comparten el techo del plan gratis (**1 GB**): `next build` de este
monorepo muere con SIGKILL silencioso ("exit code 1" sin ninguna línea de error) con
Turbopack **y** con Webpack — probado ambos. La medición local con RSS real confirmó:
heap capado a 600 MB → **pico RSS 1,367 MB** (buffers/workers nativos viven fuera del heap),
o sea que ningún `NODE_OPTIONS` hace caber el build en 1 GB. Los runners de GitHub Actions
tienen 7 GB — ahí corre el build.

## Archivos nuevos (no se tocó código existente)

1. **`Dockerfile`** (raíz) — multietapa: deps (`npm ci` del workspace web+shared) → build
   (`turbo build --filter=web`, con `NEXT_PUBLIC_*` como build-args horneadas) → runtime
   limpio (`next start` con `.next` + `node_modules` + `public`). Base `node:26-alpine`.
2. **`.github/workflows/build-web.yml`** — en push a `main` que toque `apps/web/**`,
   `packages/**`, lockfile, Dockerfile o el workflow: construye y sube la imagen a
   `ghcr.io/chimigb/svr-erp-web` (tags `latest` + SHA), con caché de Actions. Login a GHCR
   con el `GITHUB_TOKEN` (sin secretos que configurar).

## Verificación

- Estructura del root verificada contra lo que asume el Dockerfile (workspaces, turbo
  devDep, API fuera de workspaces) ✓
- `public/` existe ✓ · `next.config.ts` mínimo (sin standalone ni transpile) ✓
- **No se puede buildar la imagen local** (no hay Docker en la máquina) — el primer build
  real corre en Actions (pendiente del push; se verá con `gh run`).

## Pendientes / riesgos

- `NEXT_PUBLIC_APP_URL` quedó con el placeholder `https://svr-erp-web.up.railway.app` —
  **confirmar el dominio real del servicio Web** y ajustar 1 línea del workflow antes del
  primer push (se hornea en build time).
- Railway NO redespliega solo cuando la imagen se actualiza — hay que pulsar **Redeploy**
  (automatizable después con un Deploy Trigger, no hecho de entrada).
- Primer deploy en Railway: cambiar el Source del servicio Web a "Deploy from image" y
  hacer el paquete GHCR público (1 clic) para que Railway lo jale sin credenciales.
- Runtime del web dentro de 1 GB: mucho más ligero que el build (sin compilación), a
  validar cuando esté vivo.
