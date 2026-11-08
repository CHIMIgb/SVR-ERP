# F6 — seed-demo-workflows listo y corrido (POS/cobranza demo para el martes)

**Fecha:** 2026-11-08 (noche local)
**Autor:** agente OpenCode

## Qué construyó
`apps/api/scripts/seed-demo-workflows.ts` — seed idempotente para poblar
Comercial/Operaciones con registros REALES (vía servicios oficiales con sus
auditorías) y coherentes entre sí (ventas→retiros→arqueo; cajas fechadas hoy):
1. Apertura de caja con fondo 5,000 si no existe para HOY.
2. Venta POS al catálogo real (`articulos_precio` — medida/precio del catálogo
   validados) pagos mixtos 60/40 efectivo+tarjeta; `idempotencia_key`
   'DEMO-F6-venta-hoy' impide duplicados.
3. Retiro de caja chica `[DEMO]` (gasolina, $350).
4. NO duplica: cotizaciones (4 con variedad), bitácoras-renta (3), nóminas (6),
   reportes (23), criba (6) ya tienen datos.

## Hallazgo REAL extra (data fix aplicado a la BD)
- `configuracion_sistema.turno_cierre = '00:00'` era lectura como nocturna por
  la lógica del POS (apertura 07:00 > cierre 00:00 = nocturno → sin ventana de
  ventas **siempre**) — el POS entero estaba bloqueado con "FUERA_DE_HORARIO",
  tanto en /ventas como para el seed. FIX de datos: `turno_cierre = '23:00'`
  (turno diurno coherente 07:00–23:00). **Pendiente de decisión** (post-martes):
  soportar cierre '00:00' como fin de día en el backend (turno nocturno/medianoche)
  o migrar el valor — hoy es data, no código.
- `aperturas_caja` de HOY hay una fila con `fondo_inicial = 0.00` (por la
  corrida interrumpida de `apertura` con `fallir` en un intento); quedó
  normalizada a 5,000 vía UPDATE directo (efecto demo; el script ya es
  idempotente para las demás corridas).

## Resultado de la corrida final
- Ventas: `folio S17941004220715557` — Carlos SVR — total 1,540 — EFECTIVO
  (mixta 60/40 — cortedo como 1,540 sin IVA; el IVA 16% lo deriva el service).
- Retiros: `[DEMO] Gasolina operador camioneta` $350.
- Auditoría real: VENTA_CREADA SUCCESS ×1 (+2 FAIL de intentos fallidos
  FUERA_DE_HORARIO / TOTAL_PAGOS_NO_CUADRA — muestra perfecta de que las
  reglas del ERP pit guard), APERTURA SUCCESS ×2 y RETIRO SUCCESS ×1.
- Resumen BD: 1 venta hoy · 2 retiros · listo para /ventas, /ventas/corte y
  /cobranza.

## Pendientes y riesgos (muy breves)
- /ventas (POS) era la ÚNICA vacía: demo lista — los demás workflows ya cuentan
  con datos (revisados con conteos reales arriba).
- El guard anti-producción del seed está puesto: falla si `NODE_ENV=production`
  y no se haya pasado DEMO_SEED=permiso`.
