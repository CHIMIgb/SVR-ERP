# Nómina con sueldo diario entre 7, prorrateo de ingreso, nómina pagada cerrada y salida en turno nocturno

**Fecha:** 2026-11-12
**Autor:** P4chec0php

## Cambios realizados
- **Sueldo diario entre 7, no entre 6.** El domingo de descanso se paga, así que el día vale el semanal entre 7.
  Antes cada falta descontaba de más. Con $6,000 a la semana, 2 faltas eran $2,000; ahora son $1,714.29. Cambia
  en la nómina (`FALTA_AUTO`), en el finiquito de la API (`liquidar()`) y en la vista previa del finiquito.
- **Prorrateo del que entra a media semana.** Los días anteriores a la fecha de ingreso ya no eran falta, pero
  tampoco se descontaban: quien entraba el miércoles cobraba la semana completa. Ahora el resumen semanal trae
  `totalDiasAntesDeIngreso` y la nómina los descuenta con una línea `INGRESO_AUTO` ("N día(s) antes de su
  ingreso"), al mismo sueldo diario. Al volver a sincronizar se regenera junto con la de faltas, sin duplicarse.
- **Una nómina pagada queda cerrada.** `registrarAjuste` aceptaba bonos y descuentos sobre una nómina ya pagada, y
  el recibo entregado cambiaba. Ahora responde 409 `NOMINA_PAGADA` (auditado), y la vista ya no muestra
  "Ajuste" en las filas pagadas.
- **Turno nocturno.** Una salida después de la medianoche buscaba la entrada de hoy, no la encontraba y se
  rechazaba ("sin entrada previa"). Además, las horas daban 0 cuando la salida era menor que la entrada. Ahora:
  - Sin registro hoy, la salida cierra la entrada de ayer que sigue abierta, solo si es de un turno nocturno: entró
    más tarde que la hora actual y no han pasado más de 14 h.
  - Una entrada de ayer en la mañana que se quedó sin salida no se cierra así (saldrían 30 h); sigue su camino
    de omisión.
  - Las horas cuentan cruzando la medianoche (20:00 a 06:00 = 10 h).
- **Alta de trabajador:** la hora de entrada por defecto pasa de 07:00 a 08:00, que es la entrada de toda la
  empresa.

## Archivos tocados
- `apps/api/src/nomina/nomina.service.ts`
- `apps/api/src/nomina/nomina.service.spec.ts`
- `apps/api/src/asistencia/asistencia.service.ts`
- `apps/api/src/asistencia/asistencia.service.spec.ts`
- `apps/api/src/trabajadores/trabajadores.service.ts`
- `apps/web/src/app/(dashboard)/nomina/page.tsx`
- `apps/web/src/components/workers/LiquidacionModal.tsx`
- `apps/web/src/components/workers/TrabajadorFormModal.tsx`

## Verificación
- Unitarias de Nómina, Asistencia y Trabajadores: 245 de 245. Pruebas nuevas:
  - Falta al sueldo entre 7.
  - Prorrateo de 2 días antes del ingreso.
  - Ajuste rechazado sobre una nómina pagada, con FAIL auditado.
  - Salida a las 06:00 que cierra la entrada nocturna de ayer (10 h).
  - Entrada de ayer en la mañana que no se cierra.
  - Conteo de días antes del ingreso en el resumen semanal.
- `npx tsc --noEmit` en `apps/api` y en `apps/web`, y `npx eslint` de los archivos web tocados: sin errores.

## Pendientes
- Las pruebas de integración no se corrieron: la BD local todavía no tiene las migraciones del 2026-11-08 al
  2026-11-12 que entraron con el #18.
- No se probó en navegador.
- Turno nocturno: el plazo de la omisión sigue siendo a las 17:00 para todos. Para quien entra de noche, una
  entrada tarde queda vencida de inmediato. Falta definir su plazo.
