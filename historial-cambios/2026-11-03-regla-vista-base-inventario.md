# Regla: toda vista nueva toma /inventario como plantilla base

**Fecha:** 2026-11-03
**Autor:** agente OpenCode (a petición del usuario)

## Cambios realizados
- Se endurece la regla de construcción de vistas: toda vista nueva se toma
  `/inventario` como base — nunca desde cero — con su patrón completo
  (PageHeader, StatsCards, SearchBar + filtros, DataTable con RBAC,
  Pagination, FormModal).
  - `AGENTS.md`: nueva regla crítica "**NUEVA VISTA = PLANTILLA `/inventario`**"
    en la sección Critical Rules (la sección de estándares ya lo indicaba).
  - `.opencode/agent/svr-erp.md`: el estándar de vista CRUD ahora dice
    "regla dura: SIEMPRE toma `/inventario` como plantilla base".

## Cosas nuevas
- Ninguna funcionalmente; es formalización de una regla existente.

## Archivos tocados
- `AGENTS.md` (modificado)
- `.opencode/agent/svr-erp.md` (modificado)

## Pruebas / verificación
- N/A (solo documentación).

## Pendientes y riesgos
- Ninguno.
