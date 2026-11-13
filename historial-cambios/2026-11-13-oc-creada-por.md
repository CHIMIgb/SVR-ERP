# 2026-11-13 — /proveedores: el tab de órdenes muestra quién creó cada OC

## Qué se hizo

- **Backend** (`proveedores.service.ts`):
  - `findAllOrdenes` incluye al creador (relación `ordenes_compra → users →
    personas`) — paginado, sin N+1.
  - `serializeOrden` expone `creadoPor` (nombre completo; `null` en filas
    viejas sin creador o mocks).
- **Web**:
  - `lib/api.ts`: `OrdenCompraDTO.creadoPor?`.
  - Tab **Órdenes de Compra**: bajo el folio va la línea
    *"por Fulano"* (patrón "Creada por"); se omite si es nula.

## Verificación

- `npx tsc --noEmit` (api y web): limpios.
- `npx jest src/proveedores`: **107/107**.
- Smoke real: `GET /ordenes-compra` → `OC-2026-057 creadoPor: Carlos SVR` ✓.

## Pendientes / riesgos

- Smoke visual pendiente (sin navegador).
