# Plan de Implementación — Fase 3: Módulo Facturas + Cotización → Factura → CxC

## Estado del Proyecto

```
Fase 1 ✅ (2-3 días): migración + módulo cobranza + seed + tests
Fase 2 ✅:            conectar frontend a API real (cobranza.page.tsx)
Fase 3 📋:  módulo facturas → cotización aceptada → CxC           ← ESTE PLAN
Fase 4:     proyecto en CxC + bitácora → CxC
Fase 5:     reportes consolidados y conciliación
```

Cadena de valor: **cotización → aceptar → factura + CxC → cobro → ingreso finanzas**

---

## 1. Resumen del Requerimiento

La Fase 3 cierra el ciclo **C2 → C1**: construir el módulo `facturas` (NestJS) y
conectarlo con las cotizaciones para que al aceptar una cotización se genere
automáticamente una **factura** con sus conceptos y una **cuenta por cobrar** (CxC)
ligada a ella.

**Estado actual:**
- Las tablas `facturas` y `factura_conceptos` **ya existen** en Prisma schema (modelado completo).
- Las tablas `cuentas_por_cobrar` y `pagos` ya están operativas (Fase 1-2).
- **No existe** módulo NestJS para facturas, ni vista `/facturas` en el frontend.
- Las cotizaciones tienen backend completo (`CotizacionesService.cambiarEstado`) y frontend conectado a API.
- El endpoint `cambiarEstado` solo cambia `PENDIENTE → ACEPTADA/RECHAZADA`, sin generar factura.

**Objetivo:** Al aceptar una cotización, la UI ofrezca la opción de generar factura + CxC
en una sola transacción atómica.

---

## 2. Impacto Backend

### 2.1 Schema Prisma — migración aditiva `facturas_cotizacion_link`

```prisma
// 1. facturas → vínculo opcional con cotización (trazabilidad)
model facturas {
  cotizacion_id String?     @db.Uuid
  cotizaciones  cotizaciones? @relation(fields: [cotizacion_id], references: [id])
  @@index([cotizacion_id])
}

// 2. Enum AuditAction — acciones nuevas
//    FACTURA_CREADA, FACTURA_ACTUALIZADA, FACTURA_TIMBRADA,
//    FACTURA_CANCELADA, COTIZACION_FACTURADA
```

- Severidades en `audit.constants.ts`: INFO para creación/timbrado, WARNING para cancelaciones.
- ✋ **Entorno**: `prisma migrate dev` no funciona (shadow DB falla aplicando el seed
  RBAC). Flujo manual: `prisma migrate diff --from-config-datasource
  --to-schema prisma/schema.prisma --script` → `prisma db execute --file <migración.sql>`
  → INSERT en `_prisma_migrations` (checksum sha256, `applied_steps_count` 1) →
  `prisma generate`.

#### Migración SQL esperada

