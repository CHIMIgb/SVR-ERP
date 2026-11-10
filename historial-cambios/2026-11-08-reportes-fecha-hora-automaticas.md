# /reportes — fecha y hora automáticas al registrar (fuera del formulario)

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

- **Create backend:** `fecha` y `hora` ya no llegan en el DTO — el service las
  registra con la hora del servidor al momento de guardar (`fechaDelMomento()`
  y `horaDelMomento()`; misma convención de hora base-1970 local que ya usaba
  el render, para que la columna Fecha siga mostrando la hora capturada).
- **Update backend:** el DTO dejó de aceptar fecha/hora (no se pueden alterar
  después; se conserva la original).
- **Front:** campos Fecha/Hora fuera del modal Crear y del Editar; el payload
  ya no los manda; hint en la Descripción "La fecha y hora se registran
  automáticamente al guardar". La columna y el detalle siguen mostrándolos.
- Whitelist del ValidationPipe: un payload viejo con fecha/hora ahora responde
  400 (propiedades ajenas).

## Archivos tocados

- `apps/api/src/reportes-campo/dto/create-reporte-campo.dto.ts` / `update-reporte-campo.dto.ts`
- `apps/api/src/reportes-campo/reportes-campo.service.ts` (auto fecha/hora; update sin fecha/hora)
- specs (unit + integration + dto)
- `apps/web/src/lib/api.ts` / `apps/web/src/app/(dashboard)/reportes/page.tsx`

## Pruebas / verificación

- Unitarios módulo **69/69**, integración real **24/24** (nuevo test: el DTO
  ya no contiene fecha/hora; create real con server time verificado).
- `tsc --noEmit` OK (api + web); eslint de la página limpio.
- E2E real: POST sin fecha/hora → INC0027 con `fecha=2026-11-08 hora=17:31`
  (hora local del servidor); demo borrado con DELETE auditar.

## Pendientes y riesgos

- La antigua fecha capturada a mano se mantiene en las filas del demo — no se
  re-relocaron; los incidentes viejos conservan su fecha original.
- La hora usa la TZ del proceso (America/Mexico_City en el API); si el server
  cambia de TZ habría que revisar `horaDelMomento()`.
