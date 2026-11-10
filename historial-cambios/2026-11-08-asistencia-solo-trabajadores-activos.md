# Asistencia solo para trabajadores activos

**Fecha:** 2026-11-08
**Autor:** P4chec0php

## Cambios realizados
**Bug:** se le podía checar entrada, pasar lista, registrar falta o resolver una omisión sin marcaje a un
trabajador **dado de baja** (o de vacaciones). La API solo revisaba que no estuviera borrado (`eliminado_en`), y
la vista lo ofrecía en el select de marcaje y en el pase de lista. Un trabajador finiquitado podía seguir
acumulando días.

Ahora:
- **API:** entrada, pase de lista, falta y omisión sin marcaje exigen `estado = ACTIVO`.
  - Dado de baja: 409 `TRABAJADOR_DADO_DE_BAJA`.
  - De vacaciones: 409 `TRABAJADOR_DE_VACACIONES`.
  - Pase de lista con alguien no activo: 409 `TRABAJADORES_NO_ACTIVOS`, que nombra a quiénes. No se registra a
    nadie de esa cuadrilla.
  - Todos quedan auditados antes de lanzar.
  - La salida no se restringe: cierra un día que ya empezó.
- **Vista de Asistencia:** el select de marcaje y la lista del pase de lista solo ofrecen activos, y el
  trabajador propuesto es el primer activo. La lista completa se sigue cargando para mostrar el nombre en
  registros anteriores.

## Archivos tocados
- `apps/api/src/asistencia/asistencia.service.ts`
- `apps/api/src/asistencia/asistencia.service.spec.ts`
- `apps/api/src/asistencia/asistencia.integration.spec.ts`
- `apps/web/src/app/(dashboard)/asistencia/page.tsx`

## Verificación
- Las pruebas se escribieron primero: 5 unitarias nuevas fallaron antes del arreglo.
- Unitarias de Asistencia: 111 de 111.
- Integración contra Postgres real: 12 de 12. El caso nuevo da de baja a un trabajador y comprueba que la
  entrada da 409, que no se escribe ningún registro y que queda la auditoría FAIL con `TRABAJADOR_DADO_DE_BAJA`.
- `npx tsc --noEmit` (api y web) y `npx eslint` de la vista: sin errores.
- En el navegador, el select del modal "Marcar entrada / salida" muestra 46 opciones, las mismas que los
  trabajadores activos que reporta la API. Los 3 dados de baja ya no aparecen.

## Pendientes
- Ninguno.
