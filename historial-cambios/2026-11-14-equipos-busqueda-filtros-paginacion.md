# 2026-11-14 — /equipos: búsqueda, filtros y paginación (patrón /inventario)

## Qué se hizo

La tabla de `/equipos` no tenía búsqueda, filtros ni paginación — se
agregaron con el patrón client-side de `/roles` e inventario:

- **SearchBar**: filtra residentes por nombre, correo o número de empleado
  (y también la lista del modal "Asignar trabajador").
- **Filtros** (botón + panel): Área (torre) y Equipo (con trabajadores /
  sin trabajadores). El filtro de Área también aplica a la lista de
  "candidatos sin jefe" del modal de asignación.
- **Pagination**: client-side, 10 filas por página, reset de página al
  cambiar búsqueda o filtros.
- KPIs se quedan sobre el TOTAL (no sobre el filtrado) — son métricas
  globales de la vista.

Sin cambios de backend (todo client-side: hoy 4 residentes, 27 sin jefe).

## Verificación

- `npx tsc --noEmit` (web): limpio; eslint solo el error patrón
  preexistente (`set-state-in-effect` del fetch inicial).
- Smoke visual en navegador pendiente (sin navegador).
