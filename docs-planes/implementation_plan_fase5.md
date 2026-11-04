# Plan de Implementación — Fase 5: cierre del ciclo de dinero

> Origen: `implementation_plan copy.md` §4 → **Fase 5 (C4-C7, O4-O5): reportes
> consolidados y conciliación**. Este plan diseña qué se ejecuta, qué se recorta
> al MVP y qué queda bloqueado por datos.

## 0. Resumen

La Fase 4 dejó el ciclo de dinero operativo hasta la CxC. La Fase 5 lo cierra
en ambos extremos: **corregir** lo ya cobrado (reversión), **consolidar** la
fotografía del cliente (estado de cuenta), **proyectar** la tesorería (flujo
neto CxC vs CxP), **cobrar el trabajo de campo** (reporte de campo → CxC) y
**conciliar** el banco contra el sistema.

| Sub-fase | Flujo | Migración | Costo | Valor |
|----------|-------|-----------|-------|-------|
| 5a | C6 — Reversión de cobro | No | Bajo | Alto (contabilidad) |
| 5b | C4 — Estado de cuenta por cliente | No | Bajo | Alto (comercial) |
| 5c | C5 — Flujo neto CxC vs CxP | No | Bajo | Alto (tesorería) |
| 5d | O5 — Facturar reporte de campo | Sí (chica) | Medio | Alto (maquinaria) |
| 5e | C7 — Conciliación bancaria (MVP) | Sí (grande) | Alto | Alto (cierra el dinero) |
| 5f | O4 — Margen/utilidad por proyecto | — | ⛔ **bloqueado por datos** | — |

Orden de ejecución sugerido: **5a → 5b → 5c → 5d → 5e** (cada una committeable
por separado en `proveedores-cobranza`). 5f no se ejecuta en esta fase.

---

## 5a — Reversión de cobro (C6)

### Resumen del requerimiento
Un cobro registrado por error debe poder **revertirse** sin borrarse: la traza
contable permanece, se genera una contra-transacción y la CxC vuelve a su
saldo/estado anterior. Nunca `delete` sobre `pagos` (regla contable).

### Impacto Backend
- **Sin migración.** Nuevas acciones de auditoría en `audit.constants.ts`
  (severidad **WARNING**): `COBRO_REVERTIDO`. Opcional `CXC_ACTUALIZADA` se
  reutiliza en el audit secundario (ya existe).
- **Endpoint** (referencia viva: `cobranza.service.ts`, patrón `fallir` +
  `$transaction`):
  - `POST /api/cobranza/:id/cobros/:cobroId/revertir` — permiso
    `comercial.cobranza.editar` (el seed de `cobranza` NO tiene `eliminar` para
    cobros; la reversión usa `editar`, consistente con el plan original).
  - DTO `ReversionCobroDto`: `motivo` (`@IsString() @MinLength(10)`).
- **Service `revertirCobro(cuentaId, cobroId, dto, userId)` — transacción:**
  1. Cargar CxC activa + pago con `activo: true` y `cuenta_por_cobrar_id`
     (404 `COBRO_NO_ENCONTRADO` si no coincide; 409 `COBRO_YA_REVERTIDO` si el
     pago ya tiene reversión — guard anti doble clic por `updateMany` sobre
     `pagos WHERE id AND activo` → count 0 = conflicto).
  2. `monto_pagado -= pago.monto` en la CxC; recalcular `estado`
     (`SALDADO → PARCIAL/PENDIENTE` según nuevo saldo).
  3. Marcar el pago `activo = false` (soft — se conserva la traza).
  4. Crear transacción finanzas: `tipo INGRESO` con monto **negativo** (o
     `categoria 'COBRANZA'` + `descripcion 'Reversión: {motivo}'`),
     `entidad_tipo = 'COBRO'`, `entidad_id = pago.id` — el ledger de finanzas
     muestra el reverso sin romper sumas.
  5. Audits: `COBRO_REVERTIDO` (WARNING, SUCCESS, `newValue: {motivo, monto,
     cuentaId}`) + `CXC_ACTUALIZADA`.
- **No DELETE físico** en ningún punto.

### Impacto Frontend
- `/cobranza` modal "Estado de cuenta" (ledger): botón **Reversión** por cobro
  (visibilidad `vista.puedeEditar`), modal con motivo obligatorio y preview del
  nuevo saldo. Refetch del ledger + stats.

### Testing
- Unit: `revertirCobro` (éxito full/parcial, COBRO_NO_ENCONTRADO,
  COBRO_YA_REVERTIDO, motivo inválido en DTO), controller, DTO.
