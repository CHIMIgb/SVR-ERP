# El service worker solo cachea respuestas buenas

**Fecha:** 2026-11-21
**Autor:** SVR-ERP Dev (agente)

## Cambios realizados
- Punto I-4 de la segunda revisión del PR #23: el SW ahora solo cachea
  respuestas `res.ok && !res.redirected`, y el `put` va en
  `event.waitUntil`. Antes, una página de error (p.ej. un 502 del proxy)
  pisaba la última copia buena de la ruta y luego se servía SIN señal —
  offline te quedabas atrapado en la página de error.
- Extensión mínima del mismo hallazgo: el guard aplica también a los
  estáticos (`/_next/static/` en dev y prod cache-first) y a los otros
  `/_next/` — el mismo patrón sin guard estaba en los 4 lugares del SW.
  Una respuesta de error de un chunk tampoco debe pisar la buena.

## Cosas nuevas
- Helper `esCacheable()` en `sw.js` (4 usos).

## Archivos tocados
- apps/web/public/sw.js (modificado)

## Pruebas / verificación
- `node --check sw.js`: sintaxis válida.
- `npx tsc --noEmit` + `npm run lint` (apps/web): limpio, 0 errores /
  38 warnings preexistentes.
- `npm test -- --runInBand`: 16/16.
- `git diff --check`: limpio.
- Smoke en teléfono: NO realizado (el fix se ve con server dev caído +
  recarga + modo avión, escenario manual pendiente del PR).

## Pendientes y riesgos
- La caché NAV de un teléfono ya activo puede contener una página de error
  pisada por el SW viejo; se limpia igual con el mensaje `limpiar-cache`
  al cerrar sesión (flujo existente). El nuevo guard solo evita que vuelva
  a pasar.
- `res.redirected` excluye también redirects legítimos (301/302 de la
  ruta); en esta app las navegaciones responden 200 directo — riesgo
  bajo, documentado aquí.