```sql
-- SVR-ERP: Fase 3 — Módulo facturas + link cotización
-- Aditiva: facturas.cotizacion_id + acciones de auditoría + permisos + vista

-- 1. AuditAction
ALTER TYPE "AuditAction" ADD VALUE 'FACTURA_CREADA';
ALTER TYPE "AuditAction" ADD VALUE 'FACTURA_ACTUALIZADA';
ALTER TYPE "AuditAction" ADD VALUE 'FACTURA_TIMBRADA';
ALTER TYPE "AuditAction" ADD VALUE 'FACTURA_CANCELADA';
ALTER TYPE "AuditAction" ADD VALUE 'COTIZACION_FACTURADA';

-- 2. Link facturas → cotizaciones
ALTER TABLE "facturas" ADD COLUMN "cotizacion_id" UUID;
CREATE INDEX "facturas_cotizacion_id_idx" ON "facturas"("cotizacion_id");
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_cotizacion_id_fkey"
  FOREIGN KEY ("cotizacion_id") REFERENCES "cotizaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Permisos del módulo facturas (comercial)
INSERT INTO "permissions" ("id", "modulo", "recurso", "accion", "descripcion", "activo", "creado_en", "actualizado_en") VALUES
  ('<uuid-1>', 'comercial', 'facturas', 'ver',     'Ver facturas',           true, NOW(), NOW()),
  ('<uuid-2>', 'comercial', 'facturas', 'crear',   'Crear facturas',         true, NOW(), NOW()),
  ('<uuid-3>', 'comercial', 'facturas', 'editar',  'Editar facturas',        true, NOW(), NOW()),
  ('<uuid-4>', 'comercial', 'facturas', 'eliminar','Eliminar facturas',      true, NOW(), NOW()),
  ('<uuid-5>', 'comercial', 'facturas', 'exportar','Exportar facturas',      true, NOW(), NOW());

-- 4. Asignar todos los permisos al rol Administrador
INSERT INTO "role_permissions" ("rol_id", "permiso_id", "creado_en")
SELECT r."id", p."id", NOW()
FROM "roles" r, "permissions" p
WHERE r."nombre" = 'Administrador'
  AND p."modulo" = 'comercial' AND p."recurso" = 'facturas';

-- 5. Vista /facturas para el sidebar
INSERT INTO "vistas" ("id", "nombre", "descripcion", "ruta", "icono", "orden",
  "es_menu", "es_visible", "requiere_auth", "target", "badges", "metadata",
  "activo", "creado_en", "actualizado_en") VALUES
  ('<uuid-vista>', 'Facturas', 'Gestión de facturación y comprobantes fiscales',
   '/facturas', 'Receipt', 16, true, true, true, '_self', '[]', '{}', true, NOW(), NOW());

-- 6. Asignar vista al Administrador
INSERT INTO "role_vistas" ("id", "rol_id", "vista_id", "puede_ver", "puede_crear",
  "puede_editar", "puede_eliminar", "puede_exportar", "asignado_en", "activo")
SELECT '<uuid-rv>', r."id", v."id", true, true, true, true, true, NOW(), true
FROM "roles" r, "vistas" v
WHERE r."nombre" = 'Administrador' AND v."ruta" = '/facturas';
```

### 2.2 Módulo NestJS `apps/api/src/facturas/`

```
facturas/
  dto/
    crear-factura.dto.ts          # clienteId, cotizacionId?, serie?, formaPago, metodoPago, usoCfdi,
                                  # fechaEmision?, fechaVencimiento?, conceptos[]
    actualizar-factura.dto.ts     # serie?, formaPago?, metodoPago?, usoCfdi?, fechaVencimiento?
    cambiar-estado-factura.dto.ts # estado (TIMBRADA | CANCELADA), motivoCancelacion?
    crear-concepto.dto.ts         # cantidad, unidad, descripcion, valorUnitario, descuento?, impuestoTasa?
    actualizar-concepto.dto.ts    # cantidad?, unidad?, descripcion?, valorUnitario?, descuento?, impuestoTasa?
    listar-facturas.query.ts      # estado?, clienteId?, search?, page?, limit?
  facturas.module.ts
  facturas.controller.ts
  facturas.service.ts
  facturas.service.spec.ts
  facturas.controller.spec.ts
  facturas.integration.spec.ts
```

### 2.3 Endpoints

#### Módulo facturas (`/api/facturas`)

| Método | Ruta | Permiso (`comercial.facturas`) | Acción |
|--------|------|------------------------------|--------|
| GET | `/api/facturas` | `ver` | Lista paginada con filtros (estado, cliente, búsqueda) |
| GET | `/api/facturas/stats` | `ver` | total, pendientes, emitidas, pagadas, totalFacturado |
| GET | `/api/facturas/:id` | `ver` | Detalle factura + conceptos + datos cliente |
| POST | `/api/facturas` | `crear` | Crear factura con conceptos (transacción) |
| PATCH | `/api/facturas/:id` | `editar` | Editar datos generales (solo estado PENDIENTE) |
| PATCH | `/api/facturas/:id/estado` | `editar` | Cambiar estado: TIMBRADA / CANCELADA |
| DELETE | `/api/facturas/:id` | `eliminar` | Soft delete (solo PENDIENTE, sin CxC asociada) |
| GET | `/api/facturas/exportar` | `exportar` | CSV de la facturación |
| POST | `/api/facturas/:id/conceptos` | `editar` | Agregar concepto (recalcula totales) |
| PATCH | `/api/facturas/:id/conceptos/:conceptoId` | `editar` | Editar concepto (recalcula totales) |
| DELETE | `/api/facturas/:id/conceptos/:conceptoId` | `editar` | Eliminar concepto (recalcula totales) |