- Integration: revertir cobro real → `monto_pagado`/`estado` correctos en DB,
  transacción negativa en `transacciones`, audit `COBRO_REVERTIDO` WARNING.

---

## 5b — Estado de cuenta consolidado por cliente (C4)

### Resumen del requerimiento
`/clientes` hoy es un CRUD puro. Se agrega el **estado de cuenta**: el cliente
con su saldo abierto, facturas, cobros y cotizaciones en una sola vista.

### Impacto Backend
- **Sin migración.**
- **Endpoint:** `GET /api/clientes/:id/consolidado` — permiso
  `comercial.clientes.ver`.
- **Service `consolidado(id)`** devuelve:
  - `cliente` (datos base),
  - `saldoTotal` (Σ saldo CxC activas),
  - `cuentasPorCobrar` (abiertas, reusar `serializeCuenta` de cobranza — extraer
    o duplicar ligero en clientes service),
  - `facturas` (últimas 10: codigo, folio, total, estado, fechaEmision),
  - `cobros` (últimos 10: fecha, monto, metodoPago, referencia — join
    `pagos`/`clientes`),
  - `cotizaciones` (activas: codigo, monto, estado, fecha).
- Audit `CXC_CONSULTADA` style: opcionalmente INFO en consultas — decisión:
    solo auditar si se necesita trazabilidad (los endpoints GET actuales no
    auditan; mantener paridad y NO auditar consultas).

### Impacto Frontend
- `/clientes`: botón "Estado de cuenta" por fila → modal con tabs/info
  (patrón ledger de `/cobranza` ya resuelto: `openX` carga antes de abrir).
- StatsCards dentro del modal: Saldo total, CxC abiertas, Facturas, Cobros.

### Testing
- Unit: `consolidado` con joins, cliente inexistente → 404, shape del response.
- Integration: cliente seed → consolidado devuelve la CxC de la Fase 4 + pagos.

---

## 5c — Flujo neto proyectado CxC vs CxP (C5)

### Resumen del requerimiento
Tesorería predictiva: cuánto se **cobra** y cuánto se **paga** por ventana de
vencimiento, y el neto por ventana.

### Impacto Backend
- **Sin migración** (`cuentas_por_pagar` ya vive con `monto`/`monto_pagado`/
  `fecha_vencimiento`; CxC igual).
- **Endpoint:** `GET /api/finanzas/flujo-neto` — permiso
  `comercial.finanzas.ver`.
- **Service `flujoNeto()`** — ventanas:
  `vencido`, `0-30d`, `31-60d`, `61-90d`, `+90d` (y `sin_vencimiento`);
  por ventana: `porCobrar = Σ saldo CxC`, `porPagar = Σ (monto - monto_pagado)
  CxP`, `neto = porCobrar - porPagar`. Totales.
- Consultas paralelas (Promise.all) sobre ambas tablas activas.

### Impacto Frontend
- `/finanzas`: bloque "Flujo neto proyectado" (StatsCards: Por cobrar, Por
  pagar, Neto) + tabla/barras por ventana. Reusar `formatCurrency`.

### Testing
- Unit: buckets con fechas límite (hoy, hoy+30, +60, +90), ventana
  sin_vencimiento, neto.
- Integration: crear CxC vencida + CxP a 45 días → ventanas correctas.

---

## 5d — Facturar reporte de campo → CxC (O5)

### Resumen del requerimiento
Cuando un reporte de campo (mecánico/operador/pipero) se **resuelve** y tiene
monto + cliente, el cargo debe nacer como CxC sin digitación — mismo patrón
que 4c (bitácora LISTO_FACTURAR → CxC), ahorra doble captura.

### Impacto Backend
- **Migración aditiva `reporte_campo_cxc`** (flujo manual de siempre):
  ```
  reportes_campo:
    + cliente_id    String?  @db.Uuid      (FK clientes, ON DELETE SET NULL)
    + proyecto_id   String?  @db.Uuid      (FK proyectos, SET NULL; enriquece cartera por obra)
    + monto_servicio Decimal? @db.Decimal(14,2)
  enum EstadoReporteCampo: + FACTURADO
  ```
- **Enum AuditAction:** `REPORTE_CAMPO_FACTURADO` (INFO, ya existe
  `CXC_CREADA`).
- **Endpoint:** `POST /api/reportes-campo/:id/facturar` — permiso
  `operaciones.reportes_campo.editar`.
