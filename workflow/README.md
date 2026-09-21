# Workflows de vistas — Flujo de información y del dinero

> **Propósito:** documentar cómo fluye la información entre las vistas del ERP, con
> foco especial en el **dinero** (el punto más delicado: dónde nace una deuda, dónde se
> valida, dónde se materializa una transacción contable y dónde se cierra contra el
> banco). Fuente: `implementation_plan copy.md` y las 5 fases ejecutadas en la rama
> `proveedores-cobranza` (módulos NestJS + frontend API real).

## Mapa global del dinero

```
                        COBRAR (ingresos)
┌──────────────────────────────────────────────────────────────────────────┐
│ /cotizaciones ──acepta──► /facturas ──crea──► cuentas_por_cobrar ──────┐ │
│ /operaciones (bitácora renta cerrada) ───────────────► CxC ◄──────────┤ │
│ /reportes-campo ──«Facturar»──► /facturas ──► CxC ────────────────────┤ │
│                                                    ▼                   │ │
│                              /cobranza  → «Registrar cobro»            │ │
│                                   │  (pagos + transacción INGRESO)     │ │
│                                   ▼                                    │ │
│                         /finanzas (tab Movimientos)                   │ │
│                                   │                                    │ │
│                                   ▼                                    │ │
│ /finanzas (tab Conciliación) ◄──banco (CSV)── empareja ── cierra       │ │
└──────────────────────────────────────────────────────────────────────────┘

                        PAGAR (egresos)
┌──────────────────────────────────────────────────────────────────────────┐
│ /proveedores ──orden de compra──► cuentas_por_pagar                    │ │
│                    │  «Abono» → pago + transacción EGRESO               │ │
│                    ▼                                                   │ │
│              /finanzas (tab Movimientos) ◄── CxP                        │ │
└──────────────────────────────────────────────────────────────────────────┘

                            TESORERÍA
┌──────────────────────────────────────────────────────────────────────────┐
│ /finanzas ──flujo neto proyectado── CxC vs CxP por vencimiento          │ │
│ /finanzas ──utilidad por proyecto── (Fase 6, ver 06)                    │ │
└──────────────────────────────────────────────────────────────────────────┘
```

## Índice de workflows

| # | Workflow | Vistas involucradas | Estado |
|---|----------|--------------------:|--------|
| [01](01-venta-cotizacion-cobro.md) | Cotización aceptada → Factura → CxC → Cobro | `/cotizaciones` → `/facturas` → `/cobranza` → `/finanzas` | ✅ Implementado |
| [02](02-operaciones-a-cxc.md) | Bitácora de renta y reporte de campo → CxC | `/operaciones`, `/reportes-campo` → `/facturas` → `/cobranza` | ✅ Implementado |
| [03](03-cobranza-y-reversion.md) | Cobro, ledger, saldado de factura y reversión | `/cobranza` → `/finanzas` → `/clientes` | ✅ Implementado |
| [04](04-proveedores-cxp.md) | Orden de compra → CxP → Abono → Egreso | `/proveedores` → `/finanzas` | ✅ Implementado (extra) |
| [05](05-finanzas-conciliacion.md) | Flujo neto CxC vs CxP + Conciliación bancaria | `/finanzas` ↔ `/cobranza` ↔ `/proveedores` ↔ banco | ✅ Implementado (futuro §9: auto-asignación) |
| [06](06-utilidad-por-proyecto.md) | Utilidad/margen por proyecto (O4) | `/proyectos` ↔ `/facturas` ↔ `/inventario` ↔ `/finanzas` | ⏳ Futuro (Fase 6) |
| — (futuro) | Venta POS a crédito → Factura → CxC (C3) | `/ventas` → `/facturas` → `/cobranza` | ⏳ Futuro |
| — (futuro) | Asignación vista → cuenta bancaria (conciliación automática) | `/configuracion` → `/finanzas` | ⏳ Futuro (§9 IMPLEMENTACIONES-A-FUTURO) |

## Reglas de oro del dinero (no romper)

1. **Nunca borrar dinero:** no hay DELETE de cobros/pagos; la corrección es una
   **reversión** (transacción compensatoria auditable), nunca un `delete`.
2. **Transacciones multi-tabla obligatorias** (`prisma.$transaction`): operación + su
   contrapartida contable nacen juntas o no nacen (cobro ↔ transacción INGRESO, abono ↔
   transacción EGRESO).
3. **La contabilidad se genera sola:** cada operación de negocio crea su `transacciones`
   (visible en `/finanzas` tab Movimientos). No se digita dos veces.
4. **El banco es externo:** `movimientos_bancarios` solo se alimenta por CSV/captura en
   el tab Conciliación; el puente banco ↔ contabilidad es la **conciliación manual**
   (fecha ±3 días + monto ±$1).
5. **Auditoría inmutable:** toda mutación de dinero registra `registro_auditoria`
   (SUCCESS o FAIL con `error_code`); los registros no se borran ni modifican.