# Plan de Implementación — Fase 7: Recepción de Órdenes de Compra → Alta/Actualización en Inventario

## Estado del Proyecto

```
Fase 1 ✅:  migración + módulo cobranza + seed + tests
Fase 2 ✅:  conectar frontend a API real (cobranza)
Fase 3 ✅:  módulo facturas → cotización aceptada → CxC  (respaldo: implementation_plan_fase3_facturas_backup.md)
Fase 4-6 ✅: proyectos/CxC, reportes, conciliación
Fase 7 📋:  recepción de OC → alta automática en /inventario   ← ESTE PLAN
```

Cadena de valor a cerrar: **requisición → orden de compra (con líneas) → aprobación → recepción física → alta/actualización de stock en inventario → CxP**

---

## 0. Vinculación obligatoria con `AGENTS.md`

> **⚠️ Este plan queda vinculado a la raíz del repositorio: `AGENTS.md`.**
> **TODAS las reglas, estándares y restricciones ahí documentadas son de cumplimiento
> obligatorio para cada una de las tareas T1–T9 de esta fase.** Ninguna tarea se considera
> terminada si viola alguna de ellas.

**Fuente de la verdad:** `AGENTS.md` (raíz del repo) + `audit-service-guide.md` (mencionado
explícitamente en "Estándar Obligatorio de Endpoints y Vistas CRUD").

### Reglas globales que aplican directamente a esta fase

**1. Estándar obligatorio de endpoints (Backend — `AGENTS.md` § "Estándar Obligatorio"):**
Todo endpoint del API debe cumplir los 4 requisitos de seguridad/auditoría:
1. Token JWT válido (`JwtAuthGuard`) — **aplicará a `POST /ordenes-compra/:id/recibir`**.
2. Verificación de blacklist del token (automática vía `JwtStrategy`).
3. Auditoría de operaciones exitosas (`AuditService.log` con `SUCCESS`).
4. Auditoría de fallos de negocio en mutaciones (`result: FAIL` + `error_code` antes de
   lanzar la excepción — patrón `fallir()`, como en `criba.service.ts` / `proveedores.service.ts`).
Referencia viva del estándar completo: `apps/api/src/criba/`.

**2. RBAC obligatorio:** `@UseGuards(JwtAuthGuard, PermissionsGuard)` +
`@RequirePermission('comercial', 'proveedores', …)` en cada endpoint modificado/nuevo.

**3. Regla de Plantilla de Vistas CRUD:** toda vista nueva/refactorizada toma `/inventario` como
plantilla base (`PageHeader`, `StatsCard`, `SearchBar`/`FilterPanel`, `DataTable`, `Pagination`,
`FormModal`, permisos vía `useAuth().user.vistas`). **Nunca re-implementar lo que ya existe.**

**4. Testing obligatorio (AGENTS.md § "Testing — Mandatory Rule"):**
- Cualquier función o módulo nuevo **debe incluir unit tests** (`*.spec.ts`).
- Cualquier prueba de logs de auditoría (`registro_auditoria`) **debe ser integration test**
  (`*.integration.spec.ts`, corrido con `npm run test:integration`), sin mocks de Prisma/Audit,
  con cleanup FK-safe y dejando los registros de auditoría (inmutables).
- AAA pattern, aislamiento entre tests, `describe()` por método.

**5. Soft deletes y auditoría en BD (`eliminado_en`, `creado_por`, `actualizado_por`, etc.):**
nunca delete físico; mantener consistencia al marcar líneas de OC como inactivas.

**6. Prisma:** UUIDs `@db.Uuid`, snake_case en columnas, migraciones vía flujo manual
documentado en §2.1 (nunca `prisma migrate dev` — shadow DB falla con el seed RBAC),
`schema.prisma` está en `apps/api/prisma/`, config en `apps/api/prisma.config.ts` (no en schema).

**7. Frontend — Responsive como regla #1:** todo lo que se agregue en `/proveedores`
(modales, editor de líneas, tabla de recepción) **debe ser responsive**: breakpoints `sm:`,
`md:`, `lg:`; tablas con scroll horizontal en móvil; modales adaptándose a pantallas pequeñas;
formularios apilándose en móvil.

**8. Frontend — Sin claves duplicadas:** antes de cada `.map()` que renderice JSX (editor de
líneas, modal de recepción) verificar unicidad de `key`; correr `npx tsc --noEmit` después.

**9. Frontend — Usar los componentes UI existentes (no re-implementar):** `FormModal`,
`ModalField`, `modalInputClass`/`modalSelectClass`, `DataTable`, `Badge`, `Button`, `Tabs`,
`SearchBar`/`FilterPanel`, `EmptyState`, `Pagination`, `StatsCard`, `PageHeader`. Importar
`formatCurrency` desde `@svr-erp/shared/utils/currency` (nada de `Intl.NumberFormat` inline).
`cn()` desde `@/lib/utils`.

