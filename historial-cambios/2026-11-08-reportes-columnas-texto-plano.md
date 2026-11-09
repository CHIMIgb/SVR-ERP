# /reportes — columnas Ubicación/Prioridad/Estado en texto plano (sin badges)

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

Alineación visual solicitada: las columnas **Ubicación, Prioridad y Estado**
dejan de usar badges de color y muestran solo el texto normal (igual que el
resto de columnas: `text-xs font-semibold`, y "—"/"Sin área" cuando vacían).
Código muerto fuera: `categoriaVariant`, `estadoVariant`, `prioridadVariant`,
imports sin uso (Badge, PrioridadReporte, EstadoIncidenteUI).

## Archivos tocados

- `apps/web/src/app/(dashboard)/reportes/page.tsx`

## Pruebas / verificación

- `npx tsc --noEmit` OK; `eslint` de la página: 0 problemas/0 warnings.
- Los filtros y el detalle no cambian (siguen con sus selects/labels).

## Pendientes y riesgos

- Si se quieren colores de vuelta para algún estado crítico, es reagregar el
  Badge puntual — hoy queda plano por decisión del cliente.
