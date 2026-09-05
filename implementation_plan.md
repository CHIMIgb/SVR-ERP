# Plan de Implementación — Backend /proveedores (órdenes de compra, abonos, CxP)

## 1. Resumen del Requerimiento

La vista `/proveedores` quedó reconstruida en el frontend (commit `17961e45`) con 3 tabs:
Proveedores, Órdenes de Compra y Estados de Cuenta (tabla resumen + modal ledger con
saldo corrido). Actualmente es **fase 1 mock**: no existe módulo NestJS ni tablas para
órdenes de compra, abonos ni cuentas por pagar. Este plan cubre el backend completo para
persistir todo: CRUD proveedores, CRUD órdenes de compra, registro de abonos y el
estado de cuenta (ledger) por proveedor.

## 2. Impacto Backend

### 2.1 Schema Prisma (`apps/api/prisma/schema.prisma`) — migración aditiva

**Enums nuevos:**

```prisma
enum EstadoOrdenCompra {
  PENDIENTE
  APROBADA
  RECIBIDA
  CANCELADA
}
```

**AuditAction nuevos** (aditivos al enum existente):
`PROVEEDOR_CREADO`, `PROVEEDOR_ACTUALIZADO`, `PROVEEDOR_ELIMINADO`,
`ORDEN_COMPRA_CREADA`, `ORDEN_COMPRA_ACTUALIZADA`, `ORDEN_COMPRA_ELIMINADA`,
`ORDEN_COMPRA_ESTADO_CAMBIADO`, `PAGO_PROVEEDOR_REGISTRADO`.

**Modelo `proveedores` existente — agregar 1 campo (aditivo):**

```prisma
categoria  String?  @default("Otros")
// + relations: ordenes_compra[], cuentas_por_pagar[], pagos_proveedor[]
```

**Modelos nuevos:**

```prisma
model ordenes_compra {
  id                 String             @id @db.Uuid
  folio              String             @unique            // OC-YYYY-NNN auto
  proveedor_id       String             @db.Uuid
  descripcion        String
  monto              Decimal            @db.Decimal(14, 2)
  pagado             Decimal            @default(0) @db.Decimal(14, 2)
  fecha              DateTime           @db.Date
  estado             EstadoOrdenCompra  @default(PENDIENTE)
  motivo_cancelacion String?
  activo             Boolean            @default(true)
  creado_en          DateTime @db.Timestamptz() @default(now())
  actualizado_en     DateTime @db.Timestamptz()
  creado_por         String? @db.Uuid
  actualizado_por    String? @db.Uuid
  eliminado_en       DateTime? @db.Timestamptz()
  proveedores        proveedores        @relation(fields: [proveedor_id], references: [id])
  cuentas_por_pagar  cuentas_por_pagar[]
  pagos_proveedor    pagos_proveedor[]
  @@index([proveedor_id, estado])
  @@index([fecha])
}

model cuentas_por_pagar {
  id                String         @id @db.Uuid
  proveedor_id      String         @db.Uuid
  orden_compra_id   String         @unique @db.Uuid     // 1:1 con OC
  monto             Decimal        @db.Decimal(14, 2)
  monto_pagado      Decimal        @default(0) @db.Decimal(14, 2)
  fecha_vencimiento DateTime?      @db.Date
  estado            String         @default("PENDIENTE") // PENDIENTE | PARCIAL | PAGADA
  activo            Boolean        @default(true)
  creado_en         DateTime @db.Timestamptz() @default(now())
  actualizado_en    DateTime @db.Timestamptz()
  proveedores       proveedores    @relation(fields: [proveedor_id], references: [id])
  ordenes_compra    ordenes_compra @relation(fields: [orden_compra_id], references: [id])
  pagos_proveedor   pagos_proveedor[]
  @@index([proveedor_id, estado])
}

model pagos_proveedor {
  id              String         @id @db.Uuid
  codigo          String         @unique                // PAG-PROV-YYYY-NNN auto
  proveedor_id    String         @db.Uuid
  orden_compra_id String         @db.Uuid
  monto           Decimal        @db.Decimal(14, 2)
  fecha_pago      DateTime       @db.Date
  metodo_pago     String         @default("EFECTIVO")
  referencia      String?
  activo          Boolean        @default(true)
  creado_en       DateTime @db.Timestamptz() @default(now())
  creado_por      String? @db.Uuid
  eliminado_en    DateTime? @db.Timestamptz()
  proveedores     proveedores    @relation(fields: [proveedor_id], references: [id])
  ordenes_compra  ordenes_compra @relation(fields: [orden_compra_id], references: [id])
  @@index([proveedor_id, fecha_pago])
}
```

> Nota: `pagos_proveedor` NO lleva `cuentas_por_pagar_id` (redundante: CxP es 1:1 con la OC).
> La cuenta se deriva vía `orden_compra_id`.

