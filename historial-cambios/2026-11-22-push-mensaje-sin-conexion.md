# Push: mensaje es-MX de sin conexión en el catch de activarPush

**Fecha:** 2026-11-22
**Autor:** SVR-ERP Dev (agente)

## Cambios realizados
- Detalle de la tercera revisión sobre el menor 2: sin señal, el toast de
  activar push mostraba `e.message` crudo — "Failed to fetch" del
  `pushManager.subscribe` del navegador, o el mensaje del apiClient que
  menciona `localhost:3001` (confuso en un teléfono). Ahora ambos casos
  se traducen a "Sin conexión — activa las notificaciones cuando tengas
  señal."; los demás errores conservan su mensaje (iOS sin push, etc.).

## Archivos tocados
- apps/web/src/lib/pwa/push.ts (modificado)
- apps/web/src/lib/pwa/push.test.ts (2 tests nuevos)

## Pruebas / verificación
- `npx tsc --noEmit` en apps/web: limpio.
- `npm run lint`: 0 errores, 38 warnings preexistentes.
- `npm test -- --runInBand`: 6 suites, 29/29 tests (los 2 nuevos: el
  crudo "Failed to fetch" y el del apiClient con localhost se traducen).
- `git diff --check`: limpio.
- Smoke en teléfono con señal cortada: NO realizado (el push solo activa
  con SW activo, producción).

## Pendientes y riesgos
- La regex cubre los mensajes de red conocidos; un error nuevo del
  navegador en inglés se mostraría crudo — comportamiento igual al de
  antes y solo en casos raros.
