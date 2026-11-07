# Módulo de reportes en /reportes (URL y menú) — sin badge NUEVO

**Fecha:** 2026-11-04
**Autor:** agente OpenCode (a petición del usuario)

## Cambios realizados
- La vista unificada vive ahora en **`/reportes`** (URL y menú "Reportes", sin
  badge NUEVO). Se movió el folder `(dashboard)/reportes-operaciones` →
  `(dashboard)/reportes` (git mv) y se actualizó `VISTA_RUTA` interno.
- **Se eliminó la página mock anterior de `/reportes`** (grupo Sistema, 6KB, sin
  API ni datos reales) para liberar la ruta.
- Sidebar `ROUTE_META`: `' /reportes': { group: 'Operaciones' }` (fuera
  `/reportes-operaciones` y la entrada Sistema vieja); Topbar (búsqueda global)
  y el botón del dashboard apuntan a `/reportes`.
- BD: la vista `/reportes` (ex-Sistema "Reportes") fue repurposeada a
  nombre 'Reportes', icono 'AlertTriangle', grupo Operaciones — conservando su
  role_vistas (Administrador: todo ✓); la fila `/reportes-operaciones` y sus
  role_vistas fueron eliminadas. Vistas totales: 24.

## Archivos tocados
- `apps/web/src/app/(dashboard)/reportes/page.tsx` (la unificada, movida)
- `apps/web/src/app/(dashboard)/reportes-operaciones/page.tsx` (eliminada al mover)
- `apps/web/src/app/(dashboard)/reportes/…` vieja mock (eliminada)
- `Sidebar.tsx`, `Topbar.tsx`, `dashboard/page.tsx`
- BD svr_erp: vistas/role_vistas ajustadas

## Pruebas / verificación
- `npx tsc --noEmit` (web) ✔
- psql: 1 sola vista '/reportes' con icono AlertTriangle y role_vistas del
  Administrador ✔; total vistas 24 ✔.

## Pendientes y riesgos
- Si había bookmarks a la mock `/reportes` (Sistema), ya apuntan al módulo
  nuevo de operaciones (intención del usuario).
- Los dumps viejos de BD reintroducirían las vistas fantasma — anotado en
  registros anteriores.
