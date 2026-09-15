# Workflow 01 — Cotización aceptada → Factura → CxC → Cobro

> Fases 3 y 1-2 de `implementation_plan copy.md` (C2 → C1). ✅ Implementado.

## Origen → Destino

```
/cotizaciones ──botón «Facturar» (estado Aceptada)──►
   └─ $transaction: crea facturas + factura_conceptos + cuentas_por_cobrar (PENDIENTE)
         │
         ├─► /cobranza (tab Cuentas por cobrar → aparece la CxC del cliente)
         └─► /finanzas (tab Movimientos → aparece la transacción al cobrar)
```

## Pasos (dónde vive cada pieza)

1. **`/cotizaciones`** → `cotizaciones.estado = ACEPTADA` (solo cambia el string);
   la generación de deuda es **explícita** vía botón «Facturar». El servicio abre
   `prisma.$transaction`:
   - crea `facturas` (cliente, fechas, subtotal/impuesto/total, serie),
   - crea `factura_conceptos` (cantidad, unidad, descripción, valor unitario),
   - crea `cuentas_por_cobrar` (cliente, `factura_id`, monto = total, `PENDIENTE`),
   - audita cada generación (SUCCESS).
2. **`/cobranza`** muestra la CxC con saldo, vencimiento y situación (al corriente /
   atraso leve / grave). La vista consulta `GET /api/cobranza` (paginado, filtros).
3. **Cobro** (ver workflow 03): `POST /api/cobranza/:id/cobros` → crea `pagos` +
   actualiza `monto_pagado`/estado + crea `transacciones` (INGRESO · COBRANZA).

## Dónde se crea/valida el dinero

- **Nace la deuda:** `cuentas_por_cobrar` (monto 1:1 con el total de la factura).
- **Validación crítica:** en el cobro, `monto ≤ monto − monto_pagado`
  (si no → `fallir()` `COBRO_EXCEDE_SALDO` con auditoría FAIL).
- **Se materializa el ingreso:** `transacciones` (INGRESO · COBRANZA) que `/finanzas`
  consume en el tab Movimientos.

## Puntos delicados

- La CxC no debe existir sin su factura (misma `$transaction`).
- No hay DELETE de la CxC con pagos: editar monto/vencimiento con pagos → `fallir()`
  `CXC_CON_PAGOS`.
- Cadena completa: `cliente → cotización → factura → CxC → cobro → ingreso`.

## Futuro (NO implementado)

- **C3 — Venta POS a crédito → Factura → CxC:** hoy `/ventas` (POS) vende solo de
  contado y no dispara CxC. Cuando se implemente, `/ventas` → `/facturas` → CxC
  (misma cadena con origen distinto).