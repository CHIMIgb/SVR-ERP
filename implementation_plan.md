# Plan de Implementación — Punto de Venta (/ventas)

## 1. Resumen del Requerimiento
Migrar el POS a backend 100% funcional sin mocks: ventas, retiros y cierres de
caja se guardan en PostgreSQL. Los selects de Material y Medida se alimentan de
un catálogo en BD (`materiales_venta` + `materiales_precio`). El backend ignora
los métodos de pago por terminal, QR y mixto; solo soporta efectivo, tarjeta y
transferencia. Toda mutación registra auditoría (éxito y fracaso) y cuenta con
tests de integración contra la base de datos real.

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
  - `create`: fallos auditados para material no disponible, medida no disponible,
    stock insuficiente, método de pago no soportado y total de pagos no cuadrado.
  - `createRetiro`: fallos auditados para monto inválido y concepto vacío.
  - `createCierre`: fallo auditado para cierre duplicado del día.
- **Tests**:
  - Specs unitarios de service/controller/DTO (obligatorio por AGENTS.md).
  - Spec de integración `ventas.integration.spec.ts` con DB real: crea material de
    prueba, valida venta/retiro/cierre y verifica registros SUCCESS y FAIL en
    `registro_auditoria`.

## 3. Impacto Frontend
- `lib/api.ts`: `ventasApi` (catalogos, hoy, crear, retiros, crearRetiro, cierreHoy,
  crearCierre) + DTOs + mappers `materialToProduct` (DTO BD → `Product` del POS) y
  `ventaDtoToSale` (respuesta del backend → `POSSale` para el ticket).
- `ventas/page.tsx`: carga `GET /ventas/catalogos` al montar **sin fallback a mock**
  (`PRODUCTS` eliminado). El POS muestra loading/error hasta que el catálogo BD esté
  disponible; solo entonces se permite cobrar. `handlePay` hace `POST /ventas` y
  agrega la venta persistida. `handleRetiro` hace `POST /ventas/retiros`; precarga
  los retiros del día con `GET /ventas/retiros`.
- `PaymentPanel`: solo métodos soportados por el backend (efectivo, tarjeta,
  transferencia). Se eliminaron mixto, botón QR y modal QR.
- `CorteCaja`: bloquea el turno si `GET /ventas/cierres/hoy` reporta un cierre
  existente; al cerrar hace `POST /ventas/cierres` con el arqueo. Se eliminó el
  agrupamiento "Mixto" y el icono QR.

## 4. Estado
- ✅ Backend 100% funcional sin mocks:
  - Schema: `materiales_venta` (datos del material) y `materiales_precio` (medida +
    precio) ya están separados; DDL/seed aplicados (12 materiales, 29 precios).
  - Módulo NestJS `ventas` (service/controller/DTO/tests), `VentasModule` en
    `AppModule`, enums nuevos en `ACTION_SEVERITY_MAP`.
  - DTO valida `materialId` como UUID y rechaza métodos de pago no soportados.
  - Auditoría SUCCESS/FAIL en `create`, `createRetiro` y `createCierre`.
  - Tests unitarios: 26 passed. Tests de integración (DB real + auditoría): 5 passed.
- ✅ Frontend alineado al backend:
  - `PRODUCTS` mock eliminado de `lib/pos.ts`; el POS no muestra productos hasta
    cargar el catálogo BD.
  - `PaymentPanel` simplificado: solo efectivo/tarjeta/transferencia; sin mixto,
    sin QR.
  - `QrModal` eliminado.
  - `CorteCaja` y `SalesHistoryModal` sin referencias a mixto/QR.
  - `tsc` OK + `next build` OK + lint OK.

## 5. Validación y Riesgos
- `npm run test` (backend) y `tsc` + `next build` (frontend) ya verificados.
- Riesgos: Decimal de Prisma → number (serializar), ticket secuencial (uniqueness
  con `ticket` por día bajo transacción), diferencia de centavos en pagos
  (redondeo a 2), cierre duplicado del día (unique `fecha`).
- Cierre de caja tiene guard en BD (`CIERRE_DUPLICADO` → unique `fecha`), así que
  un doble `POST /ventas/cierres` falla en vez de duplicar. Los retiros también
  cierran su modal al éxito, minimizando el doble submit.