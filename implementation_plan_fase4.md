# Plan de Implementación — Fase 4: Proyecto en CxC + Bitácora → CxC (O1, O2, O3)

## Estado del Proyecto

```
Fase 1 ✅ (2-3 días): migración + módulo cobranza + seed + tests
Fase 2 ✅:            conectar frontend a API real (cobranza.page.tsx)
Fase 3 ✅:            módulo facturas → cotización aceptada → CxC
Fase 4 📋:  proyecto en CxC + bitácora → CxC                      ← ESTE PLAN
Fase 5:     reportes consolidados y conciliación
```

Cadena de valor: **cotización → factura + CxC → cobro → ingreso** + **bitácora de renta → CxC**

---

## 1. Resumen del Requerimiento

La Fase 4 cierra los códigos **O1, O2, O3** del roadmap de Operaciones. El objetivo es
que la cartera por cobrar hable el idioma de la operación: **por obra/proyecto**, y que
los cargos por renta de maquinaria **nazcan solos** desde la bitácora (cero digitación).

| Código | Descripción | Dependencia | Objetivo |
|--------|-------------|-------------|----------|
| O1 | `proyecto_id` en `cuentas_por_cobrar` → cartera por obra | migración + módulo proyectos | Saber qué obra debe dinero |
| O2 | Reporte de cartera por obra/proyecto (export agrupado) | O1 | Dirección ve morosos por obra |
| O3 | Bitácora de renta cerrada → CxC automática (`bitacora_id`) | módulo bitacoras-renta (se consume, se le agrega 1 endpoint) | El cargo nace sin digitación |

**Estado actual (verificado en código y BD):**

- `cuentas_por_cobrar` ya tiene `bitacora_id` (relación 1:N con `bitacoras_renta_diaria`)
  y el módulo de cobranza ya maneja CxC creadas manualmente o desde factura.
- **No tiene `proyecto_id`** → O1 requiere migración aditiva.
- `bitacoras_renta_diaria` ya tiene `importe_total_renta`, `cliente_id` y
  `estado_cobro` enum: `PENDIENTE_FIRMA → LISTO_FACTURAR → FACTURADO`.
  El módulo `bitacoras-renta` (NestJS) es CRUD completo, **sin** endpoint que cree CxC.
- Derivación proyecto↔obra: `bitacoras_renta_diaria.obra_id → obras.proyecto_id`
  (nullable). Las CxC de factura NO tienen proyecto hoy → asignación retroactiva manual.
- Frontend: `/cobranza` ya usa API real (3 tabs, stats, cobros, ledger). Las bitácoras
  de renta se consumen en `/trabajadores` (`BitacorasRentaModal`). `/proyectos` ya es
  CRUD completo con `proyectosApi.catalogos()` para los selects.
- Permisos: el controller de bitácoras de renta usa `rrhh.trabajadores.*` y cobranza usa
  `comercial.cobranza.*` — **los permisos existentes cubren Fase 4 sin cambios RBAC**.

---

## 2. Impacto Backend

### 2.1 Schema Prisma — migración aditiva `cxc_proyecto_link`

```prisma
// cuentas_por_cobrar
model cuentas_por_cobrar {
  // ...existente
  proyecto_id String?    @db.Uuid          // NUEVO — cartera por obra
  proyectos   proyectos? @relation(fields: [proyecto_id], references: [id])
  // ...existente
  @@index([proyecto_id, estado])           // NUEVO
}

// enum AuditAction: + BITACORA_FACTURADA
```

- ✋ **Entorno**: `prisma migrate dev` no funciona (shadow DB falla con el seed RBAC).
  Flujo manual igual que Fase 3: `prisma migrate diff --from-config-datasource
  --to-schema prisma/schema.prisma --script` → `prisma db execute --file <migración.sql>`
  → INSERT en `_prisma_migrations` (checksum sha256, `applied_steps_count` 1) →
  `prisma generate`.
- `ALTER TYPE "AuditAction" ADD VALUE 'BITACORA_FACTURADA';` — solo si la auditoría de
  bitácoras lo requiere (decidido en 4c).

#### Migración SQL esperada

```sql
-- SVR-ERP: Fase 4 — proyecto en CxC + bitácora → CxC
ALTER TABLE "cuentas_por_cobrar" ADD COLUMN "proyecto_id" UUID;
ALTER TABLE "cuentas_por_cobrar" ADD CONSTRAINT "cuentas_por_cobrar_proyecto_id_fkey"
  FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "idx_cxc_proyecto_estado" ON "cuentas_por_cobrar"("proyecto_id", "estado");

-- (4c) solo si se requiere auditoría propia de bitácora:
ALTER TYPE "AuditAction" ADD VALUE 'BITACORA_FACTURADA';
```

