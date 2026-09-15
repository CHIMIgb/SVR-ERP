# Workflow 03 — Cobranza: cobro, ledger y reversión

> Fases 1-2 y 5a (C6) de `implementation_plan copy.md`. ✅ Implementado.

## Origen → Destino

```
/cobranza ──«Registrar cobro»──►
   prisma.$transaction:
     1. valida saldo  → si falla: fallir() COBRO_EXCEDE_SALDO (auditoría FAIL)
     2. crea pagos (código PAG-XXXX, método, referencia, cuenta_por_cobrar_id)
     3. cuentas_por_cobrar: monto_pagado += monto → PENDIENTE→PARCIAL→SALDADO
     4. facturas (si estaba TIMBRADA y ligada) → PAGADA
     5. transacciones (INGRESO · COBRANZA, entidad COBRO) → /finanzas
     6. auditoría SUCCESS (COBRO_REGISTRADO)

/cobranza ──ledger por cuenta──► historial de pagos de una CxC
/cobranza ──«Reversión» (Undo, RBAC editar)──►
   $transaction:
     1. valida motivo obligatorio (≥ 10 caracteres)
     2. revierte monto_pagado / estado de la CxC (SALDADO → PARCIAL → PENDIENTE)
     3. factura PAGADA → TIMBRADA (si quedó sin saldo)
     4. transacciones (EGRESO · COBRANZA) "Reversión de cobro X — motivo"
        → /finanzas (traza inmutable; el cobro original NO se borra)
     5. auditoría WARNING (COBRO_REVERTIDO)
```

## Dónde se crea/valida el dinero

- **Cobro:** `pagos` + incremento de `cuentas_por_cobrar.monto_pagado` + `transacciones`
  INGRESO. Todo en la misma transacción → el ingreso nunca se registra sin su pago.
- **Reversión:** transacción EGRESO compensatoria (montos positivos en la BD, el signo
  lo da el tipo). La BD exige `monto` positivo (`chk_monto_positivo`).
- **Estados de la CxC:** `PENDIENTE` → `PARCIAL` → `SALDADO` (saldo 0); la reversión
  anda en sentido inverso.

## Puntos delicados

- **Nunca DELETE de `pagos` ni de `transacciones`:** la corrección es la reversión.
- **RBAC:** cobro = `cobranza.crear`; reversión = `cobranza.editar`.
- **Ledger por cliente (C4 / 5b):** el estado de cuenta consolida CxC + pagos del
  cliente (también consumido en `/clientes`); los totales `porCobrar/porPagar/neto`
  alimentan la tesorería.