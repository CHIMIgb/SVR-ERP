# 2026-11-13 — /proveedores: Cancelar se oculta con pagos y los abonos muestran quién los registró

## Qué se hizo

- **`apps/web/src/app/(dashboard)/proveedores/page.tsx`** — el botón
  **Cancelar** de una orden ya no se deshabilita con pagos: **se oculta** (solo
  aparece en órdenes activas con `pagado === 0`, igual que Eliminar). La regla
  de negocio no cambia: el backend rechaza cancelar una orden con abonos.
- **"Quién registró el abono"** (patrón "Creada por" de cotizaciones):
  - **Backend** (`proveedores.service.ts`):
    - `findOneOrden`: cada abono del detalle expone `creadoPor` (nombre completo
      del usuario vía la relación a `personas`).
    - `findLedgerPorProveedor`: devuelve **`abonos`** — la lista de abonos del
      proveedor con código, folio de la OC, fecha, monto, método y
      `registradoPor`.
  - **Web**:
    - `lib/api.ts`: `AbonoDTO.creadoPor?` y `AbonoLedgerDTO` nuevo;
      `LedgerDetalleDTO.abonos`.
    - Modal del **estado de cuenta**: sección nueva **"Abonos registrados"**
      debajo del ledger (código, OC, fecha, método, **"por Fulano"** y monto).

## Verificación

- `npx tsc --noEmit` (api y web): limpios.
- `npx jest src/proveedores`: **107/107** (se agregó el mock `findMany` de
  `pagos_proveedor` que faltaba al extender el ledger).
- Smoke real (OC-2026-057 ya aprobada desde la UI): abono de $80 →
  `PAG-PROV-2026-006` con `creadoPor: "Carlos SVR"` en el detalle y en el
  ledger `PAG-PROV-2026-001/006 ... por Carlos SVR` ✓.

## Pendientes / riesgos

- Smoke visual pendiente (sin navegador): el botón Cancelar oculto y la
  sección de abonos del ledger.
- El campo método del abono sigue en la UI con solo EFECTIVO (la decisión de
  quitarlo del todo queda pendiente de la duda de PROVEEDORES.txt #1).
