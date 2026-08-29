# Plan de Implementación — Backend del Punto de Venta (/ventas)

## 1. Resumen del Requerimiento
Migrar el POS de mock a datos reales: ventas, retiros y cierres de caja se
guardan en PostgreSQL. Los selects de Material y Medida se alimentan de un
catálogo en BD (`materiales_venta` + `materiales_precio`), reemplazando el
`PRODUCTS` estático de `lib/pos.ts`.

## 2. Impacto Backend
- **Schema** (`apps/api/prisma/schema.prisma`):
  - +7 modelos: `materiales_venta`, `materiales_precio`, `ventas`, `ventas_items`,
    `ventas_pagos`, `retiros_caja`, `cierres_caja`.
  - `enum MetodoPago` += `TRANSFERENCIA` (el POS cobra por transferencia).
  - `enum AuditAction` += `VENTA_CREADA`, `RETIRO_REGISTRADO`, `CIERRE_CAJA_REGISTRADO`.
- **Migración 1 (DDL)**: `prisma migrate dev --name ventas_pos`.
- **Migración 2 (seed)**: 12 materiales del mock actual con sus medidas/precios/stocks.
- **Nuevo módulo NestJS `ventas`** (patrón de `criba`):
  - `GET /ventas/catalogos` — materiales (nombre, unidad base, stock, medidas+precios).
  - `GET /ventas/hoy` — ventas del día (historial y stats).
  - `POST /ventas` — crea venta en `$transaction`: valida stock/medida/precio,
    descuenta stock, genera folio + ticket secuencial del día, guarda items/pagos.
  - `GET/POST /ventas/retiros` — listar (por fecha) y registrar retiro.
  - `GET /ventas/cierres/hoy` y `POST /ventas/cierres` — estado y registro del cierre
    (arqueo; valida que no exista cierre del día: `fecha` único).
- **RBAC**: `@RequirePermission('comercial','ventas','ver'|'crear')`.
- **Auditoría**: SUCCESS en cada mutación + patrón `fallir()` en fallos de negocio.
- **Tests**: specs unitarios de service/controller/DTO (obligatorio por AGENTS.md).

## 3. Impacto Frontend
- `lib/api.ts`: `ventasApi` (catalogos, hoy, crear, retiros, crearRetiro, cierreHoy,
  crearCierre) + DTOs + mappers `materialToProduct` (DTO BD → `Product` del POS) y
  `ventaDtoToSale` (respuesta del backend → `POSSale` para el ticket).
- `ventas/page.tsx`: carga `GET /ventas/catalogos` al montar (fallback a `PRODUCTS`
  si no responde) → `ProductPicker` (selects de Material y Medida) se alimenta del
  catálogo BD. `handlePay` hace `POST /ventas` y agrega la venta persistida (folio/
  ticket reales del backend). `handleRetiro` hace `POST /ventas/retiros`; precarga
  los retiros del día con `GET /ventas/retiros`.
- `CorteCaja`: bloquea el turno si `GET /ventas/cierres/hoy` reporta un cierre
  existente; al cerrar hace `POST /ventas/cierres` con el arqueo antes de habilitar
  el estado `closed`.

## 4. Estado
- ✅ Backend completo: schema + DDL/seed aplicados (12 materiales, 29 precios),
  módulo NestJS `ventas` (service/controller/DTO/tests), `VentasModule` en
  `AppModule`, enums nuevos en `ACTION_SEVERITY_MAP`. `tsc` OK + 25 tests OK.
- ✅ Frontend completo: `ventasApi` + mappers, catálogo BD en selects, ventas/
  retiros/cierre persistidos. `tsc` OK + `next build` OK + lint OK.
- ✅ Bugfix "bucle + keys duplicados": el `useEffect` de precarga dependía de
  `addSale` (función inline inestable en `POSProvider`) y `setRetiros`, por lo que
  se re-ejecutaba en cada render del provider → el historial `sales` se duplicaba
  en loop (mismos `sale.id` → keys duplicados en `SalesHistoryModal`/`TicketPreview`)
  y se golpeaba la API (`catalogos`/`hoy`/`retiros`) en bucle.
  - Fix: `addSale` memoizada con `useCallback([])` en `POSProvider` + `useEffect`
    con guard `useRef` y dependencias `[]` en `page.tsx` (precarga UNA sola vez).
  - Fix anti doble-submit: `cobrando` `useRef` en `handlePay` para impedir
    `POST /ventas` repetido mientras el request está en vuelo.
- ✅ Bugfix "Error 500 uuid: p1 al cobrar": el carrito podía envíar los IDs del
  mock `PRODUCTS` (`p1`, `p2`...) al backend, que espera UUIDs reales de BD
  (`c2000000-...`), porque la carga del catálogo BD es async y el usuario podía
  agregar/cobrar antes de que terminara.
  - Fix: estado `catalogoCargado` (se activa solo cuando `GET /ventas/catalogos`
    responde con materiales). Mientras esté en `false` el `ProductPicker` se
    sustituye por loading, el `PaymentPanel` queda `disabled` y `handlePay`
    rechaza con un guard de validación de UUID. Nunca se reenvían IDs mock.
  - UX: si la carga falla, se muestra estado de error con botón "Reintentar"
    (`cargarDatos` reutilizable con `useCallback` + `cargandoCatalogo`).

## 5. Validación y Riesgos
- `npm run test` (backend) y `tsc` + `next build` (frontend) ya verificados.
- Riesgos: Decimal de Prisma → number (serializar), ticket secuencial (uniqueness
  con `ticket` por día bajo transacción), diferencia de centavos en pagos
  (redondeo a 2), cierre duplicado del día (unique `fecha`).
- Cierre de caja tiene guard en BD (`CIERRE_DUPLICADO` → unique `fecha`), así que
  un doble `POST /ventas/cierres` falla en vez de duplicar. Los retiros también
  cierran su modal al éxito, minimizando el doble submit.