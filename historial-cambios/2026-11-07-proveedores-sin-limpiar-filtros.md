# Ajuste /proveedores — ocultar botón "Limpiar" del panel de filtros

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Cambios realizados
- `/proveedores`: el botón "Limpiar" rojo DENTRO del panel de filtros ya no se
  muestra en ninguno de los 3 tabs (Proveedores / Órdenes / Estados de cuenta).
  Es el botón que renderiza `FilterPanel` cuando recibe la prop `onClear` —
  se retiró la prop de los 3 usos (idempotente: primera pasada por error format
  dejó 1 de 3, segunda a favor de limpieza total).
- NO se tocó el otro "Limpiar": el botón que limpia TODOS los chips activos
  (`ActiveFilters onClearAll={handleClearFilters}`) sigue vivo — el chip por
  filtro `onRemove` también funciona como antes.

## Verificación
- `npx tsc --noEmit`: 0 errores; sin `unused` (handleClearFilters continúa
  referenciado por los chips).
- `grep onClear=` en la página: 0 en `<FilterPanel`, 3 en `ActiveFilters
  onClear` mantenido.
