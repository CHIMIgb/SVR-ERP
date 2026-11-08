# La nómina solo paga horas extra autorizadas, al monto autorizado

**Fecha:** 2026-11-08
**Autor:** P4chec0php

## Cambios realizados
**Bug:** al sincronizar, la nómina pagaba **todas** las horas extra de la semana: pendientes, en curso,
rechazadas y hasta las borradas. Además las pagaba a la tarifa del trabajador, aunque al registrarlas se hubiera
capturado otra. La consulta semanal (`findSemanal`) sumaba `horas_calculadas` sin mirar el estado.

Ahora:
- **Resumen semanal de Asistencia:** agrega `totalHorasExtraAprobadas`, `montoHorasExtraAprobadas` y
  `totalHorasExtraSinAutorizar` (pendientes o en curso). `totalHorasExtra` se queda y ahora cuenta solo las
  registradas vigentes (sin rechazadas ni borradas).
- **Nómina, `sincronizar`:** paga solo las aprobadas, al `monto_total` con que se aprobaron (incluye la tarifa
  capturada a mano). La percepción se llama "Horas extra autorizadas". La respuesta agrega
  `totalHorasExtraSinAutorizar`, y la vista avisa: "X h extra todavía sin autorizar no se pagaron".
- **Aprobar o rechazar horas extra:**
  - Solo desde "Pendiente".
  - Si ya están resueltas, 409 `HORAS_EXTRA_YA_RESUELTAS`. Antes se podían rechazar después de pagadas.
  - Si siguen "En curso", 400 `HORAS_EXTRA_EN_CURSO`: todavía no tienen hora de fin.
  - Con la nómina de esa semana pagada, 409 `NOMINA_PAGADA`.
  - La escritura es condicional (`updateMany` con `estado: PENDIENTE`): si dos personas resuelven al mismo
    tiempo, la segunda recibe 409 y no pisa la decisión de la primera.
  - La auditoría guarda el estado anterior.
- **Vista de Asistencia:** "Autorizar" solo aparece en horas pendientes. Las que van "En curso" y las
  "Rechazadas" muestran su estado.

## Archivos tocados
- `apps/api/src/asistencia/asistencia.service.ts`
- `apps/api/src/asistencia/asistencia.service.spec.ts`
- `apps/api/src/nomina/nomina.service.ts`
- `apps/api/src/nomina/nomina.service.spec.ts`
- `apps/api/src/nomina/nomina.integration.spec.ts`
- `apps/web/src/lib/api.ts`
- `apps/web/src/app/(dashboard)/asistencia/page.tsx`
- `apps/web/src/app/(dashboard)/nomina/page.tsx`

## Verificación
- Primero las pruebas, que fallaron antes del arreglo.
- Unitarias de Asistencia y Nómina: 133 de 133. Cubren la semana con horas aprobadas, pendientes, en curso,
  rechazadas y borradas, y aprobar en cada estado, con la nómina pagada y en carrera.
- Integración contra Postgres real (Asistencia y Nómina): 18 de 18.
  - Horas registradas con tarifa capturada de $150 a un trabajador de $120.
  - Sin autorizar no se pagan.
  - Ya autorizadas se pagan $450, no $360.
  - Rechazarlas después da 409 auditado.
  - Nueva prueba de FAIL auditado en Nómina (`PERIODO_NO_ENCONTRADO`).
- `npx tsc --noEmit` en `apps/api` y en `apps/web`, y `npx eslint` de las vistas tocadas: sin errores.
- Smoke con la API corriendo: el resumen semanal trae los campos nuevos, y aprobar unas horas extra
  inexistentes da 404.

## Pendientes
- La tarifa de horas extra que pide la LFT (el doble) sigue pendiente de decisión con Oscar.
