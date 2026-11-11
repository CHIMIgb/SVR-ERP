# PWA — manifest restaurado en el metadata (la instalación como PWA real)

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base`

## Cambios realizados

El teléfono ya instalaba la app (CA de mkcert confiable ✅, menú ⋮ →
«Instalar página como app»), pero la abría **con barra de URL** y con el
título de la página — Chrome la tomó como **página**, no como PWA.

**Causa:** verificación del HTML servido — el `<link rel="manifest">` no
aparecía. En el incidente del disco lleno se perdió la línea
`manifest: "/manifest.json"` del `metadata` del layout raíz (el
`theme-color` sobrevivió, el manifest no).

**Fix:** restaurada la línea en `apps/web/src/app/layout.tsx`. Verificado
después en el HTML servido por el dev server:
`<link rel="manifest" href="/manifest.json"/>` ✅. El `manifest.json`
público está completo (`display: standalone`, `start_url: /m`, `id: /m`,
íconos 192/512 maskable) — con el link de vuelta, Chrome instala como PWA
real: sin barra de URL, ícono casco en el cajón de apps.

## Archivos tocados

- `apps/web/src/app/layout.tsx` (línea `manifest` restaurada en metadata)

## Pruebas / verificación

- HTML servido con el link del manifest ✅ (verificado por HTTPS real
  contra el dev server del usuario).
- `tsc --noEmit` ✅.

## Pendientes y riesgos

- Sin push (orden del usuario).
- En el teléfono: **desinstalar la instalación anterior** (la que abre con
  barra) y repetir ⋮ → instalar para que la nueva sea standalone.