**10. Documentación de componentes (AGENTS.md § "DOCUMENT EVERYTHING"):** si esta fase creara
algún componente nuevo en `src/components/ui/`, debe documentarse en `COMPONENTS.md` con Props
table, ejemplo de import/uso y secciones "When to use" / "When NOT to use". Se prefiere NO crear
componentes nuevos (el editor de líneas y el modal de recepción viven dentro de
`proveedores/page.tsx` reutilizando componentes existentes).

**11. Prohibido CSS inline (`style={{…}}`)** salvo los 3 casos permitidos de AGENTS.md
(mostré fixed/z-index dinámico/width-height runtime). Todo lo demás en clases Tailwind.

**12. Idioma:** toda cadena visible al usuario en **español (México)**; moneda `es-MX`/`MXN`.

Si una tarea de esta fase contradice alguna regla de `AGENTS.md`, **primero se consulta con el
Tech Lead (este rol)** antes de proceder.

---

## 1. Resumen del Requerimiento

El usuario solicita que **al recibir una orden de compra**, esta se dé de alta automáticamente en
`/inventario`; es decir:
- Si el producto **ya existe** en `articulos_inventario` → **actualizar stock** sumando la cantidad recibida.
- Si el producto **no existe** → **crear el artículo** en inventario con su stock inicial.

**Estado actual verificado en código:**
- `ordenes_compra` es una **tabla cabecera sin líneas de detalle** (`proveedor_id`, `descripcion` como texto libre, `monto`, `pagado`, `estado`). El sistema no sabe *qué* artículos ni *en qué cantidades* se compraron.
- `movimientos_inventario` **ya tiene los campos de trazabilidad** `referencia_tipo` y `referencia_id` (string/UUID opcionales), diseñados para vincular movimientos de stock con un documento origen. `InventarioService.crearMovimiento` ya actualiza stock + inserta movimiento en transacción.
- `cambiarEstadoOrden` al pasar a `RECIBIDA` **no toca inventario**.
- **Bug de coherencia detectado:** `registrarAbono` (línea ~917 de `proveedores.service.ts`) fuerza `estado = RECIBIDA` cuando `pagado >= monto`. Esto significa que hoy una OC "se recibe" al pagarse al 100%, no cuando llega la mercancía. Debe desacoplarse: **el stock refleja la recepción física; el dinero refleja el flujo de caja**.

**Objetivo:** Structurar la OC con líneas de partida y crear un endpoint de **recepción dedicado y atómico** que:
1. Actualice stock de artículos existentes (+ movimiento `ENTRADA` con referencia a la OC).
2. Cree artículos nuevos (alta automática controlada) con su stock inicial (+ movimiento `ENTRADA`).
3. Marque la OC como `RECIBIDA`.
4. Audite toda la operación.

---

## 2. Impacto Backend

### 2.1 Schema Prisma — migración aditiva `ordenes_compra_items_recepcion`

Nueva tabla de **detalle líneas** de la orden de compra. `articulo_id` es **nullable** a propósito
para soportar dos escenarios: (a) artículo ya catalogado → se vincula y se actualiza stock;
(b) artículo nuevo → se crea al recibir usando `nombre` como base.

```prisma
model ordenes_compra_items {
  id                String   @id @db.Uuid
  orden_compra_id   String   @db.Uuid
  articulo_id       String?  @db.Uuid          // NULO si aún no está catalogado
  nombre            String                      // Snapshot SIEMPRE (aunque exista articulo_id)
  cantidad          Decimal  @db.Decimal(10, 2)
  cantidad_recibida Decimal  @default(0) @db.Decimal(10, 2) // permite recepción parcial futura
  precio_unitario   Decimal  @db.Decimal(12, 2)
  activo            Boolean  @default(true)
  creado_en         DateTime @default(now()) @db.Timestamptz()
  actualizado_en    DateTime @db.Timestamptz()
  actualizado_por   String?  @db.Uuid
  creado_por        String?  @db.Uuid
  eliminado_en      DateTime? @db.Timestamptz()

  ordenes_compra     ordenes_compra     @relation(fields: [orden_compra_id], references: [id])
  articulos_inventario articulos_inventario? @relation(fields: [articulo_id], references: [id])

  @@index([orden_compra_id])
  @@index([articulo_id])
}
```

**Relaciones inversas a agregar:**
- En `ordenes_compra`: `ordenes_compra_items ordenes_compra_items[]`
- En `articulos_inventario`: `ordenes_compra_items ordenes_compra_items[]`

**Enum `AuditAction` — acción de auditoría nueva:**
```
ORDEN_COMPRA_RECIBIDA
```

**Cambio semántico en `monto`:** el `monto` de la OC pasa a **derivarse de la suma de las líneas**
(`Σ cantidad × precio_unitario`). La columna `monto` se conserva (compatibilidad con `cuentas_por_pagar`),
pero ya no será capturada por el frontend: se recalcula en el backend.

