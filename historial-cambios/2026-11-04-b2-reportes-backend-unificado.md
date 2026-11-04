# B2 Backend unificado — asignar/quién-resuelve/stats por área

**Fecha:** 2026-11-04
**Autor:** agente OpenCode (a petición del usuario)

## Cambios realizados
- **`PATCH /api/reportes-campo/:id/asignar`** — define "quién le cae":
  `asignadoA` (FK trabajador activo) y/o `asignadoNombre` (texto libre); ambos tras
  limpieza, ninguno → `ASIGNACION_VACIA` 400; terminal (RESUELTO/FACTURADO) →
  `REPORTE_TERMINAL`. Audita `REPORTE_ASIGNADO` (acción NUEVA en enum AuditAction,
  migración aditiva 20261104000100) con FAIL+error_code antes de lanzar.
- `cambiarEstado → RESUELTO` ahora fija **`resuelto_en`** y en el audit newValue
  incluye `resueltoPor` (nombre del asignado o "Sin asignar").
- `serialize` expone `asignadoAId/asignadoANombre/asignadoAPuesto/asignadoEn/resueltoEn`.
- `GET stats` ahora incluye **`porArea`** (groupBy tipo con labels legibles) para los
  chips de filtro del frontend.
- Label del área `ADMINISTRATIVO` ('Administrativo').
- **Módulo `incidentes` eliminado por completo** (controller/service/DTOs/specs,
  import y registro en app.module) — nada del sistema lo usaba (verificado).
- Specs actualizados: service 37 pruebas (asignar, resuelto_en, porArea,
  expectativas existentes adaptadas), controller +1 (asignar delega),
  **integration spec +5 pruebas reales**: asignación real con trabajador del seed,
  FAIL real de TRABAJADOR_NO_ENCONTRADO/ASIGNACION_VACIA con error_code en
  registro_auditoria, flujo asignar→resolver persistiendo resuelto_en,
  unicidad de `codigo` (P2002 sin dobles) e inmutabilidad del trigger
  `trg_audit_immutable_delete`.

## Archivos tocados
- `apps/api/src/reportes-campo/*` (service, controller, DTOs, specs)
- `apps/api/src/audit/audit.constants.ts` (severidad de la acción nueva)
- `apps/api/src/app.module.ts` (fuera IncidentesModule)
- `apps/api/src/incidentes/` (eliminado, -1638 líneas)

## Pruebas / verificación
- Unit: reportes-campo.service.spec 37/37 ✔; `npm run test` 958/960 (2 fallas
  preexistentes de cobranza CSV — ajenas).
- `test:integration` reportes-campo 15/15 ✔ (con datos reales).
- `npx tsc --noEmit` (api) ✔.

## Pendientes y riesgos
- Ruta de vista: `/reportes` estaba tomada por la página mock "Reportes" (Sistema);
  la vista unificada vive en **`/reportes-operaciones`**.
- Frontend aún apunta a la API vieja de incidentes (siguiente bloque B3).
