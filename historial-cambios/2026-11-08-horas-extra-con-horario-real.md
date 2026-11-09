# Horas extra con su horario real y marcaje sin valores precargados

**Fecha:** 2026-11-08
**Autor:** P4chec0php

## Cambios realizados
**Bug:** al registrar horas extra, la vista pedía solo cuántas horas (con "3.0" ya escrito) e **inventaba el
horario** con el reloj del dispositivo: fin = la hora de captura, inicio = fin menos las horas. Si se capturaba
al día siguiente o de madrugada, se guardaba un horario que nunca ocurrió (por ejemplo 22:00–01:00). Además, la
salida anticipada abría con "5.5" horas laboradas ya escritas.

Ahora:
- **Horas extra:** se capturan la **hora de inicio y la hora de fin** con el `TimePicker` compartido. Las horas
  y el monto estimado se calculan de ese horario. Si el fin es menor que el inicio, se entiende que termina al
  día siguiente, y la vista lo indica. Igual que la API, se pide un mínimo de 30 minutos y un máximo de 24 h.
- **Salida anticipada:** las horas laboradas arrancan vacías. La validación que ya existía las exige.

## Archivos tocados
- `apps/web/src/app/(dashboard)/asistencia/page.tsx`

## Verificación
- `npx tsc --noEmit` y `npx eslint` de la vista: sin errores.
- Capturas del modal en modo "Horas extra" a 390 y 1440 px, en claro y oscuro, y con el selector de hora
  abierto. A 390 px el desplegable se ve completo encima del modal.

## Pendientes
- La trabajadora Ana Martínez tiene tarifa de horas extra de $0 en la BD, así que sus horas extra se pagarían en
  cero. Entra en la decisión pendiente con Oscar sobre la tarifa de horas extra (la LFT pide el doble).