#### Migración SQL esperada

✋ **Entorno:** `prisma migrate dev` no funciona (la shadow DB falla aplicando el seed RBAC).
Flujo manual documentado en Phase 3: `prisma migrate diff --from-config-datasource
--to-schema prisma/schema.prisma --script` → `prisma db execute --file <migración.sql>`
→ INSERT en `_prisma_migrations` (checksum sha256, `applied_steps_count` 1) → `prisma generate`.

```sql
-- SVR-ERP: Fase 7 — Recepción de OC → Inventario
-- Migración aditiva: tabla líneas de OC + AuditAction + relación

-- 1. AuditAction
ALTER TYPE "AuditAction" ADD VALUE 'ORDEN_COMPRA_RECIBIDA';

-- 2. Tabla ordenes_compra_items
CREATE TABLE "ordenes_compra_items" (
  "id"                UUID NOT NULL,
  "orden_compra_id"   UUID NOT NULL,
  "articulo_id"       UUID,
  "nombre"            TEXT NOT NULL,
  "cantidad"          DECIMAL(10,2) NOT NULL,
  "cantidad_recibida" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "precio_unitario"   DECIMAL(12,2) NOT NULL,
  "activo"            BOOLEAN NOT NULL DEFAULT true,
  "creado_en"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en"    TIMESTAMPTZ NOT NULL,
  "actualizado_por"   UUID,
  "creado_por"        UUID,
  "eliminado_en"      TIMESTAMPTZ,
  CONSTRAINT "ordenes_compra_items_pkey" PRIMARY KEY ("id")
);

-- 3. Índices
CREATE INDEX "ordenes_compra_items_orden_compra_id_idx" ON "ordenes_compra_items"("orden_compra_id");
CREATE INDEX "ordenes_compra_items_articulo_id_idx"     ON "ordenes_compra_items"("articulo_id");

-- 4. FK
ALTER TABLE "ordenes_compra_items" ADD CONSTRAINT "ordenes_compra_items_orden_compra_id_fkey"
  FOREIGN KEY ("orden_compra_id") REFERENCES "ordenes_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ordenes_compra_items" ADD CONSTRAINT "ordenes_compra_items_articulo_id_fkey"
  FOREIGN KEY ("articulo_id") REFERENCES "articulos_inventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

> **No se requieren nuevos permisos** en `permissions`/`vistas`: la recepción reutiliza
> `comercial.proveedores.editar` y la ruta `/proveedores` ya existe (RBAC.md línea 241).

### 2.2 Auditoría — `audit.constants.ts`

Agregar severidad para la nueva acción:

```ts
ORDEN_COMPRA_RECIBIDA: 'INFO',
```

### 2.3 Refactor `InventarioService` — lógica transaccional reutilizable

Para que la recepción sea **atómica** (si falla una línea, no se toca nada), la lógica core de
`crearMovimiento` debe aceptar un `Prisma.TransactionClient`. Se extrae:

```ts
// Nuevo método público (interno al módulo inventario):
async aplicarEntrada(
  tx: Prisma.TransactionClient,
  params: {
    articuloId: string;
    cantidad: number;
    motivo: string;
    referenciaTipo?: string;
    referenciaId?: string;
    creadoPor: string;
  },
): Promise<{ stockAnterior: number; stockResultante: number }>
```

- Actualiza `articulos_inventario.stock` (suma) y crea `movimientos_inventario` (`tipo: 'ENTRADA'`,
  `stock_resultante`, `referencia_tipo`, `referencia_id`, `motivo`).
- `crearMovimiento` (endpoint público actual) delegará a `aplicarEntrada` dentro de su propia
  `$transaction` sin perder comportamiento (auditorías de cruce de umbral `STOCK_BAJO_*`).
- El `documented stock-resultante` y las auditorías `MOVIMIENTO_REGISTRADO` se conservan.

### 2.4 DTOs — carpetas `apps/api/src/proveedores/dto/`

**`create-orden-compra.dto.ts` (modificado):**

```ts
export class OrdenCompraItemInput {
  @IsOptional()
  @IsUUID()
  articuloId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  nombre?: string;   // OBLIGATORIO si articuloId no viene

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  cantidad!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precioUnitario!: number;
}

export class CreateOrdenCompraDto {
  @IsUUID()
  proveedorId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;   // AHORA OPCIONAL — se deriva de las líneas si no viene

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrdenCompraItemInput)
  items!: OrdenCompraItemInput[];
}
```

Regla de negocio: si `articuloId` viene → se ignora la validación de `nombre` (se trae del catálogo);
si no viene → `nombre` obligatorio (`@ValidateIf` en el DTO).

**`recibir-orden-compra.dto.ts` (nuevo):**

```ts
export class DataArticuloNuevo {
  /** índice de la línea a la que aplica (0-based) */
  @IsInt()
  @Min(0)
  lineaIndex!: number;