#### Endpoint integración cotización → factura + CxC

| Método | Ruta | Permiso | Acción |
|--------|------|---------|--------|
| POST | `/api/cotizaciones/:id/facturar` | `comercial.cotizaciones.editar` | Aceptar cotización + crear factura + crear CxC |

### 2.4 Estados de Factura

> **Nota (verificada en BD):** El check constraint `chk_facturas_estado` de la tabla
> `facturas` solo admite: `PENDIENTE`, `TIMBRADA`, `CANCELADA`, `PAGADA`. **No existe
> `EMITIDA`** — el estado tras timbrar es `TIMBRADA`. Todos los endpoints y la UI
> deben usar estos 4 estados exactos (el DTO `@IsIn` debe reflejarlos).

```
PENDIENTE  → Editable (agregar/editar conceptos, editar datos generales)
TIMBRADA    → CFDI timbrado (inmutable, solo consulta)
PAGADA     → Saldo = 0 (actualizada automáticamente por cobranza)
CANCELADA  → Anulada con motivo (inmutable)
```

**Transiciones válidas:**
- `PENDIENTE → TIMBRADA` (timbrar)
- `PENDIENTE → CANCELADA` (cancelar antes de timbrar)
- `TIMBRADA → PAGADA` (automática, cuando CxC se salda)
- `TIMBRADA → CANCELADA` (requiere nota de crédito futura — Fase 5)

### 2.5 Crear Factura — transacción crítica

```
prisma.$transaction([
  1. Validar cliente existe y está activo
  2. Generar código secuencial: FAC-YYYY-NNNN
  3. Crear factura con subtotal/impuestos/total = 0 (se recalcula con conceptos)
  4. Crear factura_conceptos asociados (recalculando importe = cantidad * valorUnitario - descuento)
  5. Recalcular subtotal = SUM(importes), impuestos = SUM(impuesto_importe), total = subtotal + impuestos
  6. Actualizar factura con totales recalculados
  7. AuditService.log(SUCCESS, FACTURA_CREADA, metadata)
])
```

### 2.6 Agregar/Eliminar Concepto — recálculo en cascada

```
al agregar/editar/eliminar concepto:
  1. Recalcular importe del concepto: cantidad * valorUnitario - descuento
  2. Calcular impuesto_importe si tiene tasa
  3. Recalcular totales de la factura:
     subtotal = SUM(conceptos.importe)
     impuestos = SUM(conceptos.impuesto_importe)
     total = subtotal + impuestos
  4. Actualizar factura.totales
  5. Si factura tiene CxC asociada → validar CxC.monto = factura.total
     (si hay diferencia: fallir() FACTURA_CON_CXC_MODIFICADA)
```

### 2.7 Cotización → Factura + CxC — transacción integradora

```
POST /api/cotizaciones/:id/facturar
prisma.$transaction([
  1. Validar cotización existe, estado = PENDIENTE, eliminado_en = null
  2. Validar cliente de la cotización existe y está activo
  3. Actualizar cotización: estado = ACEPTADA, actualizado_por, actualizado_en
  4. Generar código factura: FAC-YYYY-NNNN
  5. Crear factura:
     - cliente_id = cotizacion.cliente_id
     - cotizacion_id = cotizacion.id
     - subtotal = cotizacion.monto (sin impuestos inicialmente)
     - impuestos = 0 (se calculan si se agregan conceptos con IVA)
     - total = cotizacion.monto
     - estado = PENDIENTE
  6. Crear factura_concepto:
     - descripcion = cotizacion.descripcion
     - cantidad = 1
     - unidad = "Servicio" (default)
     - valor_unitario = cotizacion.monto
     - importe = cotizacion.monto
  7. Crear cuentas_por_cobrar:
     - cliente_id = cotizacion.cliente_id
     - factura_id = factura.id
     - monto = factura.total
     - fecha_vencimiento = hoy + 30 días (default)
     - estado = PENDIENTE
  8. AuditService.log(SUCCESS, COTIZACION_FACTURADA, metadata con facturaId + cxcId)
])
```

