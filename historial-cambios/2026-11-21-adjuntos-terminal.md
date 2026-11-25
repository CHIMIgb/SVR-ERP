# Adjuntos rechazados pasan a estado terminal y el modal ya no felicita con fotos sin subir

**Fecha:** 2026-11-21
**Autor:** SVR-ERP Dev (agente)

## Cambios realizados
- Menor 1 de la segunda revisión del PR #23, las dos partes:
  1. **Sin terminal para adjuntos rechazados**: una foto que el server
     rechaza con 4xx de datos (413 `PAYLOAD_TOO_LARGE`, 422, 403, 400...)
     ya no queda en `error` reintentándose cada 2 min para siempre. Ahora
     el item pasa a `rechazado` (terminal) y espera la decisión humana
     Descartar/Reintentar de `EstadoCola` — igual que el alta rechazada.
     Los fallos de RED siguen retriables (`error`) como hoy.
  2. **`enviados.push` solo sin faltantes**: si el alta tuvo ACK pero
     quedan fotos por subir (de red O rechazadas), el item NO entra en
     `enviados` → el modal ya NO felicita "Incidente registrado
     exitosamente" con fotos pendientes; muestra el estado real en
     `EstadoCola` con la nota de que las fotos se suben después.
- `guardarAdjuntosPendientes(id, indices, rechazado = false)`: tercer
  parámetro para el estado terminal.
- `CODIGOS_ADJUNTO_TERMINAL` = códigos de datos del alta + `PAYLOAD_TOO_LARGE`.

## Comportamiento del Reintentar
`reencolar()` conserva `adjuntosPendientes` y vuelve a `pendiente`: el
reenvío repite el alta con la MISMA idempotenciaKey (el server devuelve el
original sin duplicar) y sube SOLO las fotos faltantes. Si la foto vuelve
a ser rechazada, el item regresa a `rechazado` — correcto.

## Archivos tocados
- apps/web/src/lib/pwa/sincronizador.ts (modificado)
- apps/web/src/lib/pwa/offline.ts (modificado)
- apps/web/src/lib/pwa/sincronizador.test.ts (aserciones ids + flag rechazado)

## Pruebas / verificación
- `npx tsc --noEmit` + `npm run lint` (apps/web): limpio, 0 errores /
  38 warnings preexistentes.
- `npm test -- --runInBand`: 5 suites, 16/16 (los 4 tests de adjuntos
  verifican ahora los ids devueltos y el flag de rechazo).
- `git diff --check`: reporta "trailing whitespace" en las líneas nuevas
  del test — FALSO POSITIVO verificado byte a byte: son los `\r` del line
  ending CRLF que el archivo YA trae desde el commit del PR (i/crlf en
  `git ls-files --eol`); normalizarlo a LF explotaría el diff a 245
  líneas de whitespace. El mismo falso positivo existe en el commit I-1
  ya commiteado (`git show --check b6c236b0`).
- Smoke manual en teléfono: NO realizado.

## Pendientes y riesgos
- El toast del caso "fotos pendientes" dice "quedó guardado en este
  teléfono y se enviará solo" — impreciso cuando el reporte YA se registró
  (solo faltan fotos); la nota del modal lo aclara ("las fotos se suben
  después del reporte"). Refinamiento de texto pendiente si el cliente pide.
- Un item rechazado con fotos NO puede "reenviarse solo": si el usuario
  lo descarta, el reporte queda en el server sin esas fotos (decisión
  humana visible en EstadoCola).
