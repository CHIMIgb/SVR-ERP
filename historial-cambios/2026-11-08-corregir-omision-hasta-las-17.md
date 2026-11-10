# Una omisión resuelta se puede corregir el mismo día, hasta las 17:00

**Fecha:** 2026-11-08
**Autor:** P4chec0php

## Cambios realizados
**Bug:** una omisión ya resuelta no tenía corrección. Si la administradora ponía "Falta" en la mañana y el
trabajador llegaba después, su entrada se rechazaba (ya había un registro ese día) y la falta ya no se podía
cambiar: la nómina la descontaba aunque sí trabajó. Un clic equivocado en "Falta" en vez de "Retardo" también
quedaba para siempre.

**Regla (decisión de Oscar):** el trabajador tiene hasta que acaba el horario de 8 a 5 para justificar. Por eso
una resolución se puede **corregir el mismo día, hasta las 17:00**, mientras la nómina de esa semana no esté
pagada. Pasado ese plazo queda firme.

- **API, `PATCH /asistencia/:id/omision`:**
  - Acepta también registros ya resueltos (falta o retardo con `omision_resuelta_en`), dentro del plazo. Incluye
    las faltas creadas a quien no checó nada.
  - La escritura es condicional sobre la resolución que se leyó (estado y `omision_resuelta_en`): si otra persona
    corrige al mismo tiempo, la segunda recibe 409.
  - La auditoría guarda el valor anterior y `metadata.correccion = true`.
  - Fuera del plazo: 409 `OMISION_YA_RESUELTA`.
  - Un registro que nunca fue omisión sigue dando 409 `NO_ES_OMISION`.
- **Vista de Asistencia:**
  - En el detalle del registro aparece **"Corregir resolución"** para una omisión resuelta hoy, antes de las
    17:00.
  - Abre el mismo formulario con el título "Corregir omisión". Dice cómo se resolvió y con qué motivo, y que se
    puede corregir hasta las 17:00.
  - El aviso final dice "corregida" o "resuelta".

## Archivos tocados
- `apps/api/src/asistencia/asistencia.service.ts`
- `apps/api/src/asistencia/asistencia.service.spec.ts`
- `apps/api/src/asistencia/asistencia.integration.spec.ts`
- `apps/web/src/app/(dashboard)/asistencia/page.tsx`
- `apps/web/src/components/workers/AsistenciaGpsModal.tsx`

## Verificación
- Pruebas unitarias con la hora fijada (escritas primero; 3 fallaron antes del arreglo):
  - Corregir a las 10:00 del mismo día procede, condicionado a la resolución leída y auditado como corrección.
  - A las 17:00 o al día siguiente da 409.
  - Una corrección simultánea da 409.
  - Un registro que nunca fue omisión da `NO_ES_OMISION`.
  - Unitarias de Asistencia: 115 de 115.
- Integración contra Postgres real: 12 de 12. La prueba de "una sola resolución" ahora usa un día pasado,
  porque con la fecha de hoy su resultado habría dependido de la hora a la que se corriera.
- `npx tsc --noEmit` (api y web) y `npx eslint` de los archivos tocados: sin errores.

## Pendientes
- **Probar en el navegador "Corregir resolución" en horario laboral (antes de las 17:00).** Esta verificación se
  hizo pasadas las 22:00, cuando la regla correctamente no ofrece el botón.
