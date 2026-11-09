# Las horas extra que se pagan corresponden al horario capturado

**Fecha:** 2026-11-08
**Autor:** P4chec0php

## Cambios realizados
Lo encontré al revisar el arreglo del horario real de horas extra. La vista ya calcula las horas del horario,
pero la API no lo comprobaba: un cliente podía mandar "17:00 a 18:00" con `horasCalculadas: 10`, y se pagarían
10 h si alguien las autorizaba sin fijarse.

Ahora, con hora de fin, `POST /asistencia/:id/horas-extra` comprueba que `horasCalculadas` corresponda al horario:
- Si el fin es menor que el inicio, se entiende que cruzó la medianoche (22:00–01:00 son 3 h).
- Margen de 0.01 h por el redondeo a 2 decimales (17:00–20:20 son 3.33 h).
- Si no corresponden, responde 400 `HORAS_NO_CORRESPONDEN`, auditado. Ejemplo de mensaje: "De 17:00 a 18:00 son
  1 h, no 10 h".
- Sin hora de fin (horas "en curso"), no hay horario contra qué comparar.

Una prueba unitaria mandaba horas que no correspondían a su horario (de 17:00 a 20:00 con 2 h) y se corrigió a
de 17:00 a 19:00.

## Archivos tocados
- `apps/api/src/asistencia/asistencia.service.ts`
- `apps/api/src/asistencia/asistencia.service.spec.ts`

## Verificación
- Las pruebas se escribieron primero: la de 10 h en un horario de 1 h falló antes del arreglo. Las de
  medianoche y redondeo pasan.
- Unitarias de Asistencia y Nómina: 144 de 144. Integración de las dos contra Postgres real: 19 de 19.
- `npx tsc --noEmit` en `apps/api`: sin errores.

## Pendientes
- Si la app móvil o el Simulador registran horas extra, ahora deben mandar horas que correspondan al horario.
