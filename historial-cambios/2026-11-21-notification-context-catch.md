# NotificationContext: promesas de marcaje atrapadas sin red

**Fecha:** 2026-11-21
**Autor:** SVR-ERP Dev (agente)

## Cambios realizados
- Menor 8 de la segunda revisión del PR #23: `markAsRead`,
  `markAllAsRead` y `clearNotifications` agregan `.catch(() => undefined)`
  a sus llamadas de API — sin red ya no queda una promesa sin atrapar en
  la consola. El estado optimista local ya se aplicó antes del fetch y el
  toast de error solo aparece con respuesta del server (`success:false`),
  que es el diseño existente.

## Archivos tocados
- apps/web/src/components/layout/NotificationContext.tsx (modificado)

## Pruebas / verificación
- `npx tsc --noEmit` en apps/web: limpio.
- `npm run lint`: 0 errores, 38 warnings preexistentes.
- `npm test -- --runInBand`: 6 suites, 20/20 tests.
- `git diff --check`: limpio.
- Smoke manual (marcar leída sin red): NO realizado.

## Pendientes y riesgos
- Sin mecanismo de reintento del marcaje: con red muerta el estado local
  dice "leída" pero el server no la marcó — al recargar vuelve a "no
  leída". Es el comportamiento previo a este cambio (solo se atrapó la
  promesa); un re-sincronizado sería feature nueva.
