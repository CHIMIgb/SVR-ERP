# EstadoCola: "Foto(s) rechazada(s)" — el reporte ya se guardó

**Fecha:** 2026-11-22
**Autor:** SVR-ERP Dev (agente)

## Cambios realizados
- Detalle de la tercera revisión: con una foto RECHAZADA (item en estado
  `rechazado` con `adjuntosPendientes`), `EstadoCola` decía "Rechazado"
  genérico — el operario podía creer que el reporte NO se guardó y
  capturarlo otra vez. Ahora la etiqueta es "Foto(s) rechazada(s)" y la
  fila añade "· el reporte ya se guardó".
- El caso "Rechazado" del ALTA (sin fotos) sigue mostrando "Rechazado" —
  ahí sí no se guardó.

## Archivos tocados
- apps/web/src/components/pwa/EstadoCola/EstadoCola.tsx (modificado)

## Pruebas / verificación
- `npx tsc --noEmit` en apps/web: limpio.
- `npm run lint`: 0 errores, 38 warnings preexistentes.
- `npm test -- --runInBand`: 6 suites, 27/27 tests.
- `git diff --check`: limpio.
- Smoke visual en teléfono: NO realizado.

## Pendientes y riesgos
- Ninguno funcional: es solo la etiqueta y un texto informativo de fila.