  @IsUUID()
  categoriaId!: string;

  @IsUUID()
  unidadId!: string;
}

export class RecibirOrdenCompraDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DataArticuloNuevo)
  nuevosArticulos: DataArticuloNuevo[] = [];  // solo para líneas sin articuloId
}
```

**`update-orden-compra.dto.ts` (modificado):** aceptar `items?` (edición de líneas en
PENDIENTE/APROBADA) que recalcula `monto`; mantener compatibilidad con `descripcion`/`monto` actual.

### 2.5 Endpoints

| Método | Ruta | Permiso | Cambio |
|--------|------|---------|--------|
| POST | `/api/ordenes-compra` | `comercial.proveedores.crear` | **Modificado** — crea cabecera + líneas + CxP; `monto` derivado de la suma de líneas |
| PATCH | `/api/ordenes-compra/:id` | `comercial.proveedores.editar` | **Modificado** — permite editar líneas (PENDIENTE/APROBADA), recalcula `monto` |
| POST | `/api/ordenes-compra/:id/cambiar-estado` | `comercial.proveedores.editar` | **Modificado** — **ya NO acepta transición a RECIBIDA** (solo `PENDIENTE→APROBADA`, `PENDIENTE→CANCELADA`, `APROBADA→CANCELADA`) |
| POST | `/api/ordenes-compra/:id/recibir` | `comercial.proveedores.editar` | **NUEVO** — recepción física atómica (gatillo único de alta en inventario) |
| DELETE | `/api/ordenes-compra/:id` | `comercial.proveedores.eliminar` | **Modificado** — al soft-delete cabecera, marcar `activo=false` en sus líneas |

### 2.6 Transición de estados (máquina corregida)

```ts
const TRANSICIONES: Record<EstadoOrdenCompra, EstadoOrdenCompra[]> = {
  PENDIENTE: ['APROBADA', 'CANCELADA'],
  APROBADA: ['CANCELADA'],                 // RECIBIDA ya NO pasa por aquí
  RECIBIDA: [],
  CANCELADA: [],
};
```

La recepción se dispara **exclusivamente** vía `POST /:id/recibir`. Reglas de negocio adicionales:
- Solo se puede recibir una OC en estado `APROBADA` (no PENDIENTE, no RECIBIDA, no CANCELADA).
- **Desacople pago/recepción:** `registrarAbono` deja de forzar `estado = RECIBIDA` al completar el
  pago. Solo actualiza `pagado` y el estado de la CxP (`PENDIENTE/PARCIAL/PAGADA`).
- **Guard extra:** no se puede **cancelar** una OC ya recibida (RECIBIDA es terminal; ya está cubierto
  por la máquina de transiciones).

### 2.7 Recepción de OC — transacción crítica (el corazón de la fase)

```
POST /api/ordenes-compra/:id/recibir
RecibirOrdenCompraDto { nuevosArticulos: [{ lineaIndex, categoriaId, unidadId }] }

