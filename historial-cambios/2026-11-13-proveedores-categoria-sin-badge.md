# 2026-11-13 — /proveedores: categoría como texto (sin badge)

## Qué se hizo

- **`apps/web/src/app/(dashboard)/proveedores/page.tsx`** — la columna
  **Categoría** de la tabla de proveedores ya no pinta badges de color:
  solo el texto (mismo patrón que Estado en clientes/cotizaciones).
  Se eliminó el mapa `badgeVariant` que quedó sin uso.

## Verificación

- `npx tsc --noEmit` (web): limpio.
- `npx eslint` del archivo: sin hallazgos.

## Pendientes / riesgos

- Smoke visual pendiente (sin navegador).
