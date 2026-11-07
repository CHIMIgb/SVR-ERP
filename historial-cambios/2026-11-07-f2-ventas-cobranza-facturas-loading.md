# F2 — /ventas y /ventas/corte (KPIs y botón), /cobranza y /facturas (Exportar/Nueva factura)

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Cambios realizados
1. **/ventas (POS):** las 4 StatsCards del día (`Ventas de hoy`, `Ingresos del día
  (netos)`, `Ticket promedio`, `Artículos vendidos`) reciben `loading={cargando
  Catalogo}` — spinner solo en el valor; botón header `Ventas de hoy (N)` con
 `skeleton={cargandoCatalogo}`.
2. **/ventas/corte (hallazgo real más que estilo):** la página NO cargaba ventas
   — si entrabas directo, `sales` del POSProvider quedaba vacía para siempre
   (el fetch de hoy vive en /ventas). Ahora el page effect llama
   `ventasApi.hoy()` y alimenta `addSale(ventaDtoToSale(venta, []))`
   (idempotente por diseño del provider) con su loading:
   `CorteCaja` recibe prop nuevo `loading?: boolean` → spinner SOLO en el valor
   de las 4 tarjetas del arqueo (`Total ventas`, `Efectivo`, `Tarjeta`,
   `Transferencia`); `cargandoConfig || cargandoVentas` en la página.
3. **/cobranza:** botón header `Exportar` con `skeleton={initialLoading}`.
4. **/facturas:** `Exportar` y `Nueva factura` con `skeleton={initialLoading}`.
5. Incidente auto: proveedor header un wrap accidental con action extra fue
   reparado de inmediato a la forma correcta (nada roto).

## Verificación
- `npx tsc --noEmit`: 0 errores.
- Baseline lint de `CorteCaja.tsx` con git stash: 9 avisos unused preexistían en
  HEAD (`useRef`, `CheckCircle2`, `XCircle`, `isAdmin`…); ninguno nuevo.

## Pendientes y riesgos
- El fetch de ventas/día en corte era un bug funcional: si el usuario entra
  directo a /ventas/corte después del deploy ya ve arqueo correcto (mejora real,
  no solo estática).
