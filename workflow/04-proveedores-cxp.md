# Workflow 04 — Proveedores → Cuentas por pagar → Abono → Egreso

> **Extra:** no proviene de las 5 fases de `implementation_plan copy.md`, sino del módulo
> de proveedores (rama `proveedores-cobranza`). ✅ Implementado.

## Origen → Destino

```
/proveedores ──crear orden de compra──► ordenes_compra ──► cuentas_por_pagar
/proveedores ──«Abono»──►
   prisma.$transaction:
     1. valida que el abono no exceda el saldo (monto_pagado + abono ≤ monto)
     2. pagos_proveedor (registro del abono)
     3. cuentas_por_pagar: monto_pagado += abono → estado PENDIENTE→PARCIAL→SALDADA
     4. transacciones (EGRESO · PROVEEDORES) "Abono a {orden} — {proveedor}"
        → /finanzas
     5. auditoría SUCCESS

/proveedores ──modal «Estado de cuenta»──► ledger del proveedor
   → totales porCobrar / porPagar / neto (alimenta tesorería)
```

## Dónde se crea/valida el dinero

- **Nace la deuda:** `cuentas_por_pagar` (1:1 con `ordenes_compra`).
- **Valida el pago:** abono ≤ saldo restante (igual patrón que el cobro en CxC).
- **Se materializa el egreso:** `transacciones` (EGRESO · PROVEEDORES) → `/finanzas`
  tab Movimientos.

## Puntos delicados

- Es el **espejo inverso** del cobro: la CxP es dinero que se debe (proveedor),
  la CxC es dinero que nos deben (cliente).
- Misma disciplina: no borrar abonos; transacción multi-tabla obligatoria.
- RFC de proveedores único (nullable → múltiples NULL permitidos).

## Relación con tesorería

- El saldo de las CxP alimenta el **flujo neto proyectado** de `/finanzas`
  (CxC vs CxP por vencimiento) — ver workflow 05.