### 2.2 Módulo cobranza — O1 (proyecto en CxC)

**DTOs** (`apps/api/src/cobranza/dto/`):
- `crear-cuenta.dto.ts` — agregar `proyectoId?: string` (`@IsOptional() @IsUUID()`)
- `actualizar-cuenta.dto.ts` — agregar `proyectoId?: string | null` (permite limpiar)

**Service** (`cobranza.service.ts`):
- `crearCuenta`: si `proyectoId` viene → validar proyecto existe y activo
  (error code `PROYECTO_NO_ENCONTRADO`); persistir.
- `actualizarCuenta`: acepta `proyectoId` (o `null` para desligar).
- `findAll`: filtro `proyectoId` + `include: { proyectos: { select: { codigo, nombre } } }`
  → `serializeCuenta` agrega `proyecto: { id, codigo, nombre } | null` y `proyectoId`.
- `findOne`, `cobrosDeCuenta`, `cobros`, `vencimientos`, `stats`: incluir el mismo select
  para consistencia del ledger (bajo costo).

**Controller**: sin rutas nuevas — se amplían las existentes.

### 2.3 Reporte cartera por obra — O2

Nuevo endpoint (controller cobranza):

| Método | Ruta | Permiso | Acción |
|--------|------|---------|--------|
| GET | `/api/cobranza/por-proyecto` | `comercial.cobranza.ver` | Cartera agrupada por proyecto |
| GET | `/api/cobranza/por-proyecto/exportar` | `comercial.cobranza.exportar` | CSV agrupado (BOM UTF-8) |

**Respuesta `porProyecto()`:**
```
items: [{
  proyecto: { id, codigo, nombre } | null,   // null = "Sin proyecto"
  totalCuentas,
  monto,          // SUM(monto)
  pagado,         // SUM(monto_pagado)
  saldo,          // monto - pagado
  vencido,        // SUM(saldo) WHERE vencimiento < hoy AND estado != PAGADO
}],
totales: { monto, pagado, saldo, vencido }
```

- Filtros opcionales: `estado?` (default: todas las activas), `busqueda?` sobre
  proyecto/cliente. Agrupa por `proyecto_id` (incluye proyecto null → "Sin proyecto").
- CSV: encabezados `Proyecto,Cuentas,Monto,Saldo,Vencido` + fila por proyecto + total.

### 2.4 Bitácora de renta → CxC — O3

Nuevo endpoint en `bitacoras-renta` (el cargo nace desde la bitácora, dominio origen):

| Método | Ruta | Permiso | Acción |
|--------|------|---------|--------|
| POST | `/api/bitacoras-renta/:id/facturar` | `rrhh.trabajadores.editar` | CxC desde bitácora LISTO_FACTURAR |

**Transacción (en `BitacorasRentaService`):**
```
prisma.$transaction([
  1. Validar bitácora existe, activa, no eliminada
  2. Validar estado_cobro = LISTO_FACTURAR  → BITACORA_NO_LISTA_FACTURAR (409)
  3. Guard anti doble clic: updateMany bitácora SET estado_cobro = FACTURADO
     WHERE id AND estado_cobro = LISTO_FACTURAR → si count = 0 → BITACORA_YA_FACTURADA (409)
  4. Validar cliente activo → CLIENTE_INACTIVO (409)
  5. Derivar proyecto: obra_id → obras.proyecto_id (nullable)
  6. Crear CxC: cliente_id, bitacora_id, proyecto_id?, monto = importe_total_renta,
     fecha_vencimiento = hoy + 30 días, estado = PENDIENTE
  7. Audits: BITACORA_FACTURADA SUCCESS + CXC_CREADA SUCCESS
])
```

**Error codes:**
- `BITACORA_NO_ENCONTRADA` — 404
- `BITACORA_NO_LISTA_FACTURAR` — 409 (PENDIENTE_FIRMA — falta firma del cliente)
- `BITACORA_YA_FACTURADA` — 409 (doble clic / ya tiene CxC)
- `CLIENTE_INACTIVO` — 409

Reutiliza `CobranzaService.generarCodigoCuenta` vía inyección del módulo cobranza
(`CobranzaModule` exporta el service o se mueve `generarCodigo` a un helper común).

### 2.5 Seed `apps/api/scripts/seed-fase4.ts`

- 3 CxC ligadas a `proyecto_id` de proyectos existentes (rotando 2-3 estados: PENDIENTE,
  PARCIAL, PAGADO) — una de ellas SIN proyecto (grupo "Sin proyecto").
- 2 bitácoras de renta en `estado_cobro = LISTO_FACTURAR` (importes válidos) listas
  para probar O3, y 1 ya `FACTURADO` con CxC ligada (verifica guard).
