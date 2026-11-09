# Ubicación real en /reportes: proyecto EN_PROCESO (tabla proyectos) o GPS · label Área corregido

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

Corrección del cliente: el select de las torres **ya estaba mal rotulado como
"Ubicación"; es el ÁREA** — y la ubicación física vuelve como campo separado
(el que hubo en la v1: proyecto o GPS), ya sin la tabla obras.

- **Área (a la que se envía)**: misma área + las 6 torres (no cambia la lógica).
- **Ubicación (nuevo campo, requerido en modales):** radio **"Proyecto" /
  "Ubicación GPS"**:
  - Proyecto → select del catálogo **tabla `proyectos` con estado EN_PROCESO**
    (`proyectosApi.listar`); la tabla obras queda fuera del flujo.
  - GPS → se captura con la geolocalización al guardar (lat/long ambos).
- BD: migración `20261108200000_reporte_ubicacion_proyecto_gps` — re-introduce
  `reportes_campo.proyecto_id` (FK proyectos, ON DELETE SET NULL) + índice.
  `latitud/longitud` ya existían y volvieron al flujo.
- Backend: `proyectoId/latitud/longitud` en create/update (crear: valida que el
  proyecto exista y esté EN_PROCESO → `PROYECTO_NO_EN_PROCESO` auditado; regla
  "proyecto o GPS, no ambos y no parciales" → `UBICACION_INVALIDA`); serialize
  vuelve a exponer proyecto/lat/long; include de proyectos.
- UI tabla: columna antes rotulada como "Ubicación" ahora se llama **"Área"**
  (contenido igual, area destino); el detalle muestra fila nueva "Ubicación"
  (proyecto o GPS) junto a "Área".

## Archivos tocados

- `apps/api/prisma/schema.prisma` + migration
- `apps/api/src/reportes-campo` (DTOs, service helpers resolverProyecto/validarUbicacionGps)
- `apps/web/src/lib/api.ts` (DTO con proyecto/lat/long)
- `apps/web/src/app/(dashboard)/reportes/page.tsx` (labels, radios, catálogo, preselección en editar)

## Pruebas / verificación

- Unitarios 72/72 · integración real 24/24 · `tsc --noEmit` api+web · eslint 0.
- E2E real: proyecto 'Escuela Secundaria' (EN_PROCESO) → INC0038 con
  `proyecto=Escuela Secundaria`; proyecto inexistente/NO_EN_PROCESO → 400
  auditado. GPS verificado en el v1 previo (mismo geolocator).

## Pendientes y riesgos

- El índice/perfil de la vista del empleado sigue pendiente (siguiente diseño).
- La columna física "Ubicación" en la TABLA fue sustituida por "Área" según la
  corrección; si quieres una columna adicional con proyecto/GPS en la tabla,
  es un renglón más.