**Error codes posibles:**
- `COTIZACION_NO_ENCONTRADA` — 404
- `COTIZACION_YA_FACTURADA` — 400 (ya tiene factura asociada)
- `COTIZACION_NO_PENDIENTE` — 400 (ya fue aceptada/rechazada)
- `CLIENTE_NO_ENCONTRADO` — 400

### 2.8 Stats (para las 4 StatsCard del frontend)

```
total          = COUNT(facturas activas)
pendientes     = COUNT(facturas WHERE estado = PENDIENTE)
emitidas       = COUNT(facturas WHERE estado = TIMBRADA)
pagadas        = COUNT(facturas WHERE estado = PAGADA)
totalFacturado = SUM(facturas.total) WHERE estado IN (TIMBRADA, PAGADA)
```

### 2.9 Seed `apps/api/scripts/seed-facturas.ts`

- ~6 facturas ligadas a clientes existentes:
  - 2 PENDIENTE (una con 3 conceptos, otra con 1)
  - 2 TIMBRADA (con CxC asociada y pagos parciales)
  - 1 PAGADA (CxC saldada, 2 pagos completos)
  - 1 CANCELADA (motivo: "Error en datos fiscales")
- ~12 factura_conceptos distribuidos (variedad de servicios/material)
- 3 cuentas_por_cobrar ligadas a las facturas TIMBRADA/PAGADA
- ~6 pagos contra esas CxC + transacciones INGRESO en finanzas
- 1 factura ligada a cotización existente (cotizacion_id = cotización del seed)
- Idempotente (upsert por código), fuente `SYSTEM` en auditoría

### 2.10 Estándar obligatorio (AGENTS.md) en cada endpoint

1. `JwtAuthGuard` + `PermissionsGuard` con `@RequirePermission('comercial', 'facturas', 'ver'|'crear'|'editar'|'eliminar'|'exportar')`.
2. Blacklist de token automática (JwtStrategy → `token_blacklist` por `jti`).
3. Auditoría SUCCESS en todas las mutaciones (`AuditService.log`).
4. Patrón `fallir()` en fallos de negocio con `result: 'FAIL'` + `error_code` antes de lanzar la excepción.
5. Soft deletes: `activo = false`, nunca `delete` físico.
6. DTOs estrictos `class-validator` (`@IsUUID()`, `@IsPositive()`, `@IsIn(…)`).
7. `AuditContextInterceptor` ya captura metadata/IP/session por HTTP.

---

## 3. Impacto Frontend

### 3.1 Nueva vista `/facturas`

Patrón: **inventario/proveedores** (CRUD estándar con tabla, filtros, paginación, modales).

```
apps/web/src/app/(dashboard)/facturas/page.tsx
```

**Estructura de la vista:**
- `PageHeader` + botón "Nueva Factura" (`variant="primary"`)
- 4 `StatsCard`: Total, Pendientes, Emitidas, Total Facturado
- `SearchBar` + botón Filtros + chips activos + panel de filtros (estado, cliente)
- `DataTable` con columnas:
  - Código / Cliente
  - Serie + Folio
  - Subtotal / IVA / Total
  - Estado (badge)
  - Fecha emisión
  - Acciones (Ver, Editar, Timbrar, Cancelar)
- `Pagination` server-side
- `FormModal` para crear/editar factura
- `FormModal` para agregar/editar conceptos
- Modal de detalle (factura + conceptos + CxC asociada si existe)
- Botón Exportar CSV

