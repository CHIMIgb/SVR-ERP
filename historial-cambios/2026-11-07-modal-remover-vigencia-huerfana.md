# Pulido modal Ver Detalle — remover label huérfano "Vigencia del proyecto"

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Diagnóstico
El span "Vigencia del proyecto" (con icono Calendar) junto al badge de estado era
**texto estático sin fechas** — las fechas reales viven en el subtítulo del header
("Constructora ABC / SCT · 04/11/2026 al 27/08/2027"). Sobrante de una versión
anterior del diseño. Decisión del usuario: eliminar el span.

## Cambios realizados (`ProjectDetailsModal.tsx`)
- Eliminado el span "Vigencia del proyecto" (+ su icono Calendar) — la fila queda
  solo con el Badge de estado (lo que ahí corresponde).
- Import `Calendar` eliminado (quedaba sin uso — verificado con grep: solo esa línea
  lo usaba).

## Verificación
- `npx tsc --noEmit` (apps/web): sin error.

## Pendientes y riesgos
- Ninguno estructural; cambio visual mínimo (una fila del modal más limpia).
