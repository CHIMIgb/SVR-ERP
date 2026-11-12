# PWA — el service worker ya no corre en desarrollo (causa de errores de hidratación)

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base`

## Diagnóstico

Error de hidratación en `/`: el HTML del server traía la clase `dark`
(código nuevo) pero el JS del cliente era la versión anterior — código
viejo vs HTML nuevo. Causa raíz: el SW (`sw.js`) registrado hace varios
commits **persiste** aunque se quite el registro, y su **cache-first
sobre `/_next/static/`** sirve JS viejo en desarrollo (Turbopack reutiliza
las mismas URLs de chunks al editar) → hidratación rota + hot-reload
dañado. En producción no pasa (chunks con hash inmutable), pero en dev
cada edición de código puede reproducirlo.

## Fix

1. `(pwa)/layout.tsx` effect: en `NODE_ENV !== "production"` NO se
   registra el SW y además se **desregistran los existentes** + se borran
   sus cachés (`caches.delete`). En producción el registro es normal (el
   offline de la PWA queda intacto).
2. El script inline de captura registraba el SW al parsear — ahora esa
   línea **solo se emite en producción** (`NODE_ENV` lo decide el
   bundler); la captura de `beforeinstallprompt` y el meta de las barras
   quedan también en dev (los necesita el botón Instalar en pruebas).

## Archivos tocados

- `apps/web/src/app/(pwa)/layout.tsx` (effect dev-safe + script condicional)

## Pruebas / verificación

- `tsc --noEmit` ✅; eslint ✅.

## Pendientes y riesgos

- Sin push (orden del usuario).
- **Acción única del usuario** para el navegador del escritorio (el SW
  viejo ahí solo se limpia manualmente o al visitar /m una vez):
  `chrome://serviceworker-internals` → Unregister del origen del dev
  server → recarga dura. En el teléfono, reabrir la app una vez ejecuta
  el desregistro automático.
- Nota: este error de hidratación es ruido de dev (en build de
  producción HTML y JS nacen juntos).
