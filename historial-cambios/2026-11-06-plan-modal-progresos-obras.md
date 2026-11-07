# Planificación — modal Ver Detalle, metas de progreso (P8) y gap de obras en /operaciones

**Fecha:** 2026-11-06
**Autor:** agente OpenCode

## Cambios realizados
Actualización de `docs-planes/IMPLEMENTACIONES-A-FUTURO.md` (solo docs, sin código):

1. **§6.6.1 nueva — anatomía del modal "Ver detalle" (`ProjectDetailsModal.tsx`):**
   tabla con los 4 bloques (header, curva S LineChart plan vs real, rentabilidad y
   costo real con desglose por concepto + margen, desempeño EVM CPI/SPI, personal y
   flota), tipo de dato y fuente real de cada uno (todo mock aún; el modelo
   `hitos_progreso` existe para alimentar la curva S). Incluye el pendiente del
   **contraste en modo oscuro**: colores light hardcodeados (`text-slate-900/600/400`,
   `bg-green-100`, `bg-blue-50`) sin variantes `dark:` → letras pierden contraste.
2. **P8 nueva — metas de progreso con fecha límite** (idea del cliente aprobada,
   detallada sobre lo existente): ampliar `hitos_progreso` con `fecha_limite` y
   `estado PENDIENTE/CUMPLIDA`; progreso de proyecto con metas = derivado (última
   meta cumplida), sin metas = manual como hoy; transición condicional anti doble
   marca; badge "Vencida" derivado; secciones en el registro del proyecto y en el
   modal; cruce futuro con reportes-campo; tests unit + integración.
3. **§6.1 y §6.6 — gap confirmado en BD real (no es bug de filtro):** el catálogo de
   `/operaciones` (`GET /bitacora/catalogos`, obras `estado != FINALIZADA`) es
   correcto; el problema es de datos: la BD tiene solo 3 obras y de los 6 proyectos
   EN_PROCESO solo 2 tienen obra. El arreglo pendiente es cerrar el flujo
   "proyecto → obra" (6.6) y/o sembrar las obras de los proyectos activos.
4. **§7:** filas 6.1/6.3/6.6 actualizadas + fila nueva P8; índice con P8.

## Verificación contra código y BD real (para redactar los textos)
- `ProjectDetailsModal.tsx` leído completo: bloques, cálculo CPI/SPI local, mocks
  (`allTrabajadores`, `allMaquinaria`, `despachosFlota` de `@/lib/data`).
- `bitacora.service.ts findCatalogos()`: obras con `estado != FINALIZADA` (correcto),
  sin límite artificial de filas.
- Query en `svr_erp` real: 3 obras (2 EN_PROCESO de 2 proyectos + 1 de un proyecto
  FINALIZADO); `proyectos`: 6 EN_PROCESO, 2 FINALIZADO, 1 PAUSADO.
- `schema.prisma`: `hitos_progreso` existe (sin `fecha_limite` ni estado).

## Archivos tocados
- `docs-planes/IMPLEMENTACIONES-A-FUTURO.md`

## Pendientes y riesgos
- **Decisión de usuario pendiente para el gap de /operaciones:** (a) cerrar flujo
  "crear obra desde proyecto" en código, y/o (b) sembrar las obras de los 4
  proyectos activos en la BD — ninguno implementado todavía (requiere autorización).
- P8 es diseño: la migración y el derivado del progreso NO están implementados.
- El fix de contraste dark del modal NO está implementado (documentado en 6.6.1).