**Permisos RBAC vía `useAuth().user.vistas`:**
```ts
const vista = user?.vistas?.find(v => v.ruta === '/facturas');
const puedeCrear  = vista?.puedeCrear  ?? false;
const puedeEditar = vista?.puedeEditar ?? false;
const puedeEliminar = vista?.puedeEliminar ?? false;
const puedeExportar = vista?.puedeExportar ?? false;
```

### 3.2 Modificar `/cotizaciones` — botón "Facturar"

En el modal de confirmación de aceptar cotización (`estadoOpen`), agregar un checkbox:

```
☐ Generar factura y cuenta por cobrar
```

- Si está marcado → `POST /cotizaciones/:id/facturar` (transacción completa)
- Si NO está marcado → `PATCH /cotizaciones/:id/estado` (solo cambia estado, comportamiento actual)

El checkbox solo aparece cuando `selectedEstado === 'ACEPTADA'`.

### 3.3 Agregar ruta al Sidebar

```ts
// En ROUTE_META:
"/facturas": { group: "Comercial", badge: "NUEVO" },

// En la vista de BD (seed):
// icono: "Receipt", orden: 16 (entre cotizaciones y finanzas)
```

### 3.4 API Client en `apps/web/src/lib/api.ts`

```ts
// Tipos
export interface FacturaDTO {
  id: string;
  codigo: string;
  serie: string | null;
  folio: string | null;
  clienteId: string;
  clienteNombre?: string;
  clienteEmpresa?: string;
  cotizacionId: string | null;
  cotizacionCodigo?: string | null;
  subtotal: number;
  impuestos: number;
  total: number;
  moneda: string;
  formaPago: string | null;
  metodoPago: string | null;
  usoCfdi: string | null;
  estado: 'Pendiente' | 'Emitida' | 'Pagada' | 'Cancelada';
  fechaEmision: string;
  fechaVencimiento: string | null;
  timbradoEn: string | null;
  xmlUrl: string | null;
  pdfUrl: string | null;
  activo: boolean;
  creadoEn: string;
  conceptos?: FacturaConceptoDTO[];
}

export interface FacturaConceptoDTO {
  id: string;
  cantidad: number;
  unidad: string;
  descripcion: string;
  valorUnitario: number;
  importe: number;
  descuento: number;
  impuestoTasa: number | null;
  impuestoImporte: number | null;
}

export interface FacturaCreateInput {
  clienteId: string;
  cotizacionId?: string;
  serie?: string;
  formaPago?: string;
  metodoPago?: string;
  usoCfdi?: string;
  fechaVencimiento?: string;
  conceptos: {
    cantidad: number;
    unidad: string;
    descripcion: string;
    valorUnitario: number;
    descuento?: number;
    impuestoTasa?: number;
  }[];
}

export interface FacturaStats {
  total: number;
  pendientes: number;
  emitidas: number;
  pagadas: number;
  totalFacturado: number;
}

// API Client
export const facturasApi = {
  listar:    (params?)          => apiClient.get<Paginated<FacturaDTO>>('/facturas', { params }),
  stats:     ()                 => apiClient.get<FacturaStats>('/facturas/stats'),
  obtener:   (id)               => apiClient.get<FacturaDTO>(`/facturas/${id}`),
  crear:     (data)             => apiClient.post<FacturaDTO>('/facturas', data),
  actualizar:(id, data)         => apiClient.patch<FacturaDTO>(`/facturas/${id}`, data),
  cambiarEstado: (id, data)     => apiClient.patch<FacturaDTO>(`/facturas/${id}/estado`, data),
  eliminar:  (id)               => apiClient.delete(`/facturas/${id}`),
  exportar:  (params?)          => apiClient.get('/facturas/exportar', { params, responseType: 'blob' }),
  agregarConcepto: (id, data)   => apiClient.post(`/facturas/${id}/conceptos`, data),
  editarConcepto: (id, cId, data) => apiClient.patch(`/facturas/${id}/conceptos/${cId}`, data),
  eliminarConcepto: (id, cId)   => apiClient.delete(`/facturas/${id}/conceptos/${cId}`),
};

// En cotizacionesApi, agregar:
export const cotizacionesApi = {
  // ... existente
  facturar: (id) => apiClient.post(`/cotizaciones/${id}/facturar`),
};
```

