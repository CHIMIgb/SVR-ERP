# SW: clone síncrono antes del return — el diferido mataba todo el caché

**Fecha:** 2026-11-22
**Autor:** SVR-ERP Dev (agente)

## Cambios realizados
- Bloqueante de la tercera revisión (arregla el I-4 de ayer, commit
  `428831b`): el `res.clone()` estaba DENTRO del `.then` de
  `caches.open(...)` — asíncrono. Cuando `respondWith` entrega `res`, el
  navegador toma el cuerpo; al resolver `caches.open()`, el `clone()`
  lanzaba `TypeError: body is already used` y el `put` NUNCA ocurría:
  el SW no cacheaba nada y el offline moría en teléfono nuevo o tras un
  logout (el `install` no precachea). Arreglo del review: clonar
  SÍNCRONO antes del `return`, en los 4 lugares (navegaciones, estáticos
  dev, estáticos prod, otros `/_next/`). El `waitUntil` con la copia ya
  hecha funciona igual (confirmado por el review con SW mínimos en
  Chrome headless).
- El comentario del helper `esCacheable` documenta el porqué para que no
  vuelva a reordenarse.

## Archivos tocados
- apps/web/public/sw.js (modificado)

## Pruebas / verificación
- `node --check sw.js`: sintaxis válida.
- Los 4 `res.clone()` ahora son síncronos (`const copia = res.clone();`
  antes del `return`).
- `git diff --check`: limpio.
- Smoke real en teléfono (modo avión tras cargar rutas): NO realizado —
  es el escenario exacto del bloqueante; el review lo reprodujo con SW
  mínimos y el patrón corregido guarda sin errores.

## Pendientes y riesgos
- Un teléfono que ya corrió el SW roto tiene la caché vacía: al volver a
  cargar con señal se repobla sola (network-first). Riesgo residual bajo.
- Este arreglo DEBE entrar a `docs/vistas-pwa` antes del merge del #25
  (el review lo pidió explícitamente).
