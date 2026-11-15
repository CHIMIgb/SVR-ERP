# 2026-11-13 — Cierre B4: vencimiento en la UI de proveedores y gates finales

## Qué se hizo

### B4.3 — UI (`/proveedores` + datos de estados de cuenta)

- **Backend (alimenta la UI)** en `apps/api/src/proveedores/proveedores.service.ts`:
  - `findEstadoCuentaResumen` expone `proximoVencimiento` (el vencimiento más
    próximo entre las OCs con saldo del proveedor; `null` si ninguna).
  - `findLedgerPorProveedor` incluye `vence` (fecha de la OC) en cada
    movimiento del ledger.
- **`apps/web/src/lib/api.ts`** — `OrdenCompraDTO.fechaVencimiento: string |
  null`, `OrdenCompraCreateInput.fechaVencimiento?`,
  `OrdenCompraUpdateInput` acepta `fechaVencimiento`,
  `EstadoCuentaResumenDTO.proximoVencimiento`, `LedgerMovimientoDTO.vence`.
- **`apps/web/src/app/(dashboard)/proveedores/page.tsx`**:
  - Modal **Nueva Orden**: campo "Fecha de vencimiento" (date, opcional) junto
    a Descripción; no acepta fechas anteriores a hoy (toast + no guarda).
  - **Acción "Vencimiento"** en la tabla de órdenes (gated `puedeEditar`, solo
    PENDIENTE/APROBADA): mini-modal con la orden resumida (folio, monto,
    saldo, vencimiento actual) que corrige la fecha; el backend propaga a la
    CxP abierta.
  - **Columna "Vence"** en la tabla de órdenes (en rojo si ya venció y tiene
    saldo).
  - **Estado de cuenta**: columna "Próximo Vencimiento" en el resumen por
    proveedor y "Vence" en el ledger (rojo si vencida con saldo).
- `/finanzas` **no se tocó**: su flujo neto ya consumía
  `cuentas_por_pagar.fecha_vencimiento`; con los datos llenándose, sus
  ventanas empiezan a poblarse solas.

### B4.4 — Gates

- `npm run test` (api): **1334 passed / 2 failed** de 1336 — los 2 fallos son
  los preexistentes de `cobranza.service.spec.ts` (`ATRASO_GRAVE`).
- `npx tsc --noEmit` (api y web): limpios.
- `npx eslint` (web): **56 problemas (18 errores, 38 warnings)** — el mismo
  baseline preexistente.
- **Smoke real contra la API** (login admin, proveedor CAT México):
  1. `POST /ordenes-compra` con `fechaVencimiento: '2026-12-24'` → OC-2026-057
     responde `fechaVencimiento: 2026-12-24` ✓.
  2. `PATCH` con `'2027-01-10'` → OC y **CxP en BD** ambas con `2027-01-10`
     (verificado con psql) ✓.
  3. `GET /proveedores/estados-cuenta` → resumen con
     `proximoVencimiento: 2027-01-10` ✓; ledger con `vence: 2027-01-10` ✓.

## Archivos tocados

- `apps/api/src/proveedores/proveedores.service.ts` (estados de cuenta)
- `apps/web/src/lib/api.ts` (tipos)
- `apps/web/src/app/(dashboard)/proveedores/page.tsx` (campo, acción, columnas,
  mini-modal)
- `historial-cambios/2026-11-13-b4-3-b4-4-cierre-vencimiento.md` (este archivo)

## Pendientes / riesgos

- **Smoke visual pendiente** (sin navegador): campo en el modal, acción
  "Vencimiento" y columnas nuevas no se vieron renderizados.
- Los datos de smoke quedan en BD dev: OC-2026-057 (CAT México, 2×100) y el
  cliente/ventas del smoke de B3 — inofensivos para demo.
- No se puede BORRAR un vencimiento ya capturado desde la UI (solo reasignar);
  si hace falta, es un ajuste chico.
- Los abonos a la orden no tocan el vencimiento (correcto: la CxP saldada
  congela su histórico).
