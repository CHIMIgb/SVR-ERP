# P4b — venta POS descuenta inventario (guard anti-carrera + movimientos SALIDA)

**Fecha:** 2026-11-08
**Autor:** agente OpenCode

## Cambios realizados
`apps/api/src/ventas/ventas.service.ts` — dentro de la `$transaction` de
`create()` (que YA descontaba stock sin guard ni trazabilidad):
1. **Descuento condicional anti-carrera:** reemplazado el `update` directo por
   `updateMany({ where: { id, stock: { gte: cantidad } }, data: { stock: { decrement } } })`
   — si otro cambio simultáneo vació el stock, `count === 0` y el error interno
   `StockInsuficienteRuntimeError` REVERTE toda la transacción (venta + items +
   pagos) y se responde `400 STOCK_INSUFICIENTE` auditado FAIL (patrón fallir).
2. **Movimientos de inventario:** por cada línea nace un `movimientos_inventario`
   `tipo 'SALIDA'`, `motivo 'Venta POS'`, `referencia_tipo 'VENTA_POS'`,
   `referencia_id = venta.id`, `stock_resultante` (leído tras el descuento en
   tx) — trazable en `/inventario`.
3. **Specs unitarios** (+3): el create valida llamada con `where stock gte` +
   movimiento con datos completos; carrera `updateMany count 0` → rechaza
   `BadRequestException` con auditoría `FAIL STOCK_INSUFICIENTE`.
  态 35/35 passed (mocks ampliados con `movimientos_inventario.create` y
   `updateMany`).
4. **Integración real (+2):** la venta descuenta 98→97 y crea 1 movimiento
   `SALIDA` con `stock_resultante 98`; **idempotencia real**: reintentar con la
   MISMA `idempotencia_key` no duplica descuento ni movimiento. Cleanup FK-safe
   extendido (movimientos antes que ventas/artículos). Embrional tests 10/10.

## Verificación
- `npx tsc --noEmit`: 0 errores.
- Unit: ventas 35/35. Integración (BD real): ventas 10/10.
- Suite global: 1022 passed — las 2 fallas son las históricas de cobranza por
  fecha (conocidas desde antes, nada que ver con este cambio).

## Pendientes y riesgos
- Los movimientos muestran motivo "Venta POS" en /inventario; si el reviewer
  pide ticker/folio en el motivo, se cambia por `Venta POS ${folio}` en 1 línea.
- La parte P4 de COTIZACIONES sigue pendiente (depende de P2, Tier 3).