prisma.$transaction(async (tx) => {
  1. Validar OC existe, estado = APROBADA, eliminado_en = null
  2. Cargar líneas activas de la OC (ordenes_compra_items)
  3. Si no hay líneas → fallir() ORDEN_SIN_LINEAS
  4. Por cada línea:
     a. cantidad_restante = cantidad - cantidad_recibida
     b. Si cantidad_restante <= 0 → saltar (línea ya recibida)
     c. CASO A: articulo_id existe → tx.articulos_inventario.update({ stock: { increment: cantidad_restante } })
        + crear movimientos_inventario ENTRADA (referencia_tipo='ORDEN_COMPRA', referencia_id=orden.id,
          motivo=`Recepción de {folio}`)
     d. CASO B: articulo_id es NULL → alto artículo:
        - Buscar DataArticuloNuevo por lineaIndex (si falta → fallir() ARTICULO_NUEVO_SIN_CATALOGO)
        - Generar codigo único (ej. ART-YYYYMMDD-XXXXX) — validar P2002
        - tx.articulos_inventario.create({ nombre: linea.nombre, proveedor_id: orden.proveedor_id,
            categoria/unidad del DTO, stock = cantidad_restante, stock_minimo = 0,
            precio_unitario = linea.precio_unitario })
        - Actualizar linea.articulo_id = nuevoArt.id
        - Crear movimientos_inventario ENTRADA con referencia OC
     e. Actualizar linea: cantidad_recibida = cantidad (recepción total), actualizado_en/por
  5. Actualizar cabecera: estado = RECIBIDA, actualizado_por, actualizado_en
     (CxP NO cambia: sigue PENDIENTE/PARCIAL hasta pagarse)
  6. Auditorías: ORDEN_COMPRA_RECIBIDA (SUCCESS), ARTICULO_CREADO (por cada alta),
     MOVIMIENTO_REGISTRADO (por cada línea) — SIEMPRE dentro del try del transaction
})
```

**Error codes posibles:**
- `ORDEN_COMPRA_NO_ENCONTRADA` — 404
- `ORDEN_NO_RECEPCIONABLE` — 400 (estado ≠ APROBADA)
- `ORDEN_SIN_LINEAS` — 400
- `ARTICULO_NUEVO_SIN_CATALOGO` — 400 (línea nueva sin categoría/unidad en el DTO)
- `ARTICULO_DUPLICADO_CODIGO` — 409 (fallback de código generado, patrón P2002 ya usado)

> **Diseño de integración:** `ProveedoresModule` importa `InventarioModule` (que ya exporta
> `InventarioService`) para usar `aplicarEntrada` con el `tx`. Los DTOs de catálogo garantizan que
> el alta de artículos nuevos **nunca** sea automática "a ciegas": el usuario elige categoría/unidad
> en el modal de recepción.

### 2.8 `serializeOrden` — incluir líneas

```ts
private serializeOrden(orden: any) {
  return {
    // ...campos actuales...
    items: (orden.ordenes_compra_items ?? [])
      .filter((i) => i.eliminado_en === null && i.activo)
      .map((i) => ({
        id: i.id,
        articuloId: i.articulo_id,
        nombre: i.nombre,
        cantidad: Number(i.cantidad),
        cantidadRecibida: Number(i.cantidad_recibida),
        precioUnitario: Number(i.precio_unitario),
      })),
  };
}
```

Y `findAllOrdenes`/`findOneOrden` incluyen `ordenes_compra_items` (activas) en el `include`.

### 2.9 Seed opcional `apps/api/scripts/seed-ordenes-items.ts` (solo desarrollo/test)

- 2 OC existentes reciben líneas (una con artículos catalogados, otra con un artículo "nuevo").
- Probar el endpoint de recepción en ambos escenarios de forma idempotente.

---

## 3. Impacto Frontend

### 3.1 `apps/web/src/lib/api.ts` — contratos

```ts
export interface OrdenCompraItemDTO {
  id: string;
  articuloId: string | null;
  nombre: string;
  cantidad: number;
  cantidadRecibida: number;
  precioUnitario: number;
}

// Ampliar OrdenCompraDTO:
export interface OrdenCompraDTO {
  // ... campos actuales ...
  items?: OrdenCompraItemDTO[];
}

export interface OrdenCompraItemInput {
  articuloId?: string;
  nombre?: string;
  cantidad: number;
  precioUnitario: number;
}

export interface OrdenCompraCreateInput {
  proveedorId: string;
  descripcion?: string;
  monto?: number;          // ya no se envía; backend lo deriva (se respeta por compatibilidad)
  fecha?: string;
  items: OrdenCompraItemInput[];
}

// Nuevo en ordenesCompraApi:
recibir: (id, data?: { nuevosArticulos?: { lineaIndex: number; categoriaId: string; unidadId: string }[] })
  => apiClient.post<OrdenCompraDTO>(`/ordenes-compra/${id}/recibir`, data ?? { nuevosArticulos: [] }),