- **Service `facturar(id, userId)`** — **plantilla literal de
  `bitacoras-renta.service.ts facturar()` (4c)**:
  1. Guards con `fallir`: `REPORTE_NO_ENCONTRADO` (404),
     `REPORTE_NO_RESUELTO` (409 si estado ≠ RESUELTO),
     `CLIENTE_INACTIVO` (409) — require `cliente_id` y `monto_servicio`.
  2. `$transaction`: guard anti doble clic `updateMany WHERE {id,
     estado: 'RESUELTO'}` → count 0 = `REPORTE_YA_FACTURADO`; crear CxC
     (`cliente_id`, `proyecto_id`, `monto = monto_servicio`, vencimiento +30,
     `estado PENDIENTE`).
  3. Audits SUCCESS `REPORTE_CAMPO_FACTURADO` + `CXC_CREADA`.

### Impacto Frontend
- `/reportes-campo`: botón **Facturar** en filas RESUELTO con
  monto+cliente (RBAC `vista.puedeEditar`), modal de confirmación — copia del
  modal de `BitacorasRentaModal` (folio, monto, aviso irreversible).
- Columna Proyecto/Cliente en la tabla del reporte si aplica.

### Testing
- Unit: 6 casos (éxito con proyecto, REPORTE_NO_ENCONTRADO, REPORTE_NO_RESUELTO,
  CLIENTE_INACTIVO, REPORTE_YA_FACTURADO, monto faltante).
- Integration: reporte RESUELTO con monto → CxC real + audits; doble clic
  → 409 + una sola CxC.

---

## 5e — Conciliación bancaria mínima viable (C7)

### Resumen del requerimiento
Cerrar el círculo del dinero: los movimientos del estado de cuenta bancario se
cargan en el sistema y se **marcan conciliados** contra las transacciones de
finanzas (`INGRESO`/`EGRESO`), de modo que "lo que dice el banco" siempre
cuadre con "lo que dice el ERP".

### Decisión de alcance (MVP)
- Alta manual de bancos y cuentas (sin conexión real al banco).
- Carga de movimientos por lote (CSV/pegado) + alta manual individual.
- **Conciliación manual 1:1** por monto+fecha contra `transacciones` (guard de
  doble conciliación). Automatch (proponer pares) = mejora posterior.

### Impacto Backend
- **Migración aditiva `conciliacion_bancaria`** (3 modelos):
  ```prisma
  model bancos {              // catálogo: nombre único
    id String @id @db.Uuid
    nombre String @unique
    activo Boolean @default(true)
    // auditoría estándar
  }
  model cuentas_bancarias {   // banco_id FK, numero, nombre, saldo_inicial
    ...
  }
  model movimientos_bancarios {
    id            String   @id @db.Uuid
    cuenta_id     String   @db.Uuid
    fecha         DateTime @db.Date
    descripcion   String
    deposito      Decimal? @db.Decimal(14,2)
    retiro        Decimal? @db.Decimal(14,2)
    conciliado    Boolean  @default(false)
    transaccion_id String? @db.Uuid   // SET NULL al desconciliar
    conciliado_en DateTime? @db.Timestamptz()
    conciliado_por String? @db.Uuid
    // auditoría estándar
    @@index([cuenta_id, fecha])
  }
  ```
- **Endpoints** (módulo `finanzas`, permisos existentes `ver/crear/editar`):
  | Método | Ruta | Permiso | Acción |
  |--------|-----|---------|--------|
  | GET | `/finanzas/bancos` | ver | Catálogo de bancos |
  | POST | `/finanzas/bancos` | crear | Alta banco |
  | GET | `/finanzas/bancos/:bancoId/cuentas` | ver | Cuentas del banco |
  | POST | `/finanzas/bancos/:bancoId/cuentas` | crear | Alta cuenta |
  | GET | `/finanzas/cuentas/:cuentaId/movimientos` | ver | Movimientos (pag.) |
  | POST | `/finanzas/cuentas/:cuentaId/movimientos` | crear | Alta individual |
  | POST | `/finanzas/cuentas/:cuentaId/movimientos/lote` | crear | Carga CSV |
  | POST | `/finanzas/movimientos/:id/conciliar` | editar | Match manual `{transaccionId}` |
  | DELETE | `/finanzas/movimientos/:id/conciliar` | editar | Desconciliar |
- **Conciliar — transacción:** validar la transacción existe y es INGRESO para
  depósito / EGRESO para retiro (`MONTO_NO_COINCIDE` 409 si |monto| difiere del
  trx), montos no cruzados; `updateMany WHERE {id, conciliado: false}` como
  guard anti doble clic (`MOVIMIENTO_YA_CONCILIADO` 409); set
  `transaccion_id`, `conciliado`, `conciliado_en/por`. Audit
  `MOVIMIENTO_CONCILIADO` (INFO, SUCCESS).
