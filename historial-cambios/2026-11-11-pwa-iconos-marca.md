# PWA base — paso D: íconos de marca SVR reales (sharp)

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base`

## Cambios realizados

Reemplazo de los placeholders naranjas planos del paso 6 por los **íconos de
marca SVR** (imagen 5 del cliente): cuadrado naranja redondeado con el casco
blanco (mismo símbolo del login), dibujado como SVG y rasterizado con
**sharp** (ya disponible como dependencia de optimización de imágenes de
Next — sin dependencias nuevas):

- `public/icons/pwa-512.png` (12.3 KB, 512×512, purpose any+maskable)
- `public/icons/pwa-192.png` (3.4 KB, 192×192)
- `src/app/icon.png` (favicon de la pestaña — Next lo sirve automáticamente)

## Archivos tocados

- `apps/web/public/icons/pwa-512.png` / `pwa-192.png` (reemplazados)
- `apps/web/src/app/icon.png` (nuevo)

## Pruebas / verificación

- Firma PNG + dimensiones verificadas por lectura binaria (512×512, 192×192,
  64×64).

## Pendientes y riesgos

- Sin push (orden del usuario).
- Si el cliente entrega su logo definitivo, regenerar con el mismo SVG
  cambiando el arte.
