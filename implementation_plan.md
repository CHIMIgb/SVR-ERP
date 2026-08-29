# Plan de Implementación — Punto de Venta (/ventas)

---

# FASE 2: Unificación del catálogo en `articulos_inventario`

## 1. Resumen del Requerimiento
Eliminar la duplicación de catálogo entre el POS (`materiales_venta` +
`materiales_precio`) y el inventario (`articulos_inventario`). `/ventas`, por
decisión del usuario (Opción B), sigue vendiendo un mismo producto en **varias
medidas con precios distintos**, pero la **única fuente del catálogo pasa a ser
`articulos_inventario`**. Se conserva el multi-medida/precio con una tabla hija
`articulos_precio` (ex `materiales_precio`) apuntando a `articulos_inventario`,
y se **eliminan** las tablas duplicadas `materiales_venta` y `materiales_precio`.

## 2. Impacto Backend

### Schema (`apps/api/prisma/schema.prisma`)
- `model articulos_precio` (NUEVA, ex `materiales_precio`): `articulo_id` FK →
  `articulos_inventario.id`, `medida`, `precio`, `@@unique([articulo_id, medida])`.
- `model articulos_inventario`: +relación `articulos_precio[]` y `ventas_items[]`.
- `model ventas_items`: `material_id` → **`articulo_id`** FK → `articulos_inventario.id`.
- **Eliminar**: `materiales_venta`, `materiales_precio`.

### Migración (manual; el parentesco de `migrate dev` está roto)
`prisma migrate diff --from-config-datasource --to-schema ... --script` →
carpeta → `migrate deploy`. El SQL debe:
1. Crear `articulos_precio`.
2. Re-apuntar `ventas_items.material_id` → `articulo_id` con FK a
   `articulos_inventario` (existe FK RESTRICT a `materiales_venta`, se migra).
3. **Datos**: crear categorías faltantes (`Áridos`, `Materiales`, `Acero`),
   unidades faltantes (`tonelada`, `viaje`, `bulto`, `pieza`), insertar los 12
   materiales POS como `articulos_inventario` (con `codigo`=sku, stock, precio
   unitario = precio de la medida base, FKs a categoría/proveedor/unidad).
4. Migrar `materiales_precio` → `articulos_precio` (articulo_id mapeado).
5. Re-apuntar `ventas_items` existentes (3 ventas / 6 items) al nuevo `articulo_id`.
6. `DROP TABLE materiales_precio`, `DROP TABLE materiales_venta`.

### `ventas.service.ts`
- `findCatalogos()`: lee `articulos_inventario` (+ `articulos_precio`,
  `categorias_inventario.nombre`, `unidades_medida.nombre`) en vez de
  `materiales_venta`. **Shape externo al frontend idéntico** →
  `{ id, sku: codigo, nombre, categoria, unidadBase, stock, precios }`.
- `create()`: consume `articulos_inventario` (+ `articulos_precio`), descuenta
  `articulos_inventario.stock` (mismo que descuenta `/inventario`).

## 3. Impacto Frontend
- **Ninguno.** El shape de `MaterialVentaDTO` se conserva; `materialToProduct` y
  toda la UI del POS no cambian.

## 4. Validación
- `tsc` + `next build` (web, sin cambios) y `tsc` (api).
- Tests unitarios de `ventas.service.spec.ts` y de integración
  `ventas.integration.spec.ts` actualizados a `articulos_inventario` /
  `articulos_precio`.

---

# FASE 1: POS funcional sin mocks

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