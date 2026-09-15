# Workflow 02 — Operaciones → Cuentas por cobrar

> Fase 4 (O1, O2, O3) y Fase 5d (O5) de `implementation_plan copy.md`. ✅ Implementado.

## Origen → Destino

```
/operaciones ──(bitácora de renta cerrada)──► cuentas_por_cobrar (bitacora_id)
/reportes-campo ──botón «Facturar»──► /facturas ──► cuentas_por_cobrar
/proyectos ──proyecto_id en la CxC──► /cobranza (tab Por obra = cartera por obra)
```

## Pasos

### O3 — Bitácora de renta cerrrada → CxC (`bitacora_id`)
- La `bitacoras_renta_diaria` cerrada genera la `cuentas_por_cobrar` del cliente con
  `bitacora_id` (el cargo nace sin digitación: máquina + días rentados + tarifa).
- `bitacora_id` y `factura_id` coexisten como orígenes alternativos de una CxC.

### O5 — Reporte de campo → Factura → CxC (Fase 5d)
- Desde `/reportes-campo` el botón «Facturar» crea:
  1. `facturas` + `factura_conceptos` (trabajo ejecutado en campo),
  2. `cuentas_por_cobrar` (estado `PENDIENTE`),
- el reporte queda ligado (sin doble facturación).

### O1 / O2 — Cartera por obra
- `cuentas_por_cobrar.proyecto_id` permite agrupar la cartera por obra/proyecto.
- `/cobranza` tab **Por obra**: agrega monto/pagado/saldo/vencido por proyecto, con
  paginación local y KPIs (Monto con n cuentas · n proyectos, Pagado, Saldo, Vencido).
- Dirección ve morosos por obra (visión O2 sin export aún; export agrupado pendiente).

## Dónde se crea/valida el dinero

- **Nace la deuda:** `cuentas_por_cobrar` creada desde `bitacora_id` o desde
  `facturas` (reporte de campo).
- **Validación:** la CxC debe respetar la regla anti doble cobro: un reporte de campo
  solo facturable una vez; una bitácora cerrada genera su CxC una sola vez.

## Puntos delicados

- No duplicar CxC desde la misma bitácora/reporte.
- El cobro de estas CxC sigue el flujo del workflow 03 (misma validación de saldo y
  transacción INGRESO).