- Idempotente (upsert por folio/código), fuente `SYSTEM` en auditoría.

### 2.6 Estándar obligatorio (AGENTS.md) en cada endpoint

1. `JwtAuthGuard` + `PermissionsGuard` + `@RequirePermission(...)`.
2. Blacklist de token automática (JwtStrategy → `token_blacklist` por `jti`).
3. Auditoría SUCCESS en todas las mutaciones (`AuditService.log`).
4. Patrón `fallir()` con `result: 'FAIL'` + `error_code` antes de lanzar la excepción.
5. Soft deletes (`activo = false`), nunca delete físico.
6. DTOs estrictos `class-validator`.
7. `AuditContextInterceptor` captura metadata/IP/session.

---

## 3. Impacto Frontend

### 3.1 Modificar `/cobranza` — O1 + O2

- **Columna "Proyecto"** en el tab Cuentas (badge con nombre o "—" si null).
- **Filtro "Proyecto"** en `FilterPanel` (select dinámico desde `proyectosApi.catalogos()`).
- **Modal "Nueva cuenta"** (nuevo, expone el `crearCuenta` que ya existe en la API):
  selector Cliente + Proyecto + Monto + Vencimiento + (opcional) Factura.
- **Editar cuenta**: selector Proyecto (asignar/desligar con `proyectoId: null`).
- **Tab "Por obra"** (nuevo): StatsCards (Total cartera, Saldo, Vencido) + tabla agrupada
  por proyecto + botón **Exportar** (CSV) con `puedeExportar`.

### 3.2 Modificar bitácora de renta — O3 (`/trabajadores` → `BitacorasRentaModal`)

- Botón **"Facturar"** en la fila/modal de bitácora cuando
  `estadoCobro === 'Listo para Facturar'` y `puedeEditar` (RBAC `rrhh.trabajadores`).
- `window.confirm` + `POST /bitacoras-renta/:id/facturar` → toast éxito/error + refresh.
- After facturar, el estado de la bitácora cambia a `Facturado` (bloquea el botón).

### 3.3 API Client en `apps/web/src/lib/api.ts`

```ts
// cobranzaApi (nuevos métodos)
exportarPorProyecto: () => apiClient.get('/cobranza/por-proyecto/exportar', { responseType: 'blob' }),
porProyecto: (params?) => apiClient.get('/cobranza/por-proyecto', { params }),
// crearCuenta / actualizarCuenta aceptan proyectoId

// bitacorasRentaApi (nuevo método)
facturar: (id) => apiClient.post(`/bitacoras-renta/${id}/facturar`, {}),
```

---

## 4. Sub-fases de Implementación

### 4.1 Sub-fase 4a: Migración + Seed (backend)

**Archivos:**
1. `apps/api/prisma/schema.prisma` — `proyecto_id` en `cuentas_por_cobrar` (+ AuditAction)
2. `apps/api/prisma/migrations/20260915000000_cxc_proyecto_link/migration.sql`
3. `apps/api/scripts/seed-fase4.ts`
4. `apps/api/src/audit/audit.constants.ts` — severidad para `BITACORA_FACTURADA`

**Entregable:** Migración aplicada, `prisma generate`, seed funcional e idempotente.

### 4.2 Sub-fase 4b: O1 + O2 backend (proyecto en CxC + reporte por obra)

**Archivos a modificar:**
1. `apps/api/src/cobranza/dto/crear-cuenta.dto.ts` — `proyectoId?`
2. `apps/api/src/cobranza/dto/actualizar-cuenta.dto.ts` — `proyectoId? | null`
3. `apps/api/src/cobranza/cobranza.service.ts` — validar/persistir proyecto, filtro,
   include/serialize, `porProyecto()`, `exportarPorProyecto()`
4. `apps/api/src/cobranza/cobranza.controller.ts` — rutas `por-proyecto` (+ exportar)

**Archivos a crear:**
5. Tests unitarios (service + controller) para los nuevos métodos y filtro

**Entregable:** CxC con proyecto, cartera filtrable por obra, reporte + CSV agrupado.

### 4.3 Sub-fase 4c: O3 backend (bitácora → CxC)

**Archivos a modificar:**
1. `apps/api/src/bitacoras-renta/bitacoras-renta.service.ts` — `facturar(id, userId)`
2. `apps/api/src/bitacoras-renta/bitacoras-renta.controller.ts` — `POST :id/facturar`
3. `apps/api/src/bitacoras-renta/bitacoras-renta.module.ts` — importar CobranzaModule
4. `apps/api/src/cobranza/cobranza.module.ts` — exportar CobranzaService (o helper de código)

**Archivos a crear:**
5. Tests unitarios + integration (bitácora → CxC real + audits)

