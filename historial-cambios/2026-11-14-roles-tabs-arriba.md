# 2026-11-14 — /roles: tabs arriba de la barra de búsqueda (como conciliación)

## Qué se hizo

Reorden de bloques en `/roles`: los **tabs compactos van primero**, y la
barra de búsqueda + filtros va después (así filtran el contenido del tab
activo, igual que en la vista de referencia). El orden quedó:

1. PageHeader (acción "Nuevo Rol")
2. KPIs por tab
3. **Tabs compactos**
4. Búsqueda + Filtros
5. DataTable + Pagination

Solo se movieron bloques JSX — cero cambios de lógica.

## Verificación

- `npx tsc --noEmit` (web): limpio; eslint solo el error patrón
  preexistente.
- Smoke visual en navegador pendiente (sin navegador).
