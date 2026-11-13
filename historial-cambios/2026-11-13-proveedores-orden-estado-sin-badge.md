# 2026-11-13 — /proveedores: estado de órdenes como texto (sin badge)

## Qué se hizo

- **`apps/web/src/app/(dashboard)/proveedores/page.tsx`** — la columna
  **Estado** del tab Órdenes de Compra ya no pinta badges de color:
  solo el texto (Pendiente/Aprobada/Recibida/Cancelada), mismo patrón que
  Estado en clientes y cotizaciones y Categoría en proveedores.
  Se eliminó el mapa `estadoVariant` y el import de `Badge` que quedaron sin
  uso (la página ya no usa badges en ninguna columna).

## Verificación

- `npx tsc --noEmit` (web): limpio.
- `npx eslint` del archivo: sin hallazgos.

## Pendientes / riesgos

- Smoke visual pendiente (sin navegador).
