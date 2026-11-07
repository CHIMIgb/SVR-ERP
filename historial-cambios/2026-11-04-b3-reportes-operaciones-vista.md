# B3 Frontend — vista unificada /reportes-operaciones

**Fecha:** 2026-11-04
**Autor:** agente OpenCode (a petición del usuario)

## Cambios realizados
- **Nueva vista `/reportes-operaciones`** ("Reportes de Operación", plantilla de la
  vista de reportes-campo, patrón /inventario):
  - **Chips de Área** con conteos reales por tipo (Todos / Incidente / Mecanico /
    Administrativo / Pipero / Operador / Checador / Ingeniero / Trabajador) — buscar
    sin abrir el panel de filtros; el panel sigue disponible (estado/prioridad/tipo).
  - **Responsable (quién le cae)** visible en cada tarjeta
    (`Responsable: <nombre>`) y al resolverse muestra **quién lo resolvió + fecha**
    (`resuelto_en`).
  - **Botón Asignar/Reasignar** (no terminal) + **Modal de asignación**:
    select de trabajadores del sistema o nombre libre; al avanzar a RESUELTO sin
    asignación previa, pide asignar primero (regla del negocio).
  - Área `Administrativo` disponible en chips, filtros y modales (icono Briefcase).
- Regla del negocio implementada en handleAvanzar: `Marcar Resuelto` exige
  responsable asignado previamente.
- `lib/api.ts`: fuera `incidentesApi` con sus DTOs; `ReporteCampoDTO` con campos de
  asignación/resolución; `ReportesCampoStats.porArea`; `reportesCampoApi.asignar`;
  `TipoReporte/Api` con `ADMINISTRATIVO`.
- Eliminadas las páginas `/incidentes` y `/reportes-campo`; sidebar
  (ROUTE_META) y Topbar (búsqueda global) apuntan a la ruta nueva; dashboard
  "Reportes de Campo" → "Reportes de Operación".

## Archivos tocados
- `apps/web/src/app/(dashboard)/reportes-operaciones/page.tsx` (nueva; renombrada de la de reportes-campo, 81% común)
- `apps/web/src/app/(dashboard)/incidentes/page.tsx` (eliminada)
- `apps/web/src/app/(dashboard)/reportes-campo/page.tsx` (eliminada)
- `apps/web/src/lib/api.ts`
- `Sidebar.tsx` / `Topbar.tsx` / `dashboard/page.tsx` (rutas)

## Pruebas / verificación
- `npx tsc --noEmit` (web) ✔
- eslint en archivos tocados: 0 errores (11 warnings pre-existentes) ✔
- Backend ya corriendo los endpoints usados (bloque B2 con tests).

## Pendientes y riesgos
- Prueba visual en navegador pendiente (chips, asignar, resolver).
- La vista "Reportes" (grupo Sistema, mock) sigue existiendo con ruta `/reportes`
  — distinta de la nueva; si confunde, renombrarla luego.
