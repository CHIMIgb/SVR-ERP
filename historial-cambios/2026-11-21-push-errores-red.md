# Push: errores de red no dejan suscripción huérfana ni el botón trabado

**Fecha:** 2026-11-21
**Autor:** SVR-ERP Dev (agente)

## Cambios realizados
- Menor 2 de la segunda revisión del PR #23, las tres partes:
  1. `vapidPublica()` ahora DENTRO del `try` de `activarPush()`: si lanza
     por red, se resuelve con `{ok:false}` y mensaje del apiClient en vez
     de lanzar sin atrapar (antes salía del flujo y el llamador nunca
     bajaba su bandera).
  2. `NotificacionesModal.activar()` con `finally`: el botón ya no queda
     en "activando" si algo lanza por red.
  3. Si el alta en el server (`suscribirPush`) LANZA por red, se
     desuscribe la suscripción local del navegador — antes quedaba
     huérfana y `estadoPush()` diría "activadas" con un backend que nunca
     la registró (desync de estados). Si falla antes de suscribir, la
     variable es `null` y no desuscribe nada.

## Cosas nuevas
- `apps/web/src/lib/pwa/push.test.ts`: 4 tests de `activarPush` con mocks
  de `notificacionesApi`, service worker y permiso (primera cobertura de
  este módulo): red en el alta desuscribe, red en VAPID no llega a
  suscribir, alta rechazada desuscribe (regresión del caso previo) y alta
  exitosa no desuscribe.

## Archivos tocados
- apps/web/src/lib/pwa/push.ts (modificado)
- apps/web/src/components/pwa/NotificacionesModal/NotificacionesModal.tsx (modificado)
- apps/web/src/lib/pwa/push.test.ts (creado)

## Pruebas / verificación
- `npx tsc --noEmit` en apps/web: limpio.
- `npm run lint` en apps/web: 0 errores, 38 warnings preexistentes.
- `npm test -- --runInBand`: 6 suites, 20/20 tests.
- `git diff --check`: limpio.
- Smoke manual en teléfono con señal cortada durante el alta: NO realizado
  (requiere app instalada/SW activo, solo producción).

## Pendientes y riesgos
- Si el `unsubscribe()` local falla tras una red muerta, la suscripción
  queda en el navegador sin registro en server; el reintento del usuario
  la re-registrará (upsert por endpoint) — mismo estado que hoy.
- La desuscripción en el catch también cubre fallos raros del
  `pushManager.subscribe` post-creación; en ese caso unsubscribe de una
  suscripción incompleta es inocuo.