---

## 4. Sub-fases de Implementación

### 4.1 Sub-fase 3a: Schema + Migración + Seed (backend)

**Archivos a crear/modificar:**
1. `apps/api/prisma/schema.prisma` — agregar `cotizacion_id` a `facturas`, nuevos AuditActions
2. `apps/api/prisma/migrations/20260920000000_facturas_cotizacion_link/migration.sql`
3. `apps/api/scripts/seed-facturas.ts`
4. `apps/api/src/audit/audit.constants.ts` — agregar severidades para nuevas acciones
5. Registrar migración en `_prisma_migrations`

**Entregable:** Migración aplicada, `prisma generate` ejecutado, seed funcional.

### 4.2 Sub-fase 3b: Módulo Facturas NestJS (backend)

**Archivos a crear:**
1. `apps/api/src/facturas/facturas.module.ts`
2. `apps/api/src/facturas/facturas.controller.ts`
3. `apps/api/src/facturas/facturas.service.ts`
4. `apps/api/src/facturas/dto/crear-factura.dto.ts`
5. `apps/api/src/facturas/dto/actualizar-factura.dto.ts`
6. `apps/api/src/facturas/dto/cambiar-estado-factura.dto.ts`
7. `apps/api/src/facturas/dto/crear-concepto.dto.ts`
8. `apps/api/src/facturas/dto/actualizar-concepto.dto.ts`
9. `apps/api/src/facturas/dto/listar-facturas.query.ts`
10. `apps/api/src/facturas/facturas.service.spec.ts`
11. `apps/api/src/facturas/facturas.controller.spec.ts`
12. `apps/api/src/facturas/facturas.integration.spec.ts`

**Archivos a modificar:**
1. `apps/api/src/app.module.ts` — registrar `FacturasModule`

**Entregable:** CRUD completo, tests unitarios e integración pasando.

### 4.3 Sub-fase 3c: Integración Cotización → Factura + CxC (backend)

**Archivos a crear/modificar:**
1. `apps/api/src/clientes/cotizaciones.service.ts` — agregar método `facturar(id, userId)`
2. `apps/api/src/clientes/cotizaciones-global.controller.ts` — agregar endpoint `POST /:id/facturar`
3. `apps/api/src/clientes/dto/facturar-cotizacion.dto.ts` — DTO vacío (solo validación de ruta)
4. Tests unitarios e integración para el nuevo endpoint

**Entregable:** `POST /cotizaciones/:id/facturar` funcional con transacción atómica.

### 4.4 Sub-fase 3d: Frontend Facturas + Integración Cotizaciones

**Archivos a crear:**
1. `apps/web/src/app/(dashboard)/facturas/page.tsx`

**Archivos a modificar:**
1. `apps/web/src/lib/api.ts` — agregar `facturasApi` + tipos
2. `apps/web/src/app/(dashboard)/cotizaciones/page.tsx` — checkbox "Generar factura" en modal aceptar
3. `apps/web/src/components/layout/Sidebar.tsx` — agregar `/facturas` a `ROUTE_META`
4. `apps/web/COMPONENTS.md` — documentar si se crean componentes nuevos

**Entregable:** Vista `/facturas` conectada a API, flujo de cotización → factura funcional.

---

## 5. Testing — obligatorio (AGENTS.md)

### 5.1 Unit Tests (`facturas.service.spec.ts`)

Cada método público del servicio con ≥ 1 test:
- `findAll` — filtros, paginación, búsqueda
- `findOne` — éxito, no encontrado
- `crear` — éxito con conceptos, cliente no encontrado, código duplicado
- `actualizar` — éxito, factura no editable (ya emitida/pagada)
- `cambiarEstado` — PENDIENTE→TIMBRADA, PENDIENTE→CANCELADA, transición inválida
- `eliminar` — éxito, factura con CxC no se puede eliminar
- `agregarConcepto` — éxito, recálculo de totales
- `editarConcepto` — éxito, recálculo
- `eliminarConcepto` — éxito, no dejar factura sin conceptos
- `stats` — conteos correctos
- `exportar` — CSV con BOM

