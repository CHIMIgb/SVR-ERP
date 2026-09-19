# Workflow 05 — Finanzas: flujo neto proyectado y conciliación bancaria

> Fases 5c (C5) y 5e (C7) de `implementation_plan copy.md`. ✅ Implementado (+ futuro §9).

## Origen → Destino

```
FLUJO NETO PROYECTADO (C5)
/cobranza (cuentas_por_cobrar, vencimiento) ──┐
                                              ├─► /finanzas (tab Movimientos)
/proveedores (cuentas_por_pagar, vencimiento) ─┘   └─► bloque «Flujo Neto Proyectado»
    → ventanas: 0-15 / 16-30 / 31-60 / 61-90 / +90 / Sin vencimiento
    → Neto = Por cobrar − Por pagar (negativo = déficit de tesorería)

CONCILIACIÓN BANCARIA (C7)
/tab Conciliación: selector banco → cuenta
   cuenta_bancaria (catálogo: /finanzas registra bancos/cuentas por RBAC)
   │
   ├─ Cargar CSV del extracto      → movimientos_bancarios (idempotente:
   │     clave fecha+descripción+montos; duplicados omitidos)
   ├─ Registrar movimiento manual  → movimientos_bancarios
   │
   ▼
   «Conciliar» → candidatas en transacciones del ERP:
      - mismo tipo (depósito ↔ INGRESO, retiro ↔ EGRESO)
      - fecha ±3 días
      - monto ±$1 (pre-selección; confirmación exige ±0.01)
   → movimientos_bancarios.conciliado = true, transaccion_id = vinc
   «Desconciliar» rompe el vínculo (RBAC editar)
```

## Dónde se valida el dinero

- **Flujo neto:** cruza la CxC (cobranza) y la CxP (proveedores) por ventana de
  vencimiento → proyección de liquidez.
- **Conciliación:** es la **verificación final** de que lo que dice el banco (extracto)
  coincide con la contabilidad del ERP (transacciones). Lo que queda sin conciliar es
  lo que hay que investigar (cargos no reconocidos, movimiento sin contraparte).

## Puntos delicados

- **Dos mundos separados:** `transacciones` = contabilidad general (sin banco);
  `movimientos_bancarios` = extracto (solo CSV/manual). El puente se llena al conciliar.
- **KPIs del tab Conciliación** (Total cargado / Conciliado / Sin conciliar): se calculan
  sobre lo visible en pantalla (cuenta + filtros + página), no sobre toda la cuenta.
- **Lado contable automático:** cobros/reversiones/abonos crean sus `transacciones`
  solos; el extracto del banco siempre es manual (solo el banco lo conoce).
- Auditoría en cada operación (banco/cuenta/movimiento/CSV/conciliar/desconciliar).

## Futuro (§9 IMPLEMENTACIONES-A-FUTURO)

**Asignación vista → cuenta bancaria** (en `/configuracion`):
- config 1:1 vista → cuenta (solo vistas que manejan dinero) como **default** +
- selector de cuenta en el modal de cobro/abono (la operación decide),
- al registrar la operación, el ERP crea además el `movimientos_bancarios` esperado
  (`conciliado = false`),
- al cargar el CSV, los esperados que coinciden 1:1 (cuenta, fecha, monto) se
  **auto-concilian**; el resto queda pendiente.
- Riesgo controlado: nunca se cuadra contra datos que el banco aún no reporta.