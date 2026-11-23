# /m/reportes con paginación del kit (adiós al botón «Cargar más»)

**Fecha:** 2026-11-20
**Autor:** agente

## Cambios realizados
- La lista de `(pwa)/m/reportes` ahora navega **una página a la vez** con el
  componente `Pagination` del kit compartido (misma mecánica del escritorio):
  - Se eliminaron el botón «Cargar más» y el modo append de `recargar` (con
    su dedupe por id, que existía para la carrera del append — con
    reemplazo puro ya no es necesario).
  - `recargar(pagina)` ahora SIEMPRE reemplaza la lista con la página
    pedida y guarda `total`/`totalPages` de la paginación del server.
  - `Pagination` (currentPage/totalPages/totalRecords/pageSize/onPageChange)
    se muestra solo cuando `totalPages > 1` y la carga inicial terminó; el
    `RefreshOverlay` cubre los cambios de página.
- Los 8 callers de `recargar` (carga inicial, debounce, online, encolar,
  aceptar, cambiar estado, asignar) quedaron con la firma nueva.

## Archivos tocados
- `apps/web/src/app/(pwa)/m/reportes/page.tsx`
- `historial-cambios/2026-11-20-pwa-paginacion-reportes.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 37 warnings preexistentes.
- `git diff --check`: sin errores.
- Smoke pendiente: navegar páginas con filtros activos (el contador del server
  respeta search/estado), y que la página se pierde a la primera con «página
  2 de 1» (Pagination no se renderiza si hay una sola).

## Pendientes y riesgos
- El `Pagination` del kit es de estética escritorio: se reusa tal cual (regla
  del kit primero); si en el teléfono se ve denso, ajuste visual posterior.
- Sin push: el commit queda local.
