# NotificationContext: toast "sin conexión" cuando el marcaje no llegó

**Fecha:** 2026-11-22
**Autor:** SVR-ERP Dev (agente)

## Cambios realizados
- Detalle de la tercera revisión sobre el menor 8: el `.catch(() => undefined)`
  ya atrapaba la promesa sin red, pero callaba el fallo — la marca
  optimista se perdía al recargar sin explicación. Ahora los tres marcajes
  (`marcarLeida`, `marcarTodas`, `descartarTodas`) muestran un toast info
  "Sin conexión — al recargar …" explicando la consecuencia.

## Archivos tocados
- apps/web/src/components/layout/NotificationContext.tsx (modificado)

## Pruebas / verificación
- `npx tsc --noEmit` en apps/web: limpio.
- `npm run lint`: 0 errores, 38 warnings preexistentes.
- `npm test -- --runInBand`: 6 suites, 27/27 tests.
- `git diff --check`: limpio.
- Smoke manual (marcar leída sin red): NO realizado.

## Pendientes y riesgos
- Sigue sin haber reintento del marcaje: el toast explica qué pasará al
  recargar. Un sincronizado diferido sería feature nueva (nadie la pidió).