**Migración:** `npx prisma migrate dev --name proveedores_ordenes_compra`
(aditiva; ALTER TYPE ... ADD VALUE para enums; CREATE TABLE sin tocar tablas existentes).

### 2.2 Módulos NestJS nuevos

```
apps/api/src/proveedores/
  proveedores.module.ts
  proveedores.controller.ts
  proveedores.service.ts
  proveedores.service.spec.ts
  proveedores.controller.spec.ts
  proveedores.integration.spec.ts
  ordenes-compra.controller.ts      (o endpoints dentro del mismo controller)
  dto/
    create-proveedor.dto.ts
    update-proveedor.dto.ts
    query-proveedores.dto.ts
    create-orden-compra.dto.ts
    update-orden-compra.dto.ts
    cambiar-estado-orden.dto.ts
    registrar-abono.dto.ts
    query-ordenes-compra.dto.ts
```

Registrar `ProveedoresModule` en `app.module.ts`.

### 2.3 Endpoints

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/proveedores` | comercial·proveedores·ver | Listar con search, categoría, paginación |
| GET | `/proveedores/:id` | ver | Detalle |
| POST | `/proveedores` | crear | Alta |
| PATCH | `/proveedores/:id` | editar | Actualización |
| DELETE | `/proveedores/:id` | eliminar | Soft delete (no elimina si tiene CxP pendiente) |
| GET | `/proveedores/estados-cuenta` | ver | Resumen: proveedor, #ops, total, pagado, saldo |
| GET | `/proveedores/:id/estado-cuenta` | ver | Ledger: fecha, folio, concepto, cargo, abono, saldo corrido |
| GET | `/ordenes-compra` | ver | Listar con search, estado, proveedorId, paginación |
| GET | `/ordenes-compra/:id` | ver | Detalle + abonos |
| POST | `/ordenes-compra` | crear | Crear OC + CxP en `$transaction` |
| PATCH | `/ordenes-compra/:id` | editar | Editar descripción/monto (solo PENDIENTE/APROBADA) |
| DELETE | `/ordenes-compra/:id` | eliminar | Soft delete (solo sin pagos) |
| POST | `/ordenes-compra/:id/cambiar-estado` | editar | Aprobar / Recibir / Cancelar (motivo obligatorio en cancelar) |
| POST | `/proveedores/:id/abonos` | editar | Registrar abono (ver 2.4) |

Los 4 requisitos obligatorios (AGENTS.md): `JwtAuthGuard` + `PermissionsGuard`,
blacklist automática vía `JwtStrategy`, auditoría SUCCESS en operaciones y auditoría
FAIL + `fallir()` en fallos de negocio (patrón `criba.service.ts`).

**Validaciones DTO (class-validator):**
- `CreateProveedorDto`: `@IsString() @IsNotEmpty()` nombre; rfc/correo/teléfono opcionales (`@IsEmail()`, `@IsRFC()` custom o regex), `categoria` opcional `@IsIn(['Refacciones','Combustible','Materiales','Servicios','Otros'])`.
- `CreateOrdenCompraDto`: `proveedorId @IsUUID()`, `descripcion @IsString()`, `monto @IsNumber() @Min(0.01)`, `fecha @IsDateString()` opcional.
- `RegistrarAbonoDto`: `ordenCompraId @IsUUID()`, `monto @IsNumber() @Min(0.01)`, `metodoPago` opcional, `referencia` opcional.
- `CambiarEstadoOrdenDto`: `estado @IsEnum(EstadoOrdenCompra)`, `motivo` requerido si CANCELADA.
- `QueryProveedoresDto` / `QueryOrdenesCompraDto`: `search`, `page @Min(1)`, `limit @Max(100)`, filtros.

### 2.4 Reglas de negocio en Services

**Crear OC** (`$transaction`):
1. Validar proveedor existe y `activo` + `eliminado_en: null`.
2. Generar folio `OC-YYYY-NNN` (contador del año + `findFirst` por creado_en desc) con
   reintento si choca con el unique (1 retry).
3. `ordenes_compra.create` + `cuentas_por_pagar.create` (monto, estado PENDIENTE).
4. Auditoría `ORDEN_COMPRA_CREADA` (SUCCESS). Fallos → `fallir()` FAIL.

**Cambiar estado**:
- `PENDIENTE → APROBADA → RECIBIDA`: transición forward validada.
- `→ CANCELADA`: requiere `motivo_cancelacion`, solo si `pagado === 0` (si ya se abonó
  no se puede cancelar); marca `cuentas_por_pagar.estado = 'CANCELADA'` (o elimina la
  cuenta activa).
- Actualiza `actualizado_en`/`actualizado_por`.

**Registrar abono** (`$transaction`):
1. Validar OC existe, no CANCELADA, y `pagado + monto <= monto`.
2. `pagos_proveedor.create` (codigo `PAG-PROV-YYYY-NNN`).
3. `ordenes_compra.update` (`pagado += monto`; `estado = RECIBIDA` si quedó pagada).
4. `cuentas_por_pagar.update` (`monto_pagado += monto`; estado `PAGADA` si
   `monto_pagado >= monto`, `PARCIAL` si no).
5. `transacciones.create` (egreso: tipo `EGRESO`, categoria `PROVEEDORES`,
   `entidad_tipo: 'PROVEEDOR'`, `entidad_id: proveedor_id`) → alimenta finanzas.
6. Auditoría `PAGO_PROVEEDOR_REGISTRADO` (SUCCESS).

**Estado de cuenta (ledger):**
- Resumen: `proveedores.findMany` con `_count` de OC + `aggregate _sum` monto/pagado,
  saldo = monto − pagado.
- Detalle: OC del proveedor ordenadas por fecha asc, saldo corrido acumulado en
  el serializer; incluir `pagos_proveedor` si se quiere mostrar abonos
  individuales (fase 1: cargo=OC, abono=pagado por OC).

**Soft deletes:**
- `proveedores`: solo si no tiene CxP con saldo pendiente (`monto_pagado < monto`).
- `ordenes_compra`: solo si `pagado === 0`.
- Nunca `delete` físico; usar `eliminado_en`.

### 2.5 Tests (obligatorio — AGENTS.md)

- `proveedores.service.spec.ts`: cada método público ≥ 1 test (Crear valida nombre,
  listar filtra por categoría, fallir en proveedor inexistente para OC, saldo leder...).
- `proveedores.controller.spec.ts`: cada endpoint ≥ 1 test.
- DTO specs con `class-validator`.
- Guards: JWT/permisos true/false.
- `proveedores.integration.spec.ts` (DB real, `npm run test:integration`):
  - crear proveedor → `registro_auditoria` con `PROVEEDOR_CREADO` SUCCESS.
  - crear OC + CxP → auditoría `ORDEN_COMPRA_CREADA`.
  - abono → `PAGO_PROVEEDOR_REGISTRADO` SUCCESS + `pagos_proveedor` persistido.
  - Cleanup FK-safe; `registro_auditoria` inmutable se deja.

## 3. Impacto Frontend (fase 2 — posterior al backend)

- `apps/web/src/lib/api.ts`: `proveedoresApi` (listar/crear/actualizar/eliminar/estadosCuenta)
  + `ordenesCompraApi` (listar/crear/actualizar/cambiarEstado/abonos) con
  `apiClient` y tipos `ProveedorDTO`, `OrdenCompraDTO`, `EstadoCuentaResumenDTO`,
  `LedgerRowDTO`.
- `apps/web/src/app/(dashboard)/proveedores/page.tsx`: reemplazar mock por
  `useEffect` fetch + `Pagination` server-side + `initialLoading`/`refreshing`
  (patrón /inventario). Mantener tabs y botones. Quitar `uid()`/mock data.
- `formatCurrency` ya compartido — sin cambios.

## 4. Validación y Riesgos

- **Enum Prisma**: agregar valores a `AuditAction` y enum nuevo requieren
  `ALTER TYPE ... ADD VALUE` — aditivo, seguro. La migración NO debe tocar tablas
  existentes.
- **Folios concurrentes**: unique constraint + 1 reintento. Si persiste el choque,
  error controlado con `fallir()` (no 500 crudo).
- **Doble clic en abono**: `$transaction` serializable + validación
  `pagado + monto <= monto` dentro de la transacción. Idempotencia_key en
  `pagos_proveedor` se difiere a fase 2 (riesgo bajo, mismo análisis que ventas).
- **Regla de no-cancelar OC con pagos**: dato sensible — testeado con unidad
  (rechazo) e integración (auditoría FAIL).
- **Consistencia CxP ↔ OC**: mantenida atomáticamente en `$transaction`; el saldo del
  frontend (ledger) debe calcularse SIEMPRE desde `ordenes_compra` (monto − pagado),
  nunca confiar en `cuentas_por_pagar` como fuente primaria de saldo corrido en UI.
- **Permisos RBAC**: se reutilizan los 4 existentes (`comercial.proveedores.*`) —
  no se agregan permisos nuevos (YAGNI); órdenes/abonos usan crear/editar.

## 5. Orden de ejecución sugerido

1. Schema + migración (`npx prisma migrate dev`) + `prisma generate`.
2. DTOs (con specs de validación).
3. `ProveedoresService` (CRUD + estados de cuenta) + specs.
4. `ProveedoresController` (RBAC) + specs.
5. Lógica abonos + transacciones + specs.
6. `ProveedoresModule` + `app.module.ts`.
7. Integration specs (`npm run test:integration`).
8. Fase 2 frontend (conectar API).