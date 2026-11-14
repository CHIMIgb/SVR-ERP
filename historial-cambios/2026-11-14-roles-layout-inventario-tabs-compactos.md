# 2026-11-14 — /roles: tabs compactos (prop `compact` en Tabs) y disposición de /inventario

## Qué se hizo

**1. Tabs compactos — prop `compact` en el componente reutilizable:**
- `Tabs.tsx`: nueva prop opcional `compact?: boolean` → la lista de
  pestañas se achica al contenido (`w-fit`) en vez de estirarse a todo el
  ancho — el estilo de la barra de conciliación-bancaria que pidió el
  cliente (esa vista lo tenía hecho a mano; ahora el componente lo soporta).
- **COMPONENTS.md** documentado: fila en la tabla de props + nota de cuándo
  usar la variante compacta.
- Los otros 8+ usos de `<Tabs>` no cambian (default = como hoy).

**2. /roles con la disposición de /inventario** (todo client-side, sin
cambios de backend):
- **PageHeader** con la acción **"Nuevo Rol"** (solo en tab Roles, con
  `skeleton={initialLoading}`) — se quitó de dentro del panel.
- **StatsCards por tab (3 KPIs cada una)**: Roles → Roles del sistema ·
  Usuarios con acceso (suma) · Roles sin usuarios. Usuarios → Usuarios con
  cuenta · Sin rol asignado · Sesiones activas (suma). Con skeleton.
- **SearchBar + botón Filtros + panel de filtros** por tab: Roles → Área +
  Uso (con usuarios / sin uso); Usuarios → Área + Estado PIN.
- **Tabs compactos** justo encima de la tabla (con conteo en el tab
  contrario).
- **DataTable** filtrado y paginado client-side (PAGE_SIZE 10, reset de
  página al cambiar búsqueda/filtros).
- **Pagination** debajo de cada tabla.

## Verificación

- `npx tsc --noEmit` (web): limpio; eslint solo el error patrón
  preexistente (`set-state-in-effect` del fetch inicial) y cero warnings.
- Smoke visual en navegador pendiente (sin navegador).
