# Paginación de /m/reportes siempre visible

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** pedido del usuario — que el componente de paginación siempre se muestre en los reportes de la PWA

## Cambios realizados
- `(pwa)/m/reportes/page.tsx`: el `Pagination` del kit ya no se oculta cuando
  hay una sola página — se muestra siempre que la carga inicial terminó
  (antes: `totalPaginas > 1` lo escondía).

## Archivos tocados
- `apps/web/src/app/(pwa)/m/reportes/page.tsx`
- `historial-cambios/2026-11-20-paginacion-siempre-visible.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 37 warnings preexistentes.
- `git diff --check`: sin errores.
- Smoke pendiente: el paginador visible con pocos reportes (1 página).

## Pendientes y riesgos
- Sin push: el commit queda local.