**Entregable:** Cargo de renta nace de la bitácora en un clic, con guard anti doble clic.

### 4.4 Sub-fase 4d: Frontend

**Archivos a modificar:**
1. `apps/web/src/lib/api.ts` — `porProyecto`, `exportarPorProyecto`, `facturar`,
   `proyectoId` en crear/actualizar CxC
2. `apps/web/src/app/(dashboard)/cobranza/page.tsx` — columna + filtro Proyecto,
   modal Nueva cuenta, edit de proyecto, tab Por obra + Exportar
3. `apps/web/src/components/workers/BitacorasRentaModal.tsx` — botón Facturar
4. `apps/web/src/app/(dashboard)/trabajadores/page.tsx` — si el botón vive en la tabla

**Entregable:** Cartera por obra visible en `/cobranza`, export agrupado, bitácoras
facturables desde la UI.

---

## 5. Testing — obligatorio (AGENTS.md)

### 5.1 Unit Tests cobranza (service + controller)

- `crearCuenta` — con `proyectoId` válido, proyecto inexistente (`PROYECTO_NO_ENCONTRADO`)
- `actualizarCuenta` — asignar, cambiar y desligar proyecto (`null`)
- `findAll` — filtro `proyectoId` + serialize con proyecto
- `porProyecto` — agrupación correcta, grupo "Sin proyecto", cálculo de saldo/vencido
- `exportarPorProyecto` — CSV con BOM y encabezados

### 5.2 Unit Tests bitacoras-renta

- `facturar` — caso feliz (CxC creada + estado FACTURADO), `BITACORA_NO_LISTA_FACTURAR`,
  `BITACORA_YA_FACTURADA` (doble clic), `CLIENTE_INACTIVO`, audits SUCCESS

### 5.3 Integration Tests (PostgreSQL real)

1. **Bitácora → CxC**: crear bitácora (directo) en LISTO_FACTURAR → `facturar` →
   CxC persistida con `bitacora_id` + `BITACORA_FACTURADA` y `CXC_CREADA` en
   `registro_auditoria`
2. **Guard**: segundo `facturar` → `BITACORA_YA_FACTURADA` con audit FAIL
3. **Por proyecto**: CxC con y sin proyecto → `porProyecto` agrupa ambos grupos

Limpieza FK-safe: pagos → CxC → bitácoras → proyectos/clientes de test.
`registro_auditoria` inmutable (se deja).

### 5.4 Verificación

```bash
npx tsc --noEmit          # Sin errores de tipo (api + web)
npm run test              # Unit tests pasando
npm run test:integration  # Integration tests pasando
```

---

## 6. Validación y Riesgos

1. **CxC históricas sin proyecto**: se mantienen en el grupo "Sin proyecto" y se pueden
   asignar retroactivamente con `actualizarCuenta({ proyectoId })`. **No hay bloqueo**.
2. **Doble clic / concurrencia en Facturar bitácora**: guard dentro de la transacción
   (`updateMany ... WHERE estado_cobro = LISTO_FACTURAR` + `FACTURADO`), el segundo
   intento recibe `BITACORA_YA_FACTURADA`. **Riesgo bajo** — patrón probado en Fase 3
   (updateMany con where TIMBRADA).
3. **Bitácoras PENDIENTE_FIRMA**: no son facturables (error claro con mensaje de que
   falta la firma del cliente). UI solo muestra el botón en `Listo para Facturar`.
4. **Derivación de proyecto nullable**: `obra.proyecto_id` puede ser null → la CxC nace
   sin proyecto, visible en "Sin proyecto"; se asigna después en `/cobranza`.
5. **Sin cambios RBAC**: los permisos existentes (`rrhh.trabajadores.editar`,
   `comercial.cobranza.*`) cubren la fase — evita migración de permisos.
6. **Monto bitácora ≠ factura**: la CxC de bitácora NO lleva factura (`factura_id =
   null`) — no aplica el check de `FACTURA_CON_CXC`; el cobro se registra igual.
7. **Migraciones manuales**: shadow DB sigue fallando con el seed RBAC → mismo flujo
   manual de Fase 3 (documentado en 2.1).
8. **`implementation_plan copy.md`** es el plan viejo de Fase 1-2 (ya cumplido) —
   se puede eliminar o archivar; no afecta esta fase.

---

## 7. Tiempo Estimado

| Sub-fase | Descripción | Estimación |
|----------|-------------|------------|
| 4a | Migración + Seed | 0.5 día |
| 4b | O1 + O2 backend (proyecto + reporte por obra) | 1 día |
| 4c | O3 backend (bitácora → CxC) | 1 día |
| 4d | Frontend (cobranza por obra + botón Facturar) | 1.5 días |
| **Total** | | **~4 días** |