```

### 3.2 `/proveedores` — Modal "Nueva Orden de Compra" (de cabecera a detalle)

Reemplazar el formulario actual (proveedor + descripción + monto) por un **editor de líneas**:

```
Proveedor            [select]                          (requerido)
Filas de la OC:
┌──────────────────────────────────────────────────────────────┐
│ Artículo (select catálogo | "Nuevo artículo")  Cant  P.U.    │
│ ─ Artículo existente: nombre + precio precargados            │
│ ─ Nuevo: campo nombre libre (se completa al recibir)         │
│ [+ Agregar línea]                                            │
└──────────────────────────────────────────────────────────────┘
Total calculado: $X,XXX.XX           [Crear Orden]
```

- Precarga opciones del catálogo de inventario: `inventarioApi.catalogos()` → artículos activos
  (map a `{ id, nombre, precioUnitario, unidad }`).
- Al elegir un artículo existente → se autocompleta `nombre` y `precioUnitario` en la línea.
- `Total` = Σ cantidad × precioUnitario (mostrado, calculado localmente con `formatCurrency`).
- El `monto` ya **no se captura**.
- Validación client-side: al menos 1 línea con cantidad > 0 y (articuloId o nombre).

### 3.3 `/proveedores` — Modal de Recepción (sustituye el confirm simple "Recibir")

El botón "Recibir" (estado APROBADA) abre un **modal de recepción** en lugar del `confirmCambio` simple:

```
Recepción de {folio} — {proveedor}
┌───────────────────────────────────────────────────────┐
│ Artículo                Cant  P.U.      Subs          │
│ ✔ Filtro de aceite x12  [12]  $120.00   $1,440.00     │  art. existente
│ ✚ Material nuevo        [50]  $30.00    $1,500.00     │  art. NUEVO
│    Categoría: [select]  Unidad: [select]              │
└───────────────────────────────────────────────────────┘
Se darán de alta 1 artículo y se actualizará el stock de 1 en /inventario.
[Cancelar]  [Confirmar recepción y registrar en inventario]
```

- Líneas con `articuloId` → solo muestra información (cantidad = cantidad recibida total).
- Líneas sin `articuloId` → selectores de **categoría** y **unidad** (de `inventarioApi.catalogos()`),
  obligatorios para confirmar.
- Confirmar → `ordenesCompraApi.recibir(id, { nuevosArticulos: [...líneas nuevas con categoría/unidad] })`.
- Toast de éxito con resumen: "Recepción registrada: N artículos dados de alta, M actualizados."
- Una OC ya recibida deja de mostrar el botón "Recibir" (estado RECIBIDA → terminal).

### 3.4 Estado visual y acciones en la tabla de OC

- Mantener la columna "Estado" con `Badge`.
- En estado `APROBADA`, el botón "Recibir" abre el modal de recepción (no el confirm simple).
- `PENDIENTE → Aprobar` se mantiene.
- `Cancelar` se mantiene para PENDIENTE/APROBADA sin pagos.
- En `RECIBIDA`, opcionalmente mostrar tooltip/icono que indica "Stock registrado en inventario".

### 3.5 `/inventario` — sin cambios de CRUD; kill del botón "Pedir" como vía principal

- El botón "Pedir" (movimiento ENTRADA manual) **se conserva** pero pasa a ser de ajuste/recepción
  manual con motivo libre; el flujo canónico de compra entra vía `/proveedores`.
- Fase opcional futura: aprovechar `movimientos_inventario.referencia_tipo = 'ORDEN_COMPRA'` para
  hacer kardex por OC (filtro de trazabilidad). **No bloqueado por esta fase.**

---

## 4. Sub-fases de Implementación (orden de ejecución)

### 4.1 T1 — Schema + Migración (backend) ✅
**Archivos a modificar:**
1. `apps/api/prisma/schema.prisma` — modelo `ordenes_compra_items` + back-relations + enum `ORDEN_COMPRA_RECIBIDA`
2. Migración manual: SQL aditivo + registrar en `_prisma_migrations`
3. `apps/api/src/audit/audit.constants.ts` — severidad `ORDEN_COMPRA_RECIBIDA: 'INFO'`
4. `npx prisma generate`

**Entregable:** Migración aplicada, schema actualizado, `prisma generate` OK.

**Hecho (2026-09-19):**
- Schema: modelo `ordenes_compra_items` (13 campos + boyeros audits/FK) insertado tras `ordenes_compra`;
  back-relations añadidas en `ordenes_compra` y `articulos_inventario`; enum `AuditAction` += `ORDEN_COMPRA_RECIBIDA`.
- `audit.constants.ts`: `ORDEN_COMPRA_RECIBIDA: 'INFO'` (Record completo, tsc OK).
- Migración `20260930000000_ordenes_compra_items_recepcion` creada, aplicada con
  `prisma db execute` y registrada en `_prisma_migrations` (`applied_steps_count=1`,
  checksum `bb3e9249…ad33`). Tabla verificada: 13 columnas + PK + índices + 2 FK
  (OC → RESTRICT/CASCADE, artículo → SET NULL/CASCADE). Enum BD ahora 123 valores.
- `npx prisma generate` OK (v7.9.1). `npx tsc --noEmit` OK. Tests audit: 29/29 PASS.
- ⚠️ Hallazgo (no bloqueante): `20260929000000_transaccion_exportada` está aplicada en BD
  pero **no registrada** en `_prisma_migrations` (el enum ya tenía el valor). No se corrigió en
  T1 por quedar fuera de alcance. Diferencia con schema: FK `incidentes.reportado_por` (drift
  pre-existente detectado por `prisma migrate diff`; no se tocó).

### 4.2 T2 — Refactor transaccional de Inventario (backend)
**Archivos a modificar:**
1. `apps/api/src/inventario/inventario.service.ts` — extraer `aplicarEntrada(tx, params)`; delegar `crearMovimiento`
2. `apps/api/src/inventario/inventario.service.spec.ts` — ajustar/registrar tests del nuevo método

**Entregable:** `aplicarEntrada` probado; `crearMovimiento` conserva comportamiento.

**Hecho (2026-09-23) — evidencia verificada:**
- Extraído `aplicarEntrada(tx: Prisma.TransactionClient, params)` que actúa en la transacción ya
  iniciada: busca artículo (no eliminado), suma stock via `stock_resultante`, inserta
  `movimientos_inventario` `ENTRADA` con `stock_resultante`/refs/motivo y devuelve
  `{ stockAnterior, stockResultante }` para auditoría.
- `crearMovimiento` delegó su rama `ENTRADA` → `this.prisma.$transaction((tx) => this.aplicarEntrada(tx, {...}))`
  sin anidar transacciones; la rama `SALIDA` conserva su `$transaction([update, create])` y las
  auditorías de cruce de umbral (`STOCK_BAJO_DETECTADO`/`STOCK_BAJO_RESUELTO`).
- Spec: `mockTx` tipado correctamente (ya no `as never`); `$transaction` del mock soporta ambos
  patrones (callback→`tx` y array→`Promise.all`); `describe('aplicarEntrada')` con tests de
  delegación (update + create + `stockResultante`) y `NotFoundException` cuando no existe el artículo.
- Verificación: `npx tsc --noEmit` (exit 0) · inventario.service.spec **25/25 PASS**
  · audit.service.spec **14/14 PASS**. Guard: correr jest con `--rootDir=src` (no `apps/api`,
  que barre specs obsoletos de `dist/*.js`).

### 4.3 T3 — Proveedores: DTOs + createOrden con líneas + desacople pago (backend)
**Archivos a modificar/crear:**
1. `apps/api/src/proveedores/dto/create-orden-compra.dto.ts` — items
2. `apps/api/src/proveedores/dto/update-orden-compra.dto.ts` — items opcionales
3. `apps/api/src/proveedores/dto/recibir-orden-compra.dto.ts` — NUEVO
4. `apps/api/src/proveedores/dto/cambiar-estado-orden.dto.ts` — sin cambios (estado enum)
5. `apps/api/src/proveedores/proveedores.service.ts` — `createOrden` con líneas + recalcular monto; `updateOrden`; `removeOrden` soft-delete líneas; `TRANSICIONES` sin RECIBIDA; `registrarAbono` **sin** forzar RECIBIDA; `serializeOrden` con items
6. `apps/api/src/proveedores/proveedores.controller.ts` — endpoint `POST :id/recibir`

**Entregable:** OC se crea con líneas; el pago ya no dispara RECIBIDA.

### 4.4 T4 — Recepción de OC: método `recibirOrden` (backend)
**Archivos a modificar:**
1. `apps/api/src/proveedores/proveedores.service.ts` — `recibirOrden(id, dto, userId)` con la transacción crítica del §2.7
2. `apps/api/src/proveedores/proveedores.module.ts` — importar `InventarioModule`
3. `apps/api/src/app.module.ts` — confirmar orden de imports (sin cambios funcionales)

**Entregable:** `POST /ordenes-compra/:id/recibir` funcional y atómico.

### 4.5 T5 — Tests backend (unit + integration)
**Archivos a crear/modificar:**
1. `apps/api/src/proveedores/proveedores.service.spec.ts` — `createOrden` con líneas, `recibirOrden` (art. existente, art. nuevo, errores), `registrarAbono` ya no fuerza RECIBIDA
2. `apps/api/src/proveedores/proveedores.controller.spec.ts` — endpoint recibir
3. `apps/api/src/proveedores/proveedores.integration.spec.ts` — flujo real: crear OC con líneas → aprobar → recibir → stock actualizado + movimiento con `referencia_tipo='ORDEN_COMPRA'`
4. `apps/api/src/inventario/inventario.integration.spec.ts` — ajustes si aplican

**Entregable:** `npx tsc --noEmit`, `npm run lint`, tests unitarios e integración pasando.

### 4.6 T6 — Frontend: contratos API (`api.ts`)
**Archivos a modificar:**
1. `apps/web/src/lib/api.ts` — `OrdenCompraItemDTO`, inputs, `ordenesCompraApi.recibir`
2. `apps/web/src/lib/formatters.ts` — revisar formateo (sin cambios esperados)

**Entregable:** Contratos espejo actualizados (TypeScript compila).

### 4.7 T7 — Frontend: Modal "Nueva Orden" con líneas
**Archivos a modificar:**
1. `apps/web/src/app/(dashboard)/proveedores/page.tsx` — state de líneas (`ocItems[]`), catálogo de artículos, tabla inline de partidas, total calculado, `handleCrearOrden` manda `items`

**Entregable:** Crear OC con líneas desde la UI.

### 4.8 T8 — Frontend: Modal de recepción
**Archivos a modificar:**
1. `apps/web/src/app/(dashboard)/proveedores/page.tsx` — `recepcionOpen`, catálogos categorías/unidades, modal de recepción, `handleRecibir` → `ordenesCompraApi.recibir`
2. `apps/web/src/components/ui/Modal.tsx` — solo reuso (sin cambios esperados)

**Entregable:** Botón "Recibir" abre modal con categoría/unidad para artículos nuevos; al confirmar, stock se refleja en `/inventario`.

### 4.9 T9 — Validación E2E + entornos
- Probar flujo completo en `dev`: crear OC con 2 líneas (1 existente, 1 nueva) → aprobar → recibir
  → verificar `/inventario` (stock sumado y artículo nuevo).
- Verificar que **pagar al 100% ya NO marca RECIBIDA** (desacople).
- Verificar `registro_auditoria`: `ORDEN_COMPRA_RECIBIDA`, `MOVIMIENTO_REGISTRADO`, `ARTICULO_CREADO`.
- Turbopack: si el modal de líneas "rompe" la hidratación → reiniciar `dev`, ajustar boundaries.

---

## 5. Testing (obligatorio, AGENTS.md)

### 5.1 Unit Tests (`proveedores.service.spec.ts`)
- `createOrden` — éxito con items, falla sin items, monto derivado correcto, proveedor no encontrado, folio duplicado (P2002)
- `recibirOrden` — artículo existente (stock incrementa), artículo nuevo (crea artículo + codigo), sin lineas, OC no APROBADA, línea nueva sin catálogo
- `registrarAbono` — **pago completo ya NO cambia estado a RECIBIDA**
- `updateOrden` — edición de líneas recalcula monto; monto menor a pagado rechazado
- `cambiarEstadoOrden` — `APROBADA → RECIBIDA` **rechazada** (transición inválida)

### 5.2 Integration Tests (`proveedores.integration.spec.ts`)
1. Crear OC con líneas → audit `ORDEN_COMPRA_CREADA` → líneas en BD
2. Aprobar OC → recibir con artículo existente → `stock = stockAnterior + cantidad` y movimiento con `referencia_tipo='ORDEN_COMPRA'`
3. Recibir con artículo nuevo → `articulos_inventario` creado + movimiento ENTRADA + `cantidad_recibida = cantidad`
4. FAIL: recibir OC en estado PENDIENTE → audit FAIL `ORDEN_NO_RECEPCIONABLE`
5. Limpieza FK-safe: líneas → movimientos → artículos nuevos → CxP → OC → proveedores (los artículos catalogados originales restauran stock)

### 5.3 Verificación
```bash
npx tsc --noEmit
npm run lint
npm run test
npm run test:integration
```

---

## 6. Validación y Riesgos

1. **Desacople pago ↔ recepción (riesgo de negocio alto, controlado):** el cambio de
   `registrarAbono` hará que una OC 100% pagada permanezca `APROBADA` hasta recibirla físicamente.
   Es el comportamiento correcto (stock = mercancía física); se documenta en el modal de abono y en el
   modal de recepción con copy claro.

2. **Artículos nuevos necesitan categoría/unidad:** nunca se crea un artículo "a ciegas". El modal de
   recepción exige esos datos. Si un artículo nuevo se capturó por error, la acción correcta es
   eliminar la línea (soft delete) antes de recibir, o ajustar stock manualmente después.

3. **Monto derivado vs CxP existente:** `cuentas_por_pagar.monto` se conserva derivado de la suma de
   líneas. El `registrarAbono` valida `monto` de cabecera; al editar líneas en PENDIENTE/APROBADA se
   recalcula la cabecera y CxP en el mismo `$transaction` (patrón ya usado en `updateOrden`).

4. **Concurrencia de folio/código:** el código de artículo generado en recepción usa el mismo patrón
   defensivo P2002 ya probado (`generarFolioOrden` / `generarCodigoAbono`).

5. **Migración manual por shadow DB:** no usar `prisma migrate dev`; seguir el flujo manual de Fase 3
   (`migrate diff` → `db execute` → `_prisma_migrations` → `generate`). Riesgo de error humano
   mitigado por el SQL cerrado de §2.1.

6. **Turbopack / hidratación:** el modal de líneas tiene más estado; se probará el flujo completo en
   `dev`. Si hay pánicos de hidratación, reiniciar el proceso y reducir state lifting.

7. **Compatibilidad de datos existentes:** las OC ya creadas no tienen líneas. No se migran
   retroactivamente (sería parsear texto, prohibido). Solo se listan con `items: []`; el flujo de
   recepción aplica a OC nuevas. Si el usuario quiere recibir una OC vieja, debe crear una nueva.

---

## 7. Tiempo Estimado

| Sub-fase | Descripción | Estimación |
|----------|-------------|------------|
| T1 | Schema + Migración + `prisma generate` | 0.5 día |
| T2 | Refactor `InventarioService.aplicarEntrada` | 0.5 día |
| T3 | DTOs + `createOrden` con líneas + desacople pago | 1 día |
| T4 | `recibirOrden` (transacción atómica) | 1 día |
| T5 | Tests backend (unit + integration) | 1 día |
| T6 | Contratos `api.ts` | 0.5 día |
| T7 | Modal Nueva OC con líneas | 1 día |
| T8 | Modal de recepción | 1 día |
| T9 | Validación E2E + entornos/Turbopack | 0.5 día |
| **Total** | | **~7 días** |