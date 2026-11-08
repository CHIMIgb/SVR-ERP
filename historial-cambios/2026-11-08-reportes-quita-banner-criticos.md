# /reportes — quita el banner de incidentes críticos

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

Eliminado el banner rojo "Incidentes Críticos Activos" (y su botón "Ver incidentes
críticos") de la vista /reportes. Era la única forma de activar el filtro oculto
`soloCriticos` → también se quitó por completo de la página (estado, chip, handler
especial y el parámetro `criticos` de fetchData). Los críticos siguen visibles vía
el filtro normal de Prioridad (Alta/Crítica) + Estado.

## Archivos tocados

- `apps/web/src/app/(dashboard)/reportes/page.tsx` (banner fuera + limpieza `soloCriticos`)

## Pruebas / verificación

- `npx tsc --noEmit` (web) OK; `eslint` de la página: 0 problemas tras quitar el
  import `AlertTriangle` que quedó sin uso.
- Sin cambios de backend: el parámetro opcional `criticos` del endpoint sigue
  existing y funcionando (solo dejó de usarse desde este UI).

## Pendientes y riesgos

- Si más adelante quieren volver a ver los críticos con un click, se puede
  re-agregar como botón/filtro fijo — hoy el camino es el filtro de Prioridad.
