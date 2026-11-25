# Ventas: las pruebas del cierre de caja ya no fallan de 23:00 a 23:59

**Fecha:** 2026-11-22
**Autor:** P4chec0php

## Cambios realizados
- En `ventas.service.spec.ts`, el bloque `createCierre` simulaba un turno de 23:00 a 00:00 con la nota de que así
  "siempre se puede cerrar". Pero `permiteCerrarCaja()` toma ese horario como turno **nocturno** y solo deja cerrar
  de 00:00 a 22:59. Por eso 2 pruebas (`should compute arqueo esperado/contado/diferencia` y
  `should use apertura fondo when efectivoInicial not provided`) fallaban si se corrían entre las 23:00 y las 23:59.
- Ahora el bloque usa un turno **continuo** (apertura y cierre en 00:00), donde siempre se puede cerrar. Es el mismo
  patrón que ya usa `ventas.integration.spec.ts` en `CIERRE_CAJA_REGISTRADO`. El comentario explica el porqué para
  que no se regrese a un horario con ventana.
- Solo cambia la prueba; el código de ventas no se toca.

## Archivos tocados
- `apps/api/src/ventas/ventas.service.spec.ts` (modificado)

## Pruebas / verificación
- Se reprodujo con el reloj fijo (temporal, fuera del repo): **antes**, a las 23:30 fallaban 2 de 35 y a las 12:00
  pasaban todas.
- **Después**, `ventas.service.spec.ts` pasa 35/35 a las 00:00, 12:00, 22:59, 23:00, 23:30 y 23:59, y también con el
  reloj real.
- Suite unitaria completa de la API (`npx jest`) con el reloj a las 23:30 y a las 00:30: 1443/1443. No hay otras
  pruebas que dependan de la hora.
- `npx tsc --noEmit` en `apps/api`: limpio.

## Pendientes y riesgos
- Ninguno. Las reglas de horario siguen cubiertas por las pruebas propias de `permiteCerrarCaja` (turno diurno,
  nocturno y continuo) en el mismo archivo.
