# Imagen del web construida y subida a GHCR — saga de binarios nativos Linux cerrada

**Fecha:** 2026-11-16
**Autor:** Agente (autorizado por el usuario — opción A del despliegue Railway)

## Resultado

Corrida **43779535148 → SUCCESS**: `ghcr.io/chimigb/svr-erp-web` construida y publicada
(tags `latest` + SHA del commit). El web ya no necesita compilar en Railway (techo 1 GB
del plan gratis insuficiente para `next build` — probado con Turbopack y Webpack).

## Commits de la saga (todos push a main)

| Commit | Fix |
|---|---|
| `83a45a4c` | Dockerfile multietapa + workflow `build-web.yml` |
| `339a1766` | dominio real del front (`svr-prod`) en `NEXT_PUBLIC_APP_URL` |
| `f8bd7724` | base Alpine → `node:26-slim` (lightningcss musl no se instala en alpine) |
| `9264a9c7` | lightningcss gnu a mano (primer parche) |
| `e2976a34` | `npm ci` → `npm install` en etapa deps (no bastó) |
| `7a47900f` | **fix final**: binarios nativos Linux explícitos `--no-save`: `lightningcss-linux-x64-gnu@1.32.0`, `@tailwindcss/oxide-linux-x64-gnu@4.3.3`, `@img/sharp-linux-x64@0.34.5` |

**Causa raíz de los 3 fallos:** el `package-lock.json` (generado en Windows) omitió las
entradas `packages/` de TODAS las variantes nativas de Linux — bug abierto
npm/cli#4828. Ni `npm ci` ni `npm install` las agregan sin entrada en lockfile.

## Pendientes / riesgos

- **Al actualizar binarios nativos** (upgrade de tailwindcss/sharp/lightningcss): hay que
  actualizar a mano las 3 versiones del `RUN npm install --no-save` del Dockerfile. Si
  algún día se regenera el lockfile en Linux, podría volverse `npm ci` limpio.
- Runtime del web en Railway: aún por validar (pasos del usuario: paquete GHCR público →
  "Deploy from image" → Deploy → login de prueba).
- Railway no redespliega solo cuando la imagen se actualiza — Redeploy manual (o Deploy
  Trigger si se pide).
