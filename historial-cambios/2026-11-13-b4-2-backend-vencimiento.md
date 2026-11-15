# 2026-11-13 — B4.2: vencimiento en el backend de órdenes de compra, propagado a la CxP

## Qué se hizo

Fase B4.2 (fecha de vencimiento en CxP) en `apps/api/src/proveedores/`:

- **DTOs**: `fechaVencimiento?` (ISO opcional) en `CreateOrdenCompraDto` y
  `UpdateOrdenCompraDto`.
- **`crearOrdenCompra`**: guarda el vencimiento en la OC y en la **CxP que
  nace en la misma `$transaction`**. Sin vencimiento → ambas quedan NULL
  (OC de contado, flujo sin cambio).
- **`actualizarOrden`**: si viene `fechaVencimiento`, actualiza la OC y
  **propaga a la CxP SOLO si sigue abierta** (`monto_pagado < monto`); las CxP
  saldadas conservan su histórico. Propagación dentro de la transacción.
- **`serializeOrden`** expone `fechaVencimiento` (ISO `YYYY-MM-DD` o `null`).

## Verificación

- `npx tsc --noEmit` (api): limpio.
- Unit `src/proveedores`: **107/107** (4 nuevos: create con vencimiento llena
  OC y CxP con la MISMA fecha; create sin vencimiento deja ambas en NULL;
  update propaga a la CxP abierta; la CxP saldada NO recibe el cambio).
- Integración (BD real, `npm run test:integration -- --testPathPattern="proveedores"`):
  **9/9** — 1 nuevo: OC con `fechaVencimiento: '2026-12-31'` deja la fecha en
  la fila de la OC y en la CxP de BD; la actualización a `2027-01-15` se
  propaga a la CxP abierta.

## Pendientes / riesgos

- Las OCs existentes siguen sin vencimiento (NULL): se corrigen desde la UI
  con la acción "Vencimiento" de B4.3.
- No se permite borrar un vencimiento ya capturado (solo reasignar): si se
  necesita, es un ajuste chico en el DTO.
