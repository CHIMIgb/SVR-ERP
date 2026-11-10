# /reportes — gestión de imágenes dentro del modal Editar

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

El modal Editar ya no queda sin imágenes: una sección "Imágenes del incidente"
carga los adjuntos existentes (via `detalle`) y permite **subir más desde ahí**
(mismo convertidor WebP + límites máx 4 / 2 MB / valida backend).
- `subirAdjunto(reporteId, file)` ahora es la función común: el detalle y el
  editar consumen lo mismo (excess code eliminado).
- El modal carga adjuntos al abrir (null = "Cargando imágenes…"); sin endpoint
  de borrado de adjuntos aún — quitar solo existe en el alta (staging local).

## Archivos tocados

- `apps/web/src/app/(dashboard)/reportes/page.tsx`

## Pruebas / verificación

- `npx tsc --noEmit` OK; `eslint` página: 0 problemas.
- Subida real no corrída por fetch (browser) — cadena server cubierta por los
  tests de integración reales; subida manual por E2E de turnos pasados.

## Pendientes y riesgos

- Falta endpoint de "quitar adjunto" en el backend: desde el Editar no se puede
  borrar una imagen (solo desde el alta, que es staging local). Agregarlo es
  DELETE /:id/adjuntos/:adjuntoid + botón X — se pide aparte si se quiere.
