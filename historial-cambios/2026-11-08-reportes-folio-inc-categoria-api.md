# /reportes — folio INC + categoría responsable (backend)

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

Segunda mitad del rediseño de `/reportes` (parte backend del plan autorizado):

1. **Folio único uniforme `INC0001`**: la migración renumeró los 23 códigos del
   demo (`RC006..RC021` → `INC0001..INC0023`, orden preservado). El `create` de
   `reportes-campo.service.ts` genera el siguiente folio `INC%04d` leyendo el
   máximo contra `codigo startsWith 'INC'`, dentro del flujo del create, con
   reintento anti-colisión P2002 (patrón de facturas) y respaldo UUID en el
   último intento. Antes: creaba con `codigo = null` (filas nuevas sin folio).
2. **Categoría responsable**: nuevo enum `CategoriaReporte`
   (`MECANICO/SOLDADOR/DIESEL/MANTENIMIENTO/ADMINISTRATIVO/RESIDENTE`) +
   columna `reportes_campo.categoria` (nullable). Es la "torre que atiende":
   el trabajador la elige al crear y el reporte sale para toda esa torre
   (concepto de la PWA móvil de `nueva-info/info.md`; el enrutado real llega
   con la PWA — aquí solo se persiste y se muestra).
   Backfill best-effort del demo: MECANICO→MECANICO, ADMINISTRATIVO→
   ADMINISTRATIVO, PIPERO→DIESEL (repartidor de diésel), INGENIERO→RESIDENTE;
   el resto queda NULL. DTO: `categoria` requerida en create, opcional en
   update. `serialize` la expone en TitleCase (mapeo junto al service).

## Cosas nuevas

- Migración `20261108100000_folio_inc_y_categoria_reportes` (SQL).
- `CATEGORIA_LABELS` y `MAX_INTENTOS_FOLIO` en el service.
- Tests: 2 unitarios nuevos (folio formato/correlativo, filtrado por 'INC') +
  2 de integración real (folio secuencial único con auditoría SUCCESS y
  valor crudo del enum en BD; `categoria` inválida rechazada por PG). Helper
  `createDto` de ambos specs actualizado con `categoria: DIESEL`.

## Archivos tocados

- `apps/api/prisma/migrations/20261108100000_folio_inc_y_categoria_reportes/migration.sql` (nuevo)
- `apps/api/prisma/schema.prisma` (enum + campo)
- `apps/api/src/reportes-campo/reportes-campo.service.ts` (folio en create con reintentos, categoria en create/update/serialize)
- `apps/api/src/reportes-campo/dto/create-reporte-campo.dto.ts` / `update-reporte-campo.dto.ts` (categoria)
- `apps/api/src/reportes-campo/reportes-campo.service.spec.ts` / `reportes-campo.integration.spec.ts` (tests)

## Pruebas / verificación

- `npx prisma validate` OK; `migrate deploy` aplicada; post-migración:
  códigos INC0001+ y backfill visible (`MECANICO/MECANICO`, `PIPERO/DIESEL`, resto NULL).
- `npx tsc --noEmit` OK.
- Unitarios del módulo: 42/42 (`npx jest ...service.spec.ts`).
- Integración real (`jest.integration.config.js`): 18/18 — create genera
  folio consecutivo distinto, enum crudo `DIESEL` en BD, SUCCESS auditado.

## Pendientes y riesgos

- Reportes viejos con categoria NULL muestran "—" hasta que se editen.
- La asignación por persona (modal Asignar) sigue intacta: la columna
  RESPONSABLE del UI muestra la categoría; "quién lo resolvió" sigue siendo
  el trabajador asignado.