- **CSV mínimo:** `fecha,descripcion,deposito,retiro` (parse `;` o `,`, BOM).
- Carga idempotente: `@@unique([cuenta_id, fecha, descripcion, deposito, retiro])`
  para evitar duplicados en re-importaciones.

### Impacto Frontend
- `/finanzas`: tab "Conciliación" → selector banco → cuenta → tabla de
  movimientos (cargar CSV/agregar) → estado conciliado con toggle (modal
  seleccionando transacción, mostrar solo trx del rango ±3 días con monto
  similar) → StatsCards (total cargado, conciliado, diferencia).

### Testing
- Unit: conciliar (éxito, MONTO_NO_COINCIDE, doble conciliación,
  tipo cruzado), lote CSV (duplicados), DTOs.
- Integration: crear banco/cuenta/movimiento → conciliar → audit; desconciliar.

---

## 5f — Margen/utilidad por proyecto (O4) — ⛔ bloqueado por datos

### Diagnóstico (verificado en schema)
- `articulos_inventario` solo tiene `precio_unitario` (precio de venta); **no
  existe costo de compra/último costo** → no hay utilidad bruta fiable.
- `facturas` / `cotizaciones` / `movimientos_inventario` **no tienen
  `proyecto_id`** → no se puede atar ingreso/costo a un proyecto sin migrar.
- `factura_conceptos` no referencia inventario → el costo del concepto
  facturado no es derivable.

### Qué se requiere antes de O4 (no hacer en esta fase)
1. **Decisión de negocio:** ¿costo por artículo (último costo de compra),
   costo promedio, o costo de APU? (hay `apu_items`/`apu_templates`).
2. Migración `facturas.proyecto_id` (y opcional `cotizaciones.proyecto_id`) +
   vínculo `factura_conceptos.articulo_id`.
3. Recién entonces: servicio `GET /proyectos/:id/utilidad` =
   ingresos (CxC o facturas del proyecto) − costos (Σ costo artículos vendidos)
   − reporte frontend en `/proyectos`.

**Propuesta:** mover O4 a una **Fase 6** con su propia preparación de datos.
Mientras, 5d lleva `proyecto_id` a `reportes_campo` y 4c ya deja la CxC con
proyecto — el terreno queda listo.

---

## 2. Estándares que aplican a TODAS las sub-fases

1. Endpoints con `JwtAuthGuard` + `PermissionsGuard` + `@RequirePermission`
   (permisos ya sembrados en RBAC; no se requieren permisos nuevos salvo
   decisiones explícitas).
2. Auditoría de éxito en mutaciones; `fallir()` con `result: FAIL` +
   `error_code` antes de lanzar excepción.
3. Soft deletes (`activo = false` / `eliminado_en`), nunca DELETE físico (en
   particular cobros y movimientos bancarios).
4. DTOs estrictos `class-validator` + swagger.
5. **Migraciones:** flujo manual (`migrate diff` → `db execute` → INSERT en
   `_prisma_migrations` sin `ON CONFLICT` → `generate`) — la shadow DB sigue
   fallando por el seed RBAC.
6. Tests obligatorios: unit (`*.spec.ts`, cada método público + cada endpoint
   + DTOs + guards true/false) e integration real (`*.integration.spec.ts`,
   `npm run test:integration`, limpieza FK-safe, `registro_auditoria` inmutable
   se deja).
7. Frontend: componentes UI existentes (`PageHeader`, `StatsCard`, `FormModal`,
   `Badge`, `EmptyState`, `DataTable`), `formatCurrency` de shared, patrones de
   vista CRUD de `/inventario`. Responsive obligatorio.
8. `npx tsc --noEmit` tras cada cambio; suite unit completa verde antes de
   commit.

## 3. Validación y riesgos

1. **C6 reversible pero irreversible en sentido contable:** el reverso es
   permanente; la traza queda en `pagos.activo=false` + transacción negativa.
   Posible mejora futura: nota de crédito formal.
2. **C7 es el de mayor riesgo de migración** (3 tablas nuevas + carga CSV):
   el MVP recorta a conciliación manual; si el alcance crece (automatch,
   importación bancaria real) moverlo a Fase 6.
3. **O5 duplica semántica con bitácoras** (ambos generan CxC): mantener los
   guards anti doble clic idénticos y los códigos de error distintos por
   entidad (`REPORTE_*` vs `BITACORA_*`).
4. **O4 bloqueado:** implementarlo sin datos de costo produciría un reporte
   que "da números" sin base — peor que no tenerlo. No se ejecuta en Fase 5.
5. **Turbopack:** páginas nuevas con datos asíncronos siguen el patrón
   `initialLoading` + fetch client-side (sin `next/dynamic` nuevo).