# Asistencia y nómina: las pruebas de integración ya no fallan los domingos

**Fecha:** 2026-11-22
**Autor:** P4chec0php

## Cambios realizados
- Dos pruebas de integración fallaban cada domingo, en cualquier PR:
  - `asistencia-propia.integration.spec.ts` › "el residente ve a su equipo con el estado del día y sin sueldos";
  - `nomina.integration.spec.ts` › `sincronizarAsistencia`.
- La causa: la semana de asistencia y nómina va de lunes a sábado, y el domingo no cae en ninguna. Es el hallazgo
  "Nómina 10" de la segunda revisión, que sigue esperando la decisión del cliente. Como las pruebas usaban la fecha
  real, el domingo la entrada de prueba no aparecía en el día del equipo ni contaba como día trabajado.
- Ahora los dos archivos fijan el reloj en el miércoles 17 de junio de 2026 a las 10:00 (hora local). El reloj se
  fija a nivel de archivo, antes del `describe`, porque `inicio` y `diasAntesDeHoy` se calculan al definirlo. Sigue
  corriendo desde esa hora (`advanceTimers`), y `nextTick`, `setImmediate` y las microtareas se quedan reales.
- Al ser miércoles, la prueba de nómina siempre cubre el prorrateo por ingreso con monto (2 días antes de "hoy").
- Solo cambian las pruebas; el código de asistencia y nómina no se toca. La regla del domingo se decide aparte.

## Archivos tocados
- `apps/api/src/asistencia/asistencia-propia.integration.spec.ts` (modificado)
- `apps/api/src/nomina/nomina.integration.spec.ts` (modificado)

## Pruebas / verificación
- Antes del cambio, con el reloj simulado: el domingo fallaban esas 2; el lunes a las 12:00 y el sábado a las 21:47
  pasaban 16/16. Es la misma falla que dio `integration` en los PR #26 al #29, que corrieron en domingo.
- Después del cambio: 16/16 corriendo un domingo a las 22:00, con el reloj real.
- La semana del 15 al 20 de junio de 2026 no tiene periodo de nómina en la BD local ni en el volcado de CI. Esto
  importa porque el `afterAll` de la prueba de nómina borra el periodo que usa.
- `npx tsc --noEmit` en `apps/api`: limpio.

## Pendientes y riesgos
- Cuando el cliente decida qué pasa con el domingo ("Nómina 10"), estas pruebas deben revisarse junto con la regla.
- La limpieza de `nomina.integration.spec.ts` borra el periodo de la semana que use (y sus nóminas), aunque ya
  existiera. Con la fecha fija eso queda acotado a una semana sin datos; antes era la semana actual.