### 5.2 Unit Tests (`facturas.controller.spec.ts`)

Cada endpoint con ≥ 1 test verificando:
- Llamada correcta al servicio
- Status code (200, 201, 404)
- Extracción de userId del request

### 5.3 Integration Tests (`facturas.integration.spec.ts`)

Flujos reales en PostgreSQL:
1. **Crear factura + conceptos** → verificar `FACTURA_CREADA` en `registro_auditoria`
2. **Timbrar factura** → verificar `FACTURA_TIMBRADA` + estado TIMBRADA
3. **Cotización → Facturar** → verificar `COTIZACION_FACTURADA` + factura creada + CxC creada
4. **Cancelar factura** → verificar `FACTURA_CANCELADA` + estado CANCELADA
5. **FAIL: cliente no encontrado** → verificar `FAIL` + `error_code`
6. **FAIL: factura con CxC no editable** → verificar `FAIL` + `FACTURA_CON_CXC`

Limpieza en orden FK-safe: conceptos → pagos → CxC → facturas → cotizaciones (de test).
`registro_auditoria` es inmutable (se deja).

### 5.4 Verificación

```bash
npx tsc --noEmit          # Sin errores de tipo
npm run lint              # Sin warnings de ESLint
npm run test              # Todos los unit tests pasando
npm run test:integration  # Todos los integration tests pasando
```

---

## 6. Validación y Riesgos

1. **Estado de factura tras cobro**: Cuando el módulo de cobranza registra un pago contra una CxC que tiene factura, la factura debe cambiar `TIMBRADA → PAGADA` automáticamente. Esto requiere modificar `CobranzaService.registrarCobro` para detectar si la CxC tiene `factura_id` y actualizar el estado de la factura. **Riesgo bajo** — es un `UPDATE` adicional en la misma transacción.

2. **Factura editable vs CxC existente**: Si una factura ya tiene CxC asociada, NO se deben editar conceptos (podría desincronizar montos). El servicio debe verificar `cuentas_por_cobrar.factura_id` antes de permitir modificaciones. **Error code:** `FACTURA_CON_CXC`.

3. **Cálculo de impuestos**: El IVA (16%) se calcula por concepto, no global. Cada concepto puede tener `impuesto_tasa` (null = exento). `impuesto_importe = importe * tasa`. La factura suma todos los impuestos. **Sin riesgo** — es aritmética pura.

4. **Código secuencial FAC-YYYY-NNNN**: Se genera con `SELECT COUNT(*) + 1` de facturas del año actual. Bajo concurrencia, usar `SELECT MAX(folio::int)` o `uuid_generate_v4()` como fallback. **Riesgo bajo** — uso interno, no CRM público.

5. **Plantilla cobranza**: El módulo facturas replica el patrón probado de cobranza (auditoría, DTOs, transacciones, tests) — minimiza riesgo de implementación.

6. **Frontend sin catálogo de conceptos**: Los conceptos se crean inline en el modal de factura (sin endpoint separado de catálogo). Es suficiente para la Fase 3; se puede refinar en Fase 5 si se necesitan plantillas de facturación recurrente.

7. **Monorepo**: DTOs viven en el backend; el frontend espeja los contratos en `api.ts` (consistente con cobranza/proveedores). Validar la fuente en el backend siempre.

---

## 7. Tiempo Estimado

| Sub-fase | Descripción | Estimación |
|----------|-------------|------------|
| 3a | Schema + Migración + Seed | 0.5 día |
| 3b | Módulo Facturas NestJS + Tests | 2 días |
| 3c | Integración Cotización → Factura + CxC | 0.5 día |
| 3d | Frontend Facturas + Integración Cotizaciones | 1.5 días |
| **Total** | | **~4.5 días** |