# IMPLEMENTACIONES A FUTURO — Hoja de ruta de integración del ERP

> **Estado actual (actualizado 2026-11-04):** la cadena núcleo de dinero ya está
> implementada — cotización facturable (`POST /cotizaciones/:id/facturar` genera
> factura + conceptos + CxC en `$transaction`), bitácoras-renta y reportes-campo
> facturables, módulo de cobranza con cobros/reversiones atómicos, proveedores con
> OC→CxP→abono→egreso, flujo neto y conciliación bancaria. La fuente de verdad de
> los flujos implementados es **`workflow/README.md`** (índice con estados). Este
> documento conserva el diagnóstico histórico y lista los flujos que AÚN quedan.
> Cada estado aquí se verifica contra `schema.prisma` y el código real antes de
> marcarse pendiente o realizado.

---

## Índice

| Sección | Contenido |
|---------|-----------|
| §0 | Fases ejecutadas — ciclo de dinero |
| §1 | Resumen ejecutivo |
| §2 | Diagnóstico técnico actual (`cotizaciones`, integraciones) |
| §3 | Flujos pendientes: **P1** cotización→factura→CxC · **P2** partidas · **P3** cotización↔proyecto · **P4** bajada de inventario (**+ descuento por venta POS**) · **P5** pagos a CxC · **P6** vendedor real · **P7** precios por medida (**+ editor fácil para encargados**) · **P8** metas de progreso con fecha límite |
| §4 | Diagrama de la cadena de valor objetivo |
| §5 | Validación y riesgos |
| §6 | Mapa de integración de vistas (6.1–6.8) |
| §7 | Estado de cada flujo (tabla P1–P7, 6.1–6.8, **F1–F6**) |
| §8 | Flujo completo de `/cobranza` |
| §9 | Futuro — Asignación **vista → cuenta bancaria** (conciliación asistida con CSV; decisión: por vista, no por concepto) |
| §10 | Futuro — Fecha de vencimiento en CxP |
| §11 | **Plataforma, POS y experiencia (NUEVO):** **F1** notificaciones · **F2** loaders/skeletons · **F3** validación en todos los formularios · **F4** comprobación de flujos de datos Operaciones/Comercial · **F5** configuración de POS (horario de caja + categorías visibles) · **F6** seeds demo de todos los workflows |

### Orden de ejecución por dificultad (meta: revisión del martes)

> Vista de prioridad para la ejecución — el detalle de cada tarea vive en su sección
> (índice de arriba). Regla del orden: fácil→difícil Y visibilidad en la demo del
> martes. Rama de trabajo: `plataforma-experiencia`.

| Tier | Tareas (de la más fácil a la más difícil) | Sección |
|------|-------------------------------------------|---------|
| 🟢 **0 — Triviales** | ✅ **1. Diagnóstico** /operaciones 3-vs-6 (causa: 4 proyectos sin obra — el fix físico espera "go") · ✅ **2. Contraste dark** modal Ver Detalle · ✅ **3. F2 loaders/skeletons** (ver §11 F2/§7) · ✅ **4. F3 toasts con `details`** (ver §11 F3/§7) · ✅ **5. F4 matriz de flujos de datos** (ver §11 F4) | 6.6, 6.6.1, §11 F2–F4 |
| 🟡 **1 — Fáciles-medios** | ✅ **6. F6 seeds demo de workflows** — REALIZADO 2026-11-08 (`seed-demo-workflows.ts` + data fix `turno_cierre`; ver §11 F6) · ✅ **7. P4b** venta POS descuenta inventario — REALIZADO 2026-11-08 (guard anti-carrera + movimientos SALIDA `Venta POS`; ver §3 P4b) · 8. **P8** metas de progreso con fecha límite · 9. **P6** vendedor real | §11 F6, §3 |

> Nota (2026-11-08): el bug `/inventario` al filtrar por categoría (`categoriaId must be
> a UUID`) se resolvió — los IDs pseudo-UUID de las categorías/unidades del seed de
> unificar_ventas_inventario violaban el RFC 4122; corregidos con la migración
> `20261108000000_fix_uuids_categorias_unidades` (ver historial-cambios del día).

| 🟠 **2 — Medios** | 10. **§10** fecha de vencimiento en CxP · 11. **6.6** flujo proyecto→obra (obra base automática al crear proyecto, obras múltiples — la base se retira al registrar las propias, botón contextual, sync de estados, labels) · 12. **6.2** incidente resuelto → deriva mantenimiento/reporte · 13. **6.4** criba con FK a máquina/proyecto · 14. **6.7** tab trabajadores por proyecto (residuo) | §10, §6 |
| 🔴 **3 — Difíciles** | 15. **P2** partidas → **P4** cotizaciones (depende P2) → **P7** precios por medida + stock → **C3** venta a crédito → CxC → **6.5** inventario↔criba → **6.8** desgloses por proyecto → **F5** config POS (horario+categorías) → **F1** notificaciones → **§9** conciliación por vista → **P3** cotización↔proyecto | §3, §8.4, §9, §11 |

---

## 0. Fases ejecutadas — ciclo de dinero (plan `implementation_plan copy.md`)

Estado real del plan de integración cobranza/finanzas. **Todas ejecutadas** en la rama
`proveedores-cobranza` (pendiente de PR a `main`):

| Fase | Alcance | Estado |
|------|---------|--------|
| Fase 1 | migración + módulo cobranza + seed + tests | ✅ Realizada |
| Fase 2 | conectar frontend a API real (`cobranza.page.tsx`) | ✅ Realizada |
| Fase 3 (C2 → C1) | módulo facturas → cotización aceptada → CxC | ✅ Realizada |
| Fase 4 (O1, O2, O3) | proyecto en CxC + bitácora → CxC | ✅ Realizada |
| Fase 5 (C4-C7, O4-O5) | reportes consolidados y conciliación | ✅ Realizada (O4 movida a Fase 6) |

> **O4 (margen/utilidad por proyecto)** se movió a una **Fase 6** independiente
> (`implementation_plan_fase6.md`): requiere preparación de datos de costo
> (`articulos_inventario.costo_unitario` + desnormalización de facturas).

---

## 1. Resumen ejecutivo — ACTUALIZADO 2026-11-04

**Antes:** una cotización era una bolsa de datos suelta: se creaba → se aceptaba/rechazaba → ahí moría. No dispara nada.

**Hoy:** la cadena núcleo CLIENTE → COTIZACIÓN → FACTURA → CxC → PAGO ya funciona de punta a punta:
- `POST /cotizaciones/:id/facturar` — en una `$transaction` marca la cotización como facturada, crea `facturas` + `factura_conceptos` + `cuentas_por_cobrar (PENDIENTE)`, con folio secuencial `FAC-YYYY-NNNN` y reintento anti-colisión (`COTIZACION_NO_PENDIENTE` / `COTIZACION_YA_FACTURADA` en 400/409).
- Existe el modelo y módulo de **ventas** (POS con idempotencia, caja, retiros y cierres con aprobación).
- Existía además el flujo O1/O2/O3: bitácoras-renta y reportes-campo facturables → CxC (ver `workflow/02`).

Lo que sigue abierto de la hoja de ruta: **P2** (partidas para facturar por línea), **P3** (cotización↔proyecto), **P4** (bajada de inventario), **P6** (vendedor real), **P7** (precios por medida) y la venta POS a crédito → factura → CxC (C3).

---

## 2. Diagnóstico técnico actual

### 2.1 Relaciones existentes del modelo `cotizaciones`

Mirando `apps/api/prisma/schema.prisma` (modelo `cotizaciones`, ~línea 309):

```
id, codigo?, cliente_id, descripcion, monto (Decimal 14,2), fecha, estado,
motivo_rechazo?, activo, creado_en, actualizado_en, creado_por?, actualizado_por?,
eliminado_en?, vendedor_id?

relaciones:
  + clientes                     (FK cliente_id)      ✅ SÍ existe
  + users (auditoría)                                  ✅ SÍ existe
  + users (vendedor_id)                                ✅ SÍ existe (sin uso real)
```

### 2.2 Integraciones — estado real (actualizado 2026-11-04)

| Relación | Modelo destino | Estado |
|----------|----------------|--------|
| Cotización → factura / factura_conceptos | `facturas` | ✅ Existe (via `facturar()`, Fase 3) |
| Cotización → cuenta por cobrar | `cuentas_por_cobrar` | ✅ Existe (facturar nace la CxC) |
| Cotización → pago | `pagos` | ✅ Existe (módulo cobranza; pagos contra CxC reversible) |
| Cotización → venta / pedido | `ventas` | ⏳ El modelo/módulo existe (POS), pero la venta a crédito aún NO nace CxC (C3) |
| Cotización → línea/partida (`cotizacion_items`) | (no existe el modelo) | ❌ Falta (P2) |
| Cotización → proyecto / obra | `proyectos` (no hay `proyecto_id`) | ❌ Falta (P3) |
| Cotización → artículo de inventario | `articulos_inventario` | ❌ Falta (P4, vía partidas) |

El problema del aislamiento no es la vista frontend (que consume API real), **es que no
hay cadena de integración en el modelo ni en los servicios** que conviertan la
cotización aceptada en algo más.

---

## 3. Flujos de trabajo pendientes (orden de prioridad)

### P1 — Aceptar cotización → genera Factura + Cuenta por Cobrar (integración núcleo)

**Objetivo:** que al pasar una cotización a `ACEPTADA`, el ERP genere automáticamente
(o por botón explícito):
- una **`facturas`** con sus **`factura_conceptos`**, y
- la **`cuentas_por_cobrar`** correspondiente al cliente.

**✅ REALIZADO (Fase 3, workflow 01):** `facturar()` en `cotizaciones.service.ts`
implementa exactamente esto — transición condicional PENDIENTE → facturada con índice
único contra dobles, factura + conceptos + CxC en una sola `$transaction`, folio
anti-colisión y audit FAIL/SUCCESS. Workflow documentado en `workflow/01-venta-cotizacion-cobro.md`.

**Cómo se aplicará:**
1. **Schema:** agregar `cotizacion_id` (nullable FK) a `facturas` (+ indice), y crear
   `cotizacion_items` (partidas de la cotización, ver P2) o derivar de `descripcion`+
   `monto` si no hay partidas.
2. **Servicio (`cotizaciones.service.ts`):** en `cambiarEstado`, cuando `estado ===
   RECHAZADA` no; cuando `ACEPTADA`, ejecutar dentro de **`prisma.$transaction`**:
   - marcar la cotización `ACEPTADA`,
   - crear la `facturas` (cliente, fecha, subtotal/impuesto/total desde las partidas),
   - crear `factura_conceptos` por cada partida,
   - crear `cuentas_por_cobrar` (cliente, factura_id, monto = total, `PENDIENTE`),
   - auditar cada generación.
3. **Frontend:** botón **«Facturar»** (o "Generar factura") en la fila/modal de la
   cotización aceptada, y/o badge que muestre el estado de la factura generada.
4. **Lógica de negocio / Canonical:** imposible o bloqueado por regla de negocio
   (estado transitorio de facturación) se audita con `fallir()`.

**Impacto:** une cotizaciones con **comercial** y **finanzas** (facturas, CxC,
cobranza). Es el cambio que rompe el aislamiento de verdad.

**Workflow entre pantallas:**
```
/cotizaciones  ──(fila en "Aceptada" → botón «Facturar»)──►
   └─ $transaction: crea factura + factura_conceptos + cuentas_por_cobrar (PENDIENTE)
         │
         ├─► /finanzas  → aparece la factura y la CxC del cliente (P1 genera)
         └─► /clientes  → detalle del cliente muestra el tab de facturas/CxC (6.7)
```

---

### P2 — Partidas / líneas de cotización (`cotizacion_items`)

**Objetivo:** dejar de modelar la cotización como `descripcion + monto` plano y pasar a
líneas detalladas: **cantidad, unidad, descripción, precio unitario, importe, referencia
a `articulos_inventario` o a un producto/servicio**.

**Hoy:** `monto` es un único `Decimal(14,2)` y `descripcion` un texto libre. No hay de
dónde sacar los renglones para facturar por línea ni para mover inventario.

**Cómo se aplicará:**
1. **Schema:** nuevo modelo `cotizacion_items` (FK `cotizacion_id`, `cantidad`, `unidad`
   o FK a `unidades_medida`, `descripcion`, `precio_unitario`, `importe`, relación
   opcional a `articulos_inventario`).
2. `monto` de la cabecera se **deriva** de la suma de partidas (mantener o recalcular).
3. **Backend:** DTOs anidados en `create`/`update`, validación con `class-validator`
   (`@IsArray`, `@ValidateNested`, `@Type`), transacciones.
4. **Frontend:** editor de partidas en el modal (tabla de líneas, agregar/quitar).

**Impacto:** habilita la facturación por línea (P1) y la bajada de inventario (P4).

**Workflow entre pantallas:**
```
/cotizaciones  ──(modal Crear/Editar cotización → tabla de partidas)──►
   └─ estado "Aceptada" → botón «Crear proyecto» → /proyectos precargado (P3)
   └─ cada partida con artículo de /inventario → disponible para P4
```

---

### P3 — Vincular cotización ↔ proyecto / obra

**Objetivo:** cuando una cotización aceptada da paso a un **`proyectos`** (obra), poder
crear el proyecto desde la cotización (o referenciarla). Integra con **operaciones**.

**Hoy:** `cotizaciones` no tiene `proyecto_id`; `proyectos` (línea ~1152) no referencia
cotización.

**Cómo se aplicará:**
1. **Schema:** agregar `proyecto_id?` (nullable FK) a `cotizaciones` (o el puntero
   inverso en `proyectos`).
2. **Servicio:** al aceptar, formulario/acción «Crear proyecto» que precargue datos del
   cliente y monto.
3. **Frontend:** botón en la cotización aceptada + menú en `proyectos` para ver
   vínculo.

**Impacto:** cierra el flujo comercial → operaciones (obras, hitos, bitácoras,
reportes de campo).

**Workflow entre pantallas:**
```
/cotizaciones  ──(cotización "Aceptada" con proyecto_id)──►
   └─ botón «Ver proyecto» → /proyectos/{id}
         └─ detalle del proyecto: obras[], despachos_maquina[], progreso
              └─ desde la obra → /operaciones (bitácoras, reportes de campo)
```

---

### P4 — Bajada de inventario por líneas (si aplica)

**Objetivo:** si la cotización referencia productos/servicios con stock, al generar la
venta/factura se descarga **`articulos_inventario`** y se registra un
**`movimientos_inventario`**.

**Hoy:** no hay vínculo cotización → inventario. Depende de P2 (partidas).

#### P4b — La venta del POS descuenta el inventario (SIN depender de P2)

**Hallazgo verificado en schema:** `ventas_items` **ya tiene FK a
`articulos_inventario`** (`articulo_id`). Es decir, la venta del punto de venta ya
sabe **qué artículo** vendió — lo que NO hacía era descontar stock ni registrar el
movimiento.

**Estado (2026-11-08): ✅ REALIZADO** — implementado en `ventas.service.ts`:
el descuento corre DENTRO de la `$transaction` de la venta con **updateMany
condicional** (`where: { id, stock: { gte: cantidad } }`) — guard anti-carrera
contra stock negativo por ventas simultáneas — y por cada línea nace un
**`movimientos_inventario` SALIDA** con `motivo 'Venta POS'`,
`referencia_tipo 'VENTA_POS'` y `referencia_id = venta.id`
(traceable en /inventario). Si el guard no descuenta (carrera), la
transacción REVERTE la venta completa y responde `STOCK_INSUFICIENTE`
con auditoría FAIL.
**Test de idempotencia integración real:** reintentar la venta con la MISMA
`idempotencia_key` NO duplica descuento (stock queda en 97 tras 98→97,
1 movimiento únicamente). Specs unitarios 35/35, integración 10/10.

**Cómo se aplicará:**
1. **`ventas.service.ts`** — en la `$transaction` que registra la venta, por cada
   `ventas_items.articulo_id`: validar stock suficiente → descontar
   `articulos_inventario.stock` → insertar `movimientos_inventario` (tipo SALIDA,
   motivo `VENTA_POS`, obra opcional).
2. **Medida vs stock:** el stock se maneja en la **medida base** del artículo
   (ver nota de stock por medida en P7); mientras no exista stock por medida, la
   conversión cantidad-vendida → medida base se valida solo para artículos con
   `articulos_precio` (si la medida del item ≠ medida base y no hay factor,
   rechazar con `MEDIDA_SIN_FACTOR` — audita FAIL antes de lanzar).
3. **Idempotencia:** el descuento corre dentro de la misma transacción protegida por
   `idempotencia_key` del POS — un reintento de la misma venta no descuenta doble.
4. **Frontend:** sin cambios en `/ventas`; `/inventario` ya muestra los movimientos
   (la SALIDA nueva aparece con motivo `VENTA_POS`).
5. **Tests:** unit + integración real (venta descuenta stock, genera movimiento,
   reintento idéntico no duplica descuento, stock insuficiente → FAIL auditado).

**Impacto:** cierra el círculo POS → bodega sin tocar el esquema del cotizador.

**Cómo se aplicará (original — cotizaciones):**
- En la transacción de aceptación, por cada `cotizacion_item` con `articulo_id`, validar
  stock → descontar → insertar movimiento (todo en la misma `$transaction`).
- Salida de inventario auditable y consistente con el movimiento.

**Impacto:** une cotizaciones con **inventario/bodega**.

**Workflow entre pantallas:**
```
/cotizaciones  ──(partidas con articulo_id en una cotización facturada)──►
   └─ $transaction: valida stock → descuenta articulos_inventario
        → inserta movimientos_inventario
              └─ /inventario  → se ve la salida (trazabilidad por artículo y obra)
```

---

### P5 — Pagos ligados a la cuenta por cobrar generada

**Objetivo:** cerrar del todo la cadena **cotización → factura → CxC → pago**.

**✅ REALIZADO (Fases 1-2, workflow 03):** módulo cobranza completo — el cobro abona
`cuentas_por_cobrar.monto_pagado` (update condicional cierra la carrera) y marca
`PENDIENTE → PARCIAL → SALDADO` en la misma transacción que nace la transacción
INGRESO; la corrección es **reversión** (compensatoria auditable), nunca delete.

**Cómo se aplicará:**
- Un `pago` abona contra `cuentas_por_cobrar.monto_pagado` y al llegar a `monto`
  marca la CxC como `PAGADA`.
- Mostrar el estado de la cotización/factura en la vista de **cobranza**.

**Impacto:** cierra la cadena financiera completa y otorga trazabilidad de cobro.

**Workflow entre pantallas:**
```
/finanzas (cobranza)  ──(registrar pago contra una CxC)──►
   └─ pago abona a cuentas_por_cobrar.monto_pagado → si llega a monto, CxC = PAGADA
         └─ /clientes → la ficha del cliente muestra la CxC saldada (6.7)
```

---

### P6 — `vendedor_id` real y catálogos

**Objetivo:** asignar el vendedor del usuario logueado a cada cotización y mostrarlo en
las vistas de comercial/finanzas.

**Hoy:** `vendedor_id` existe en el modelo pero el frontend no lo usa.

**Cómo se aplicará:**
- En `create`, tomar `vendedor_id` del JWT/usuario autenticado.
- Exponerlo en `serialize` y mostrarlo en tablas/detalle.
- Filtro por vendedor en el listado.

**Impacto:** integra con **RRHH/personas** y habilita comisiones/reportes por vendedor.

---

### P7 — Edición de precios por medida de venta (POS ↔ Inventario)

**Objetivo:** permitir gestionar los **precios por medida de venta** (`articulos_precio`)
de los artículos que participan en el Punto de Venta, directamente desde el frontend.
Hoy ese catálogo quedó **bloqueado**: la vista de `/inventario` solo edita
`precio_unitario` (medida base), y el POS (`/ventas`) consume los precios por medida pero
no tiene pantalla de edición.

**Contexto (unificación):** tras unificar el catálogo del POS en
`articulos_inventario`, un artículo vendible puede tener **varias medidas con precios
distintos** en `articulos_precio` (p.ej. MAT-001 Arena: `m³` $350, `tonelada` $520,
`viaje` $1,800). El `precio_unitario` de `articulos_inventario` es la **misma cantidad**
que la fila de la **medida base** de `articulos_precio` (así lo dejó la migración). Por
eso, al editar por medida hay que **mantener sincronizado** `precio_unitario` con la
medida base para evitar que la vista de inventario y el POS se desincronicen.

**Cómo se aplicará:**
1. **Schema / API (`ventas.service.ts` o endpoint nuevo):** exponer los `articulos_precio`
   de un artículo (`GET`) y un endpoint de guardado **por medida** (alta/baja/precio).
2. **Sincronización (regla de negocio):** cuando se edite el precio de la **medida base**
   del artículo, actualizar también `articulos_inventario.precio_unitario` en la misma
   `$transaction` (y a la inversa, si se edita `precio_unitario` en inventario, reflejarlo
   en la fila de la medida base de `articulos_precio`). Esto elimina la desincronización.
3. **Frontend `/inventario`:** en el modal de editar, cuando el artículo tenga
   `articulos_precio`, mostrar un editor de **tabla de medidas/precios** en lugar (o además)
   del campo `precio_unitario` bloqueado. (Hoy ese campo está `readonly` para los artículos
   con código `MAT-*` y muestra un hint; la gestión por medida reemplazará ese bloqueo.)
   - **Requisito del cliente (2026-11-06):** el registro del **tipo de unidad ligado a un
     precio** debe poder hacerse y **editarse de forma fácil por los encargados** — editor
     de tabla simple (medida + precio, agregar/quitar filas) sin pasar por pantalla
     técnica; acceso por RBAC `puede_editar` de la vista `/inventario` (los encargados no
     necesitan rol administrador).
   - El `articulo_id + medida` tiene índice único en schema (`articulos_precio`),
     así que alta duplicada de medida se responde con `CODIGO_DUPLICADO`→
     mensaje "esa medida ya existe para este artículo".
4. **DTOs estrictos:** `class-validator` (`@IsUUID`, `@Min`, `@IsArray`/`@ValidateNested`
   para el arreglo de medidas).
5. **Tests:** unit + integración (real contra PostgreSQL) cubriendo la sincronización
   medida base ↔ `precio_unitario` y el alta/baja de medidas.
6. **Stock por medida (importante):** actualmente **todas las medidas de un mismo
   artículo comparten el mismo stock** (el de `articulos_inventario`). Esto es incorrecto:
   1 `m³` y 1 `tonelada` no descuentan el mismo inventario físico. Al gestionar medidas
   por precio hay que **separar (o al menos tolerar) el stock por medida de venta** para
   que el POS valide/disponga existencias de forma correcta y las ventas descuenten la
   unidad adecuada (ver § P7 nota de stock).

**Impacto:** deja de estar "congelado" el precio del POS; el inventario es la fuente
única de catálogo y de sus precios por medida, consistente con lo que cobra `/ventas`.

**Workflow entre pantallas:**
```
/inventario ──(editar un artículo vendible → tabla de medidas/precios)──►
   └─ § guarda articulos_precio (alta/baja/precio) + sincroniza precio_unitario
         ├─► /ventas (POS) → el catálogo refleja medidas y precios actualizados
         └─► /inventario  → precio unitario base coherente con la medida base
```

> **Regla de sincronización:** `articulos_inventario.precio_unitario` (medida base) y la
> fila de la medida base en `articulos_precio` deben ser **siempre el mismo valor**. Toda
> edición de uno implica actualizar el otro en la misma transacción.

> **Nota de stock por medida:** hoy no existe stock por medida — todas las medidas del
> mismo artículo usan el stock de `articulos_inventario`, y el POS valida cantidad contra
> ese valor (p.ej. comprar 5 `viajes` descuenta/mide contra el mismo stock que 5 `m³`).
> Esta conducta es aceptable solo mientras el stock físico se maneje en la medida base;
> **se deberá separar el stock por medida** cuando los precios por medida entren en
> producción (o agregar `stock`/`stock_minimo` en `articulos_precio` por cada medida y
> sumar/validar por artículo), para que el POS descuente existencias correctas por unidad
> de venta. Esta separación es un requisito colateral de P7, no parte de la edición de
> precios.

---

### P9 — Retiro futuro del campo "prioridad" en /reportes (idea del cliente)

**Estado:** campo `prioridad` ACTIVO hoy en el alta/lista de `/reportes`, pero con
vía de retiro planeada. **Regla acordada (2026-11-08):** cuando la empresa termine
de poblar las **subcategorías por torre**, estas se **agruparán por un nivel de
prioridad** y el incidente llevará su prioridad **de forma automática** derivada de
la subcategoría — el campo manual se elimina del alta (y de la columna en la
tabla). Relación con lo ya documentado: subcategorías por torre en
`subcategorias_reporte` (§3 P7), y las torres vinculan con los roles
(`roles.torre`).

**Cómo se aplicará (futuro):**
1. Agregar `nivel_prioridad` (o el nombre que se defina) al catálogo
   `subcategorias_reporte` y poblarlo por subcategoría con la empresa.
2. Derivar la prioridad en el alta: `create` guarda `prioridad` según la
   subcategoría elegida (sin campo manual); en el listado mostrarla como hoy
   (columna/celda) pero de solo lectura.
3. Retirar el select de prioridad del alta y del detalle de /reportes.
4. Historia conservada: los reportes antiguos mantienen su `prioridad`
   capturada a mano.

---

### P10 — Equipos por residente: la relación jefe↔trabajador (parcial, 2026-11-08)

**Lo que YA EXISTE en la DB (funcionando):**
- Columna **`users.jefe_user_id`** (FK self a `users`, índice, `ON DELETE SET NULL`)
  — dice qué usuario es **jefe/residente de cada trabajador** (usuario↔usuario;
  **no** va por `trabajadores` ni `trabajadores_proyectos`). Asignación demo:
  `trabajador@`, `pedro.chofer@` y `luis.operador@` a cargo de `residente@`.
- **Scope de /reportes implementado** (`aplicarAmbito`): los Residentes ven los
  reportes **levatados por sus trabajadores** (`jefe_user_id = yo`) + los suyos;
  y pueden dar seguimiento (aceptar/cerrar-como-admin/comentar/adjuntar según
  permisos).

**Lo que NO existe todavía (documentado como punto de trabajo):**
- **No hay UI ni endpoint para asignar el jefe** — hoy es solo SQL (`UPDATE users
  SET jefe_user_id = …`). Cuando se construya el **panel de usuarios**, la misma
  columna se expone ahí con un select de residentes para cada trabajador.
- **El vínculo es usuario↔usuario**: no va por la tabla `trabajadores` ni por
  `trabajadores_proyectos` (worker↔proyecto). Si el negocio prefiere asignar
  trabajadores **por proyecto** al residente (y que el residente herede los
  reportes de todos los de esa obra), es la variante B: `proyectos.residente_id`
  + scope por `trabajadores_proyectos` — pendiente de confirmar con el cliente.
- **Fallback ya implementado:** cualquier trabajador **sin jefe asignado** solo ve
  sus propios reportes (nadie más los ve, salvo Admin).
- El mismo mecanismo (`jefe_user_id`) sirve para cualquier rol con subordinados
  (p. ej. administrativos que supervisan personal de oficina) sin cambios.

---

### P11 — Asignación de equipos: trabajadores ↔ residentes (UI + endpoint)

**Qué se construye** (formaliza el punto de trabajo de P10, que hoy es solo SQL):
- **Vista nueva** (módulo Sistema/Trabajadores, escritorio): lista de usuarios
  con rol **Residente** y, por cada uno, su equipo (trabajadores con
  `jefe_user_id` = ese residente). Acciones: **asignar** un trabajador a un
  residente (select de residentes), **re-asignar** (cambia el jefe) y
  **des-asignar** (jefe NULL → fallback de solo-sus-propios-reportes).
- **Endpoint:** `POST/PATCH /usuarios/:id/jefe` (admin/RRHH, con auditoría
  SUCCESS/FAIL: `JEFE_ASIGNADO` / `SIN_PERMISO`).
- **Efecto inmediato en la PWA:** el scope de /reportes y la vista de
  asistencia del equipo del Residente se recalculan solos (usan
  `jefe_user_id` — nada por recodificar).
- **Relación con la PWA:** `pwa/vistas-movil-comercial-operaciones.md` §8.10-1
  (el alta ampliada también asigna encargado — esta vista lo GESTIONA después).

### P12 — Panel "Gestión de identidad" (usuarios + roles + permisos + áreas + sesiones, todo junto)

**Qué se construye** (la vista 360 que pide el cliente — hoy están en 4
pantallas separadas: Usuarios, Roles, Configuración, Trabajadores):
- **Una vista** que por cada usuario muestra EN UNA FILA/DETALLE: su
  **rol(es)**, sus **vistas** con flags, sus **permisos** por módulo, su
  **área (torre)**, su **número de empleado**, su **jefe** (P11), su
  **estado de PIN** (cambiado hace N días / temporal activo / cuenta
  bloqueada) y sus **sesiones activas** (dispositivo, IP, última actividad).
- **Acciones de mesa de ayuda integradas ahí** (spec PWA §6.7):
  **desbloquear** cuenta · **reiniciar PIN** (temporal 24 h) · **cerrar
  todas las sesiones** del trabajador. Relación: `pwa/...§8.9` (las 2
  acciones parciales — cierre masivo standalone y bloqueo instantáneo —
  viven aquí).
- **Relación visible de unos con otros:** cambiar el rol de la fila muestra
  al instante qué vistas/permisos hereda (preview antes de guardar) — el
  "ver la relación de unos a otros" que pide el cliente.
- **BD:** no pide columnas nuevas — todo ya existe (users, users_roles,
  role_vistas, sessions, refresh_tokens, campos de PIN del paso 1 de la
  PWA). Es una vista de LECTURA + acciones.

### P13 — Sweeper de `token_blacklist` (limpieza de filas vencidas)

**Qué se construye:** tarea programada (cron de la API o job del hosting) que
borra de `token_blacklist` las filas cuya `expira` ya pasó (los tokens ahí
listados ya no son válidos por firma/fecha — borrarlos es seguro). La tabla
crece 1 fila por logout/rotación; hoy es cosmético, con miles de usuarios
diarios deja de serlo. Propuesto en la revisión del PR #17 (P11 de esa
conversación).

### P14 — Alta ampliada de Trabajadores con identidad PWA (número + PIN temporal + WhatsApp + encargado/obra)

**Qué se construye — en la VISTA/ALTA QUE YA EXISTE de Trabajadores**
(escritorio), no en una nueva: el spec del cliente (PWA §6.6-1/2) dice "el
administrativo registra al trabajador **en Trabajadores**, elige el rol…" —
el alta de siempre se AMPLÍA con la identidad móvil:

- **Al crear el trabajador** (el administrativo elige el rol), el sistema
  genera y guarda:
  - `users.numero_empleado` (prefijo por rol + consecutivo, transacción
    anti-carrera: ADM-01, RES-014, TEC-007, COB-003, TRA-0142…)
  - `users.pin_hash` de un **PIN temporal de 24 h** (sin caracteres
    confusos 0/O/1/l/I, sin repetidos — regla estricta §8.3 del plan PWA)
  - `pin_temporal_hasta` (24 h) + `pin_cambiado_en`
- **Campos nuevos en el formulario del alta:** encargado (select de
  residentes → `jefe_user_id`) y obra (según P10/variante pendiente de
  confirmar) — el caso Residente (PWA §6.8) necesita esa liga.
- **Botón "Enviar por WhatsApp"** (`wa.me` con el número de la persona,
  mensaje prellenado: nombre, número de empleado, PIN temporal y enlace a la
  PWA — **sin API y sin costo**, spec §6.6-2). El PIN temporal se muestra UNA
  VEZ en esa pantalla (nunca vuelve a verse — spec §6.7).
- **Acciones de mesa de ayuda** conectadas a P12 (desbloquear/reiniciar/
  cerrar sesiones desde la misma ficha del trabajador).
- **Relación con la PWA:** `pwa/vistas-movil-comercial-operaciones.md`
  §8.2 (endpoint ampliado), §8.9/§8.10 (auditoría de §6.7/§6.8 y
  pendientes) — este item CIERRE el ciclo §6.6-1/2 que quedó pendiente.

**Auditoría:** todas las acciones auditan SUCCESS/FAIL con los 4 estándares
(`TRABAJADOR_CREADO` ya existe; acciones de PIN: `PIN_REINICIADO`/
`CUENTA_DESBLOQUEADA` — ya en el enum desde el paso 2 de la PWA).

---

### P8 — Metas de progreso del proyecto con fechas límite (idea del cliente)

**Objetivo:** el progreso del proyecto deja de ser un número manual capturado a mano.
Al registrar un proyecto (o después, desde "Ver detalle") se capturan **metas a
cumplir, cada una con su fecha límite**; conforme se marcan **CUMPLIDAS**, el
`proyectos.progreso` se llena proporcionalmente al peso de cada meta.

**Estado verificado en schema:** el modelo `hitos_progreso` **YA EXISTE** y hoy solo
alimenta (en el mock) la curva S del modal: `proyecto_id`, `nombre`, `descripcion`,
`periodo`, `fecha`, `planificado`/`real` (Decimal 5,2). Le faltan exactamente las
piezas de "meta": `fecha_limite` y el estado de cumplimiento.

**Cómo se aplicará (diseño sobre lo existente, sin modelo nuevo):**
1. **Schema:** ampliar `hitos_progreso` con `fecha_limite` (Date?, nullable) y
   `estado` (`PENDIENTE`/`CUMPLIDA`, default PENDIENTE). El `planificado` de la meta
   es el **% objetivo acumulado** al cumplirla (misma escala que `proyectos.progreso`
   0–100). Migración con defaults para las filas existentes.
2. **Derivación del progreso (regla central):**
   - Proyecto **con metas** → `progreso` = % del planificado de la última meta
     CUMPLIDA (o suma ponderada si hay pesos) — **derivado, no editable a mano**.
   - Proyecto **sin metas** → captura manual como hoy (comportamiento actual sin
     romper nada).
   - Al marcar una meta CUMPLIDA: en la misma `$transaction` — transición condicional
     `PENDIENTE → CUMPLIDA` (estado leído contra dobles → `CONFLICTO_CONCURRENCIA`
     en doble-marca), update de `proyectos.progreso`, e insert del punto real en
     `hitos_progreso` del periodo (para la curva S). Todo audita SUCCESS/FAIL.
3. **Fecha límite:** la meta que pasó su `fecha_limite` sigue PENDIENTE → badge
   "Vencida" en el modal (dato derivado, no estado persistido).
4. **Frontend (modal Ver detalle, 6.6.1):** sección "Metas del proyecto" con la lista
   (nombre, fecha límite, % objetivo, estado) + botón «Marcar cumplida» por RBAC
   `puede_editar`; en el registro/edición del proyecto una tabla para dar de alta las
   metas. Badge histórico de metas vencidas en la página de proyectos.
5. **Cruce con 6.3 (futuro):** los reportes-campo con avance pueden sugerir
   auto-marcar la meta correspondiente; nunca auto-cumplirla sin confirmación humana.
6. **Tests:** unit (transición condicional, doble marca → 409, progreso
   recalculado) + integración real (marcar meta cumple → fila SUCCESS en
   `registro_auditoria`, `proyectos.progreso` actualizado, punto de curva S creado).

**Impacto:** combinación con FLUJO-PROGRESO-PROYECTOS (6.3): la fuente de la verdad
del progreso pasa de "capturado" a "derivado de metas cumplidas", y el modal obtiene
la curva S con datos reales en vez del mock.

**Workflow entre pantallas:**
```
/proyectos ──(crear/editar proyecto → tabla de metas con fecha límite)──►
   └─ modal Ver detalle ──(«Marcar cumplida»)──►
      └─ $transaction: meta PENDIENTE→CUMPLIDA (condicional)
           ├─► proyectos.progreso recalculado (página de proyectos)
           └─► punto real en curva S del modal (6.6.1)
```

---

```
                       ┌─────────────────────┐
   Catálogo            │     CLIENTES         │
   (vista /clientes)   └──────────┬──────────┘
                                  │
                                  ▼
                       ┌─────────────────────┐
   Comercial           │   COTIZACIONES        │── P6 → vendedor_id (RRHH)
   (vista /cotizaciones)└──────┬──┬───────────┘
                              │  │
                 P2 partidas  │  └──────────► P3 → PROYECTOS (operaciones/obras)
                    (items)   │
                              ▼
                              │ Acepta (P1, $transaction)
                              ▼
                  ┌──────────────────────────────┐
                  │ FACTURAS + FACTURA_CONCEPTOS  │
                  └──────────────┬───────────────┘
                                 ▼
                  ┌──────────────────────────────┐
                  │ CUENTAS_POR_COBRAR (cliente)  │── P4 → ARTICULOS_INVENTARIO
                  └──────────────┬───────────────┘         + MOVIMIENTOS
                                 ▼
                  ┌──────────────────────────────┐
                  │ PAGOS (finanzas/cobranza)     │  (P5 → cierra la cadena)
                  └──────────────────────────────┘
```

---

## 5. Validación y riesgos

- **Migraciones:** cualquier cambio de schema (P1, P2, P3, P4) requiere aplicar la
  migración en la BD real del servidor (`192.168.0.201`, y su PostgreSQL con la BD
  `svr_erp`). Recordar el incidente del **500 en `/cotizaciones`**: ocurrió porque el
  código nuevo exigía la columna `motivo_rechazo` que la BD física aún no tenía; la
  solución fue `npx prisma migrate deploy`. **Toda migración futura debe aplicarse en
  ambas BD (local y servidor) antes de levantar el build nuevo.**
- **Transacciones:** los flujos P1/P4 son multi-tabla; obligatorio `prisma.$transaction`
  para evitar factura sin CxC o inventario descontado sin movimiento.
- **Auditoría:** cada entidad generada (factura, CxC, movimiento, pago) debe registrar
  su propio `registro_auditoria` con `SUCCESS`/`FAIL` (`fallir()`), siguiendo
  `audit-service-guide.md` y la referencia viva de `apps/api/src/criba/`.
- **Tests:** cada servicio generador debe llevar unit (`*.spec.ts`) + integración
  (`*.integration.spec.ts`, real contra PostgreSQL) según la regla de testing de
  `AGENTS.md`.
- **Frontend / hidratación:** la vista es `"use client"`; sin problema de Server
  Components. Reutilizar `@/components/ui/*` (DataTable, FormModal, StatsCard, etc.) y
  no re-implementar.
- **RBAC:** los nuevos endpoints deben declarar `@RequirePermission(...)` y respetar
  los 4 checkpoints (JWT + blacklist + auditoría SUCCESS + auditoría FAIL).

---

## 6. Mapa de integración de las demás vistas (CRUD ya en API)

> La siguiente es la síntesis de dos auditorías de cruces entre módulos (backend vía
> `schema.prisma`, frontend vía `apps/web/src/lib/api.ts` y cada `page.tsx`).
> **Actualización 2026-11-04:** la mayoría de las vistas consumen CRUD por API
> (`apps/web/src/lib/api.ts`), PERO aún hay mock de `@/lib/data` en:
> `dashboard/page.tsx`, `gps/page.tsx`, `documentos/page.tsx`, `Topbar.tsx`,
> `MachineCard.tsx`, `ProjectCard.tsx` y `ProjectDetailsModal.tsx`. Abajo quedan los
> **cruces de negocio** y los **gaps de modelo** por dominio.

### Mapa de flujo entre vistas (vista de pájaro)

```
                ┌───────────────  COMERCIAL  ───────────────┐
                │                                            │
   /clientes ◄────────────► /cotizaciones ──(acepta)──► /finanzas (factura+CxC)
      │  ▲                    │  ▲                          │
      │  └───── proyectos ────┘  └── partidas ───► /inventario (P4)
      ▼                         │
   /proyectos ◄─── progreso ────┘ (P3) ──► obras → /operaciones
      │  │                              ▲
      │  └─── despachos_maquina ──► /maquinaria        /incidentes
      │                                            │        │
      ▼                                            ▼        ▼
   /operaciones ◄─ bitácora de renta ──► /finanzas (CxC)   /mantenimiento
      │                               ▲                    /reportes-campo
      └───────────────────────────────┘
   /criba ──(producción)──► /inventario (entrada) ◄──► /cotizaciones (salida P4)
```

### 6.1 `/operaciones` ↔ Bitácoras de operación & renta (`bitacoras_operacion`, `bitacoras_renta_diaria`)

- **Hoy:** vistas de operaciones consumen su CRUD por API. ✅ **REALIZADO (Fase 4,
  workflow 02):** `bitacoras_renta_diaria` cerrada (estado `LISTO_FACTURAR`) se factura
  con `POST /bitacoras-renta/:id/facturar` → nace la `cuentas_por_cobrar` del cliente
  con la bitácora referenciada; la firma del residente (PENDING_FIRMA) gatea la
  facturación.
- **Gap de modelo:** verificar que `bitacoras_operacion` tenga el cruce a `maquinas`,
  `trabajadores` y `proyectos` (despachos_maquina ya cruza máquina+proyecto+operador).
- **Gap confirmado en BD real (2026-11-06) — solo 3 obras al registrar operaciones:**
  el catálogo de obras del registro y de los filtros (`GET /bitacora/catalogos`) es
  correcto (excluye FINALIZADA). El dato real: la BD tiene solo **3 obras**, y de los
  6 proyectos EN_PROCESO **solo 2 tienen obra** (1 obra más pertenece a un proyecto
  FINALIZADO). El registro de operaciones se amarra a obras, no a proyectos → los
  4 proyectos en proceso sin obra quedan imposibilitados. Arreglo por cerrar: el flujo
  "proyecto → obra" de 6.6 (crear la obra al iniciar el proyecto) y/o sembrar las
  obras de los proyectos activos existentes.

**Workflow entre pantallas:**
```
/operaciones ──(bitácora de renta → botón «Cerrar/Confirmar»)──►
   └─ $transaction: genera cuentas_por_cobrar + enlaza firmas_cliente
         ├─► /finanzas  → aparece la CxC del cliente (6.8)
         └─► /clientes  → la ficha muestra la CxC + firma (6.7)
```

### 6.2 `/incidentes` ↔ Reportes de campo & mantenimiento

- **Hoy:** CRUD por API. `incidentes` es transversal (puede referenciar máquina,
  trabajador, obra, proyecto según el caso).
- **Flujo pendiente:** cuando un incidente se marca **resuelto**, derivar un
  **`registros_mantenimiento`** (si es de máquina) o un **`reportes_campo`** (si es de
  obra), en una sola transacción, auditable.
- **Gap:** confirmar si `incidentes` tiene `maquina_id`/`proyecto_id` o usa un puntero
  polimórfico; de ser este último, validar consistencia (igual patrón que
  `transacciones.entidad_tipo/entidad_id`).

**Workflow entre pantallas:**
```
/incidentes ──(marcar incidente «Resuelto»)──►
   └─ $transaction: deriva a
        ├─ registros_mantenimiento (si es de máquina)  → /mantenimiento
        └─ reportes_campo (si es de obra)              → /reportes-campo (6.3)
```

### 6.3 `/reportes-campo` ↔ Obras, cotizaciones & finanzas

- **Hoy:** CRUD por API. `reportes_campo` describe avance/trabajo de un proyecto/obra.
- **Flujo pendiente:** ligar cada reporte de campo a su **`obras`/`proyectos`** para que
  **alimente el `progreso`** del proyecto (`proyectos.progreso`) y, si el reporte implica
  costo, generar una **`transacciones`** de tipo egreso asociada al proyecto.
- **Gap:** `transacciones` usa puntero polimórfico (`entidad_tipo` + `entidad_id`) **sin
  FK**; el cruce a proyecto es conceptual. Evaluar si conviene FK explícita o mantener el
  puntero con validación en servicio.

**Workflow entre pantallas:**
```
/reportes-campo ──(guardar reporte con avance/costo)──►
   ├─► /proyectos  → actualiza proyectos.progreso (6.6)
   └─ si implica costo → genera transacciones (egreso) → /finanzas (6.8)
```

### 6.4 `/criba` ↔ Máquinas & producción (`registros_criba`)

- **Hoy:** CRUD por API (referencia viva de auditoría). `registros_criba` registra
  producción de material por turno y operador.
- **Gap confirmado en schema:** `registros_criba` **solo** se relaciona con
  `trabajadores` (operador). **No tiene `maquina_id` ni `obra_id`/`proyecto_id`**.
- **Flujo pendiente:** agregar `maquina_id?` y `proyecto_id?/obra_id?` (FK) para poder
  reportar **producción por máquina y por obra**, y cruzar con horómetro/mantenimiento.
- **Cruce con cotizaciones (P4):** el material producido en criba alimenta el inventario
  (`articulos_inventario`) que luego las cotizaciones con partidas descargan.

**Workflow entre pantallas:**
```
/criba ──(registrar producción por turno/operador)──►
   └─ (con maquina_id + proyecto_id — gap por agregar)
        ├─► /maquinaria  → producción por máquina (horómetro/mantenimiento)
        └─► /inventario  → alta de material producido (6.5)
```

### 6.5 `/inventario` ↔ Criba, cotizaciones & movimientos (`articulos_inventario`, `movimientos_inventario`)

- **Hoy:** CRUD con API real; es la **plantilla base** de toda vista CRUD nueva
  (AGENTS.md).
- **Flujo pendiente:** 
  - Entradas desde **criba** (producción → alta en inventario) en una transacción.
  - **Salidas** desde **cotizaciones/ventas** aceptadas (P4) → `movimientos_inventario`.
- **Gap:** verificar que `movimientos_inventario` tenga `articulo_id` + `tipo` +
  `cantidad` y que la vista permita esa trazabilidad de entrada/salida por artículo y por
  obra.

**Workflow entre pantallas:**
```
/inventario ◄─ (entrada) /criba producción  ·  (salida) /cotizaciones facturada (P4)
   └─ cada alta/baja inserta movimientos_inventario
        └─ detalle del artículo → stock + trazabilidad por artículo y obra
```

### 6.6 `/proyectos` ↔ Clientes, obras, despachos & cotizaciones (`proyectos`, `obras`, `despachos_maquina`)

- **Hoy:** CRUD por API. **Actualización 2026-11-06:** el `ProjectDetailsModal`
  ("Ver detalle") está detallado abajo; sigue filtrando mock de `@/lib/data`
  (**único residuo** junto a `MachineCard`/dashboard/gps/documentos).
- **Flujo de datos proyecto ↔ obra — HOY (verificado 2026-11-07):** el flujo
**no existe**; peor, la nomenclatura genera confusión:
1. La vista `/proyectos` llama "obra" a lo que crea ("Registra una nueva obra...",
   "Ubicación de la obra") — nomenclatura heredada — pero `proyectos.service.create`
   solo inserta en la tabla `proyectos` (calles/colonia/ciudad como "ubicación").
   **No toca `obras`.**
2. La tabla `obras` (frente físico con `lat/lng/radio_permitido_metros`, que alimentan
   bitácoras, asistencia GPS y reportes-campo) **no tiene endpoint de creación ni UI**:
   un `grep` completo confirma que solo la leen catálogos; sus 3 filas vinieron del
   dump/seed manual.
3. Consecuencia: los proyectos se registran pero las obras no se generan → el
   catálogo de `/operaciones`/`/asistencia` queda cojo (solo obras del dump).

**Flujo de datos proyecto ↔ obra — DEBE SER (diseño a implementar en 6.6):**
1. **Crear proyecto (EN_PROCESO) → nace obra base** en la misma `$transaction`:
   `obras` hereda `nombre` del proyecto + `proyecto_id` (FK que ya existe), activo,
   sin ubicación (se captura después para GPS). Con guard idempotente: si al correr
   de nuevo el proyecto ya tiene obra, no duplica (reutilizable como seed).
2. **Obras múltiples por proyecto (multi-frente):** un proyecto puede registrar
   varias obras (p. ej. "Fraccionamiento Valle Sur" → "calle A", "calle B").
   **Regla del cliente (2026-11-07):** al registrar la primera obra manual del
   proyecto, la **obra base automática (la que heredó el nombre del proyecto) se
   retira** (soft-delete `eliminado_en` en la misma transacción) — quedan **solo la
   obra u obras que el encargado creó**. Registro 0→N: proyecto sin obras manuales
   muestra la base; con ≥1 manual, solo las manuales.
3. **Ubicación del botón "Agregar obra": decisión (2026-11-07).** Va como **acción
   contextual del proyecto** (en las acciones de fila y/o en el modal Ver Detalle,
   como "Obras (N)"), **NO al lado del botón "Registrar proyecto"**: una obra SIEMPRE
   nace con un `proyecto_id` — ponerla junto al registro de proyectos permitiría
   crear obras huérfanas, que es exactamente el bug de hoy. Nace la obra → abre un
   mini-modal desde el proyecto (nombre del frente + ubicación + radio GPS).
   Necesita un módulo/endpoint de `obras` con los 4 checkpoints (hoy no existe
   backend de obras).
4. **Sincronización de estados:** al marcar proyecto FINALIZADO/PAUSADO, sus obras
   activas toman el mismo estado en la misma transacción (incluida la base que aún
   exista) → desaparecen del catálogo de registro de operaciones/horas (termina con
   el caso "Puente Atizapán" apareciendo con proyecto FINALIZADO).
5. **Catálogos con filtro por proyecto:** `GET /bitacora/catalogos` (y asistencia)
   exponen también el `proyecto_id/proyecto nombre` de cada obra para mostrarlos
   agrupados en el select (obra — proyecto).
6. **Nomenclatura UI:** actualizar labels de `/proyectos` ("obra" → "proyecto") para
   que la palabra "obra" queda reservada al frente físico — evita la confusión actual
   del personal de campo.
7. **Tests:** unit + integración (obra nace con proyecto, no duplica on re-run,
   base se retira al crear primera obra manual, estados sincronizados, catálogo
   filtrado).

**Impacto:** cierra el puente comercial→operación tipo contrato real: proyecto = lo
que se factura; obra(s) = donde se ejecuta. Sin él, la operación de campo depende de
inserts manuales (hoy).

**Flujo pendiente:**
  - **Proyecto → Obra(s):** `proyectos` tiene `obras[]`; cerrar el flujo de creación de
    obra desde un proyecto. **Gap confirmado en BD real (2026-11-06):** de los
    **6 proyectos EN_PROCESO, solo 2 tienen obra** (la BD total tiene 3 obras, una en
    un proyecto FINALIZADO). Consecuencia directa en `/operaciones`: el catálogo de
    registros (`GET /bitacora/catalogos`, obras `estado != FINALIZADA`) solo muestra
    3 — **no es bug de filtro, es falta de obras**. Los proyectos sin obra no reciben
    operaciones hasta que exista la obra → cerrar este flujo (o sembrar obras) es
    prerrequisito operativo, no cosmético. Este punto queda aclarado por completo en
    el flujo "DEBE SER" de arriba (el seed de Tier 0 resuelve el hoy; el flujo 6.6
    resuelve el futuro).
  - **Proyecto → Despacho de máquina:** `despachos_maquina` cruza `maquina_id +
    proyecto_id + operador_id`; alimentar el detalle del proyecto con las máquinas
    despachadas.
  - **Proyecto → Cotización (P3):** crear proyecto desde cotización aceptada.
  - **Avance/estado:** `proyectos.progreso` deriva de metas/hitos — ver **P8** §3.

#### 6.6.1 Anatomía del modal "Ver detalle" (`ProjectDetailsModal.tsx`)

Para qué sirve: es la **ficha de control de la obra** en un solo vistazo — progreso
frente al plan, salud financiera y recursos humanos/flota asignados. Muestra, por bloques:

| Bloque | Qué muestra | Tipo de dato | Fuente hoy |
|---|---|---|---|
| Header | Nombre, cliente, vigencia (fecha init→fin), Badge de estado | fechas/enum | mock |
| 1 · Curva S | LineChart "Progreso de Obra": avance acumulado Planificado (naranja) vs Real (oscuro), con leyenda | series % por fecha | mock (`historicoProgreso`) — el modelo real existe: `hitos_progreso` |
| 2 · Rentabilidad y costo | Presupuesto contratado, ingreso facturado/cobrado, desglose de gastos (nómina+HE, diésel, refacciones, materiales/criba), utilidad neta y badge de margen % (>20 verde, >0 ámbar, ≤0 rojo) | `formatCurrency` MXN | mock (API solo entrega `finanzas{ingresoCobrado,gastado}`; el desglose por concepto falta — Fase 3 de FLUJO-PROGRESO-PROYECTOS) |
| 3 · Desempeño (EVM) | **CPI** = valor ganado (presupuesto×%avance)/costo real y **SPI** = avance real/planificado, con semáforo (≥1 verde) | índices calculados | calculado local |
| 4 · Recursos | Personal en obra (Avatar + puesto + indicador activo) y Flota asignada (despachos activos + estado de máquina como Badge) | listas | mock (`trabajadores`, `despachosFlota`) |

**Pendientes del modal:**
1. **Migración a API real** (cosen las partes alimentables: finanzas de proyecto,
   personal por proyecto, despachos); los índices CPI/SPI se calculan igual con datos
   reales.
2. ~~Contraste en modo oscuro~~ → ✅ **REALIZADO (2026-11-07, Tier 0 tarea 2):**
   migración de las 18 clases `slate-*` crudas a **tokens `ui-*`** según la regla
   oficial de `globals.css` (mismo valor en claro, se invierte en oscuro) + chips de
   color con `dark:bg-{c}-500/15` / `dark:text-{c}-400` (convención ya usada en
   `/inventario`). Verificado: `tsc` sin error y sin rastro `slate-*` en el archivo; vista en claro intacta por diseño.

**Workflow entre pantallas:**
```
/proyectos/{id} ── detalle del proyecto:
   ├─► obras[]            → /operaciones (bitácoras, reportes de campo)
   ├─► despachos_maquina  → /maquinaria (máquinas despachadas por operador)
   ├─► progreso           ← /reportes-campo (6.3)
   └─► cliente_id         → /clientes (6.7)
ProjectDetailsModal: migrar de mock a API real (hito previo)
```

### 6.7 `/clientes` ↔ Facturas, pagos, cotizaciones, CxC, proyectos, trabajadores (`clientes`)

- **Hoy:** CRUD por API; es el **hub** de relaciones:
  `clientes → cotizaciones[] / cuentas_por_cobrar[] / facturas[] / pagos[] / proyectos[] /
  trabajadores[] / bitacoras_renta_diaria[]`.
- **Flujo pendiente:** en el detalle del cliente consolidar **tab de activos**: cotizaciones,
  facturas, cuentas por cobrar, pagos y proyectos del cliente (todas ya tienen FK a
  `clientes`). Único tab pendiente de afinar es el de **trabajadores por proyecto**
  (`trabajadores_proyectos`).
- **Cruce con cotizaciones:** al aceptar una cotización se genera factura/CxC del
  `cliente_id` (P1), cerrando el círculo en la ficha del cliente.

**Workflow entre pantallas:**
```
/clientes/{id} ── ficha con tabs consolidados (todas ya tienen FK a clientes):
   ├─► Cotizaciones      ← /cotizaciones (cliente_id)
   ├─► Facturas          ← /finanzas (P1)
   ├─► Cuentas por cobrar← /operaciones (6.1) + /finanzas (P1)
   ├─► Pagos             ← /finanzas (P5)
   ├─► Proyectos         ← /proyectos (cliente_id)
   └─► Trabajadores      ← /trabajadores (trabajadores_proyectos)
```

### 6.8 `/finanzas` ↔ Transacciones, facturas, CxC, pagos & proyectos (`transacciones`)

- **Hoy:** CRUD por API. **Actualización 2026-11-04:** los endpoints que este apartado
  pedía YA EXISTEN — módulo `facturas` (CRUD + conceptos + cambiar estado + export CSV),
  módulo cobranza (CxC + cobros + vencimientos + por-proyecto) y conciliación
  (`GET /finanzas/flujo-neto` suma CxC vs CxP por ventanas de vencimiento).
- **Flujo pendiente (lo que queda de verdad):**
  - Desgloses reales por proyecto (nómina/combustible/mantenimiento/inventario) =
    **Fase 3 de `FLUJO-PROGRESO-PROYECTOS.md`**; hoy `proyectos.finanzas` es captura
    manual (`ingreso_cobrado`/`gastado`).
  - La venta POS a crédito aún no nace CxC (C3) ni factura (ver §8.4).
- **Puntero polimórfico:** `transacciones.entidad_tipo/entidad_id` sigue sin FK;
  el cruce a proyecto es conceptual (verificado en schema).
- **Cruce con cotizaciones:** la CxC/factura generada al aceptar (P1) y su pago (P5)
  consolidan la vista de finanzas.

**Workflow entre pantallas:**
```
/finanzas ── dashboard:
   ├─► Ingresos         ← pagos / CxC cobradas (/finanzas cobranza, P5)
   ├─► Egresos          ← transacciones (/finanzas gastos, 6.3)
   ├─► Facturas / CxC   ← /cotizaciones (P1) y /operaciones (6.1)
   └─► /proyectos       → utilidad por proyecto (transacciones.entidad_id)
```

---

## 7. Estado de cada flujo

| ID | Flujo | Rutas involucradas | Estado |
|----|-------|--------------------|--------|
| P1 | Aceptar cot. → Factura + Cuenta por Cobrar | `/cotizaciones` → `/finanzas` → `/clientes` | ✅ **Realizado** (Fase 3, workflow 01) |
| P2 | Partidas de cotización (`cotizacion_items`) | `/cotizaciones` (editor interno) | ⏳ Pendiente (`cotizacion_items` no existe en schema — verificado) |
| P3 | Cotización ↔ Proyecto/obra | `/cotizaciones` → `/proyectos` → `/operaciones` | ⏳ Pendiente |
| P4 | Bajada de inventario por líneas + **descuento por venta POS (P4b)** | `/cotizaciones` → `/inventario` · `/ventas` → `/inventario` | **P4b ✅ Realizado 2026-11-08** (updateMany condicional anti-carrera + movimientos SALIDA `VentaPos` + test idempotencia real) · la parte de cotizaciones sigue ⏳ (depende de P2) |
| P5 | Pagos → abono a la CxC | `/finanzas`/cobranza → `/clientes` | ✅ **Realizado** (Fases 1-2, workflow 03) |
| P6 | Vendedor real + catálogos | `/cotizaciones` → `/trabajadores` | ⏳ Pendiente (grep `vendedor_id`: cero usos en el API) |
| P7 | Edición de precios por medida de venta (POS ↔ Inventario) | `/inventario` ↔ `/ventas` | ⏳ Pendiente (hoy bloqueado; requiere sincronización medida base ↔ `precio_unitario`) |
| 6.1 | Bitácora renta cerrada → CxC + firma | `/operaciones` → `/finanzas` → `/clientes` | ✅ **Realizado** (Fase 4, workflow 02). **Gap de datos 2026-11-06:** BD con solo 3 obras — 4 de 6 proyectos EN_PROCESO sin obra → flujo proyecto→obra pendiente (6.6) |
| 6.2 | Incidente resuelto → mantenimiento / reporte campo | `/incidentes` → `/mantenimiento` / `/reportes-campo` | ⏳ Pendiente (verificado: `incidentes` no deriva nada) |
| 6.3 | Reporte campo → progreso proyecto + transacción | `/reportes-campo` → `/proyectos` → `/finanzas` | ⏳ Pendiente (verificado: no toca `progreso` ni `transacciones`) — **P8** propone derivar el progreso de metas cumplidas |
| P8 | Metas de proyecto con fecha límite → progreso derivado | `/proyectos` (registro y modal) | ⏳ Pendiente (base: `hitos_progreso` existe; faltan `fecha_limite` + estado CUMPLIDA + derivación) |
| 6.4 | Criba → máquina/obra + producción → inventario | `/criba` → `/maquinaria` → `/inventario` | ⏳ Pendiente (gap confirmado en schema: `registros_criba` solo FK a trabajadores) |
| 6.5 | Inventario → entradas criba / salidas cotización | `/inventario` ↔ `/criba` ↔ `/cotizaciones` | ⏳ Pendiente (criba no genera movimientos) |
| 6.6 | Proyecto → obras/despachos; modal Ver detalle (curva S, EVM, contraste oscuro) | `/proyectos` ↔ `/operaciones` ↔ `/maquinaria` | ⏳ Pendiente (modal sigue en mock; + detalle anatomía 6.6.1 y fix de contraste dark pendiente) |
| 6.7 | Cliente → tabs consolidados | `/clientes` → (todos los tab) | ✅ **Realizado** (`GET /clientes/:id/consolidado` + tabs cuentas/facturas/cobros/cotizaciones). Falta tab de trabajadores por proyecto |
| 6.8 | Finanzas → facturas/CxC/pagos + utilidad por proyecto | `/finanzas` ↔ `/proyectos` ↔ `/clientes` | ✅ **Realizado** (facturas/cobranza/flujo-neto). Restan los desgloses = Fase 3 de FLUJO-PROGRESO-PROYECTOS |
| F1 | Sistema de notificaciones (modelo + API + eventos del ERP + centro en Topbar) | transversal (Topbar → `/reportes`, `/finanzas`, `/proveedores`…) | ⏳ Pendiente (no existe modelo `notificaciones` en schema — verificado; hoy el centro es front-only en memoria) |
| F2 | Loaders/skeletons estandarizados en todas las vistas | transversal (todas las páginas) | ✅ **Realizado 2026-11-07** (ver §11 F2): `RefreshOverlay` nuevo + 11 overlays consolidados, cargas a pulmón → `LoadingState`/`Skeleton`, paginación siempre visible, KPIs con spinner en el valor, botones con `skeleton`, banners post-carga animados, regla dura en `AGENTS.md` |
| F3 | Validación consistente en todos los formularios | transversal (todos los modales/create) | ✅ **Realizado 2026-11-07** SOLO en Comercial + Operaciones (ver §11 F3): helper `mensajeErrorApi` en `lib/api.ts` aplicado en 50 toasts de 13 vistas; las demás vistas son de otro dev — el helper ya existe para cuando los toque (regla documentada en `AGENTS.md`) |
| F4 | Comprobación de flujos de datos Operaciones/Comercial (matriz vista → insumos) | `/operaciones`, `/reportes-campo`, `/criba`, `/inventario`… | ✅ **Análisis realizado 2026-11-07** (matriz completa en §11 F4: 6 cadenas al 100%, 14 gaps mapeados con su habilitador y tarea) |
| F5 | Config POS: horario de caja que gatee + categorías visibles | `/configuracion` → `/ventas` | ⏳ Pendiente (verificado: `aperturas_caja`/`cierres_caja` NO tienen campos de horario; el gate no existe hoy) |
| F6 | Seeds demo funcionales de todos los workflows | transversal | ✅ **Realizado 2026-11-08** (`seed-demo-workflows.ts` idempotente vía servicios oficiales con auditoría; + data fix `turno_cierre 23:00` que bloqueaba el POS; cobertura verificada por psql: venta/retiros/apertura reales, cotizaciones/bitácoras/nóminas con variedad ya existente) |

> **Regla general:** cada flujo se construye cuando el módulo destino está completo,
> para evitar acoplar a un destino que no existe. El orden sugerido original
> (P1 → P2 → P3 → P4 → P5 → P6) se cumplió en la primera mitad; el siguiente bloque
> natural es **P2 → P4 → P7** (partidas habilitan inventario y precios por medida),
> con **6.4 → 6.5** en paralelo. **P7** y **P4b** (venta POS descuenta inventario)
> pueden ejecutarse en paralelo con cualquiera. El bloque **F1–F6** (§11) es
> transversal y no bloquea a los flujos de dinero; se puede avanzar por piezas
> (sugerido: F5 y P4b van juntos — ambos tocan la `$transaction` de ventas).

---

## 8. Flujo completo de /cobranza — mapa de vistas relacionadas

> **Contexto:** /cobranza es la vista **central del ciclo de tesorería comercial**: gestiona
> los saldos de `cuentas_por_cobrar`, registra los cobros (`pagos`) y alimenta la caja.
> Esta sección documenta con qué vistas convive y cómo fluye la información, para
> ejecutar el backend de cobranza sin acoplar módulos equivocados.

### 8.1 El ciclo de la información

```
┌─────────────┐      ┌─────────────┐      ┌─────────────────────────┐
│ /cotizaciones│ ──►  │   /ventas    │ ──►  │     facturas (CFDI)     │
│ (apruebas)   │      │ (POS/crédito)│      │  tabla `facturas`       │
└─────────────┘      └─────────────┘      └───────────┬─────────────┘
                                                      │ crea la deuda
                                                      ▼
┌─────────────┐                              ┌─────────────────────────┐
│ /maquinaria │                              │  cuentas_por_cobrar     │ ◄──── /cobranza
│ (flota/gps/ │ ────►  bitacoras_renta_      │  (tabla central: monto, │      (la vista que
│  renta)     │          diaria              │   pagado, vencimiento,  │       gestiona todo)
└─────────────┘                              │   estado)               │
                                             └───────────┬─────────────┘
                                                         │ Registrar cobro
                                                         ▼
┌─────────────┐                              ┌─────────────────────────┐
│  /finanzas  │ ◄─────────────  pagos         │  /reportes + /documentos│
│ (ingresos,  │   (tabla `pagos`: monto,      │  (CFDI timbrado,        │
│  caja)      │    método, referencia)        │   comprobante CSV/PDF)  │
└─────────────┘                              └─────────────────────────┘
```

### 8.2 Clasificación por módulos del sidebar

**Módulo COMERCIAL — concentra TODO el ciclo de cobranza:**

| Vista | Rol en el ciclo |
|-------|-----------------|
| `/clientes` | El deudor (toda CxC apunta a `cliente_id`) |
| `/cotizaciones` | Origen: se aprueba → se convierte en venta |
| `/ventas` (+ `/ventas/corte`) | Genera la factura; venta a crédito → nace la CxC |
| `/finanzas` | Destino: el cobro entra como ingreso/caja |
| `/proveedores` | Espejo inverso: cuentas por pagar |
| `/cobranza` | La vista central del ciclo |

**Módulo OPERACIONES — no gestiona cobranza, solo aporta contexto:**

| Vista | Relación indirecta |
|-------|--------------------|
| `/proyectos` | Las obras/contratos que después se facturan y se cobran (la vista de cobranza muestra `obra`) |
| `/inventario` | Los materiales vendidos = el costo detrás de cada factura |
| `/operaciones`, `/reportes-campo`, `/criba`, `/incidentes` | Producción diaria — sin vínculo directo con CxC |

**Grupo MAQUINARIA — origen del cargo por renta (ni Operaciones ni Comercial):**

| Vista | Relación |
|-------|----------|
| `/maquinaria`, `/horometro`, `/mantenimiento`, `/combustible`, `/gps` | Las `bitacoras_renta_diaria` (cerradas) generan `cuentas_por_cobrar` vía `bitacora_id` — es el único origen del ciclo que no nace en Comercial |

**Grupo SISTEMA — consumidores/registro:**

| Vista | Relación |
|-------|----------|
| `/reportes` | Reportes de cartera, antigüedad de saldos (export CSV del tab activo) |
| `/documentos` | CFDI de la factura/cobro (`facturas.xml_url / pdf_url`) |
| `/configuracion` | Días de crédito, métodos de pago, condiciones |

### 8.3 Flujo típico completo (crédito a cliente)

1. `/cotizaciones` → se aprueba y se convierte en orden/venta.
2. `/ventas` registra la venta a crédito → **factura** timbrada (CFDI).
3. La factura crea `cuentas_por_cobrar` (monto = total, vencimiento = días de crédito).
4. `/cobranza` la muestra con saldo y situación (al corriente / atraso leve / grave).
5. El cliente paga → `/cobranza` → "Registrar cobro" → crea `pagos` y liquida `monto_pagado` (estado → SALDADO).
6. `/finanzas` refleja el ingreso del cobro.
7. `/documentos` guarda el comprobante/CFDI; `/reportes` lo agrega a cartera.

### 8.4 Estado actual vs. pendiente (actualizado 2026-11-04)

- **Con API ya (todo el ciclo):** `/clientes` (+ consolidado), `/ventas` (POS con
  idempotencia y caja), `/finanzas`, `/proveedores`, `/facturas` (CRUD + export),
  `/cobranza` (real, consume API), `/bitacoras-renta` y `/reportes-campo` (facturables).
- **✅ Los eslabones del ciclo ya construidos:** `cotización → factura → CxC`
  (`facturar()` transaccional), `bitácora-renta/reportes → factura → CxC`,
  `/cobranza → pagos` (cobro atómico + reversión) y el cierre en `/finanzas`
  (transacción INGRESO en la caja).
- **Eslabones que siguen faltantes:**
  1. **`ventas a crédito` → factura → `cuentas_por_cobrar`** (C3): la venta POS aún no
     dispara factura ni CxC (verificado: el service de ventas no crea esas entidades).
  2. **§9:** asignación vista → cuenta bancaria y conciliación asistida (nada implementado).
  3. **§10:** `fecha_vencimiento` en CxP — la columna YA existe (schema `cuentas_por_`
     `pagar.fecha_vencimiento`), pero ningún service la propaga desde la orden de
     compra; falta UI en /proveedores y alertas "por vencer".

---

## 9. Futuro — Asignación vista → cuenta bancaria (conciliación automática)

> **Estado:** ⏳ Pendiente — ninguna parte implementada. Surge del hueco real detectado en
> el tab Conciliación de `/finanzas`: las `transacciones` (contabilidad general, creadas
> automáticamente por cobros, reversiones y abonos) **no pertenecen a ninguna cuenta
> bancaria**; el único puente banco ↔ contabilidad es la conciliación manual
> (`movimientos_bancarios.transaccion_id` solo se llena al conciliar).

**Idea del cliente:** en `/configuracion` se añadirá una asignación **1:1 vista → cuenta
bancaria** (solo para vistas que manejan dinero: `/cobranza`, `/proveedores`, `/ventas`,
`/finanzas`). Al registrar una operación en esa vista, el ERP generará
**automáticamente el `movimiento_bancario`** en la cuenta asignada, de modo que el tab
Conciliación solo necesite la **carga del CSV del banco** para confirmar.

> **Decisión (2026-11-06): la asignación queda POR VISTA, no por concepto.** No se
> separan cuentas por concepto (nómina, inventario, combustible, etc.) — una vista
> (monto de dinero) ↔ una cuenta bancaria. Esto simplifica el flujo: la vista que
> origina el movimiento ya sabe a qué cuenta cae, sin capa intermedia de mapeo
> concepto→cuenta. Si a futuro se ocupa granularidad, `config_cuentas_origen` ya lo
> contempla vía `origen_id` (p.ej. por cliente/proveedor), sin cambiar el diseño base.

**Diseño propuesto (ajuste del arquitecto):**

1. **Schema:** modelo nuevo `config_cuentas_origen` con `(origen, origen_id, cuenta_id)`
   — permite asignación por vista y, a futuro, por cliente/proveedor (evita el cuello de
   botella del 1:1 rígido por vista).
2. **/configuracion:** tabla de asignación vista → cuenta (select de cuenta bancaria por
   vista que maneja dinero) + **selector de cuenta en el modal** de cobro/abono (permite
   "dejar caer" un movimiento en otra cuenta puntual; la config solo prellena).
3. **Backend:** en el `$transaction` que crea la `transacciones` (cobro, reversión,
   abono), crear también el `movimientos_bancarios` con la cuenta asignada y
   `conciliado = false` (movimiento **esperado**, no conciliado).
4. **Conciliación asistida:** al cargar el CSV, los movimientos esperados que coinciden
   1:1 (misma cuenta, fecha, monto) con una línea del extracto se **auto-concilian**; el
   resto queda pendiente como hoy.

**Ventaja:** quita la duda "¿a qué cuenta cayó este dinero?" y reduce la conciliación a
confirmar el extracto. **Riesgo controlado:** los movimientos automáticos son
"esperados" (no conciliados) hasta que el CSV del banco los confirme — nunca se cuadra
contra datos que el banco aún no reporta.

---

## 10. Futuro — Fecha de vencimiento en cuentas por pagar (CxP)

**ACTUALIZACIÓN 2026-11-04:** la columna `cuentas_por_pagar.fecha_vencimiento` ya existe
en el schema (Quedó del dump original), PERO sigue sin usarse: ningún service de
proveedores/ordenes-compra la escribe, así que el flujo neto sigue clasificando todas
las CxP en "Sin vencimiento". El pendiente real es: campo en la OC → propagación al
crear la CxP → mostrarla en estado de cuenta/ledger → (opcional) alertas por vencer.

**Contexto (hallazgo real en BD, sep 2026):** el Flujo Neto Proyectado de /finanzas
clasifica por ventanas (Vencido, 0-30, 31-60, 61-90, +90, Sin vencimiento) usando
`fecha_vencimiento` de `cuentas_por_cobrar` y `cuentas_por_pagar`. En la operación
actual, **todas** las CxP tienen `fecha_vencimiento = NULL`, por lo que el total "Por
pagar" (ej. $791,743.00) cae completo en "Sin vencimiento" y el desglose temporal
muestra $0 en todas las ventanas. El de cobros sí funciona (la CxC nace con vencimiento
desde el cobro).

**Objetivo:**

1. **Coherencia del Flujo Neto Proyectado:** que las CxP se distribuyan en las ventanas
   reales (Vencido, 0-30, 31-60, 61-90, +90) y "Sin vencimiento" quede solo para lo que
   genuinamente no tiene fecha comprometida.
2. **Pagos en tiempo y forma a proveedores:** con la fecha de vencimiento registrada, el
   sistema puede alertar con anticipación (KPIs/tabla "Por vencer en 7/15/30 días") y
   priorizar pagos antes de que generen retrasos — en lugar de pagar reaccionando.

**Diseño propuesto:**

1. **Schema/UI:** el campo a nivel `orden de compra` no existe; agregarlo y propagarlo a
   `cuentas_por_pagar.fecha_vencimiento` (columna ya existente en schema) al crear la CxP
   (misma fecha o un plazo configurable por proveedor, p.ej. neto 15/30/60). Sin backfill
   necesario si se llena con la `fecha` de la OC + término para el flujo proyectado.
2. **UI /proveedores:** campo "Fecha de vencimiento" en el modal de orden de compra;
   mostrarla en el estado de cuenta y en el ledger por proveedor.
3. **/finanzas:** una vez haya fechas, el flujo proyectado por ventanas de "Por pagar"
   usa la misma lógica que "Por cobrar"; las CxP sin fecha quedan solo en "Sin
   vencimiento" (y se pueden marcar como dato incompleto).
4. **Opcional (siguiente iteración):** alertas "A vencer en N días" y ordenamiento de
   prioridad de pago por fecha de vencimiento, conectado con el módulo de finanzas y
   tesorería.

**Nota:** el KPI "Por pagar" de /proveedores ya se corrigió para excluir órdenes
CANCELADAS (commit de pulido visual pre-PR, `proveedores.service.ts`), con lo que
cuadra con el flujo neto. Esta sección cubre únicamente la granularidad temporal.

---

## 11. Plataforma, POS y experiencia (F1–F6)

> **Nuevo bloque (2026-11-06):** trabajos transversales que no acoplan módulos de
> negocio entre sí, pero que unifican calidad de plataforma y operaciones del POS.
> Lo que ya está al 100% (verificado en código, no asumido): el **ciclo de vida del
> dinero** completo (cotización→factura→CxC→cobro, bitácoras-renta y reportes
> facturables, OC→recepción→CxP→abono→egreso) y las **órdenes de compra que al
> registrarse aplican entrada de stock en inventario** (Fase 7, transaccional con
> auditoría). Fuente de verdad de flujos implementados: `workflow/README.md`.

### F1 — Sistema de notificaciones funcional

**Estado:** ⏳ Pendiente. Hoy `NotificationProvider`/`NotificationContext` (front) es
**solo frontend, en memoria**: no hay modelo `notificaciones` en schema (verificado),
ni API, ni persistencia — al recargar la página se pierde todo.

**Objetivo:** notificaciones reales, emitidas por los eventos del ERP, persistentes y
por audiencia.

**Cómo se aplicará:**
1. **Schema:** modelo `notificaciones` (`id`, `tipo`, `titulo`, `cuerpo`, `referencia_tipo`,
   `referencia_id`, `audiencia_rol_id?` o `destinatario_user_id?`, `leido_en?`, +
   `creado_en/creado_por` estándar). Sin fanout usuario-por-usuario: una fila por
   evento con audiencia por rol (las consultas front filtran por el rol del usuario,
   igual que `role_vistas`).
2. **API:** módulo `notificaciones` con los 4 checkpoints (JWT + blacklist + audit
   SUCCESS en mutaciones + FAIL en errores): `GET /notificaciones` (paginado, leído de
   tabla), `POST /notificaciones` (sistema interno), `PATCH /notificaciones/:id/leer`,
   `PATCH /notificaciones/leer-todas`. Consultas NO tienen DELETE (se expiran por job
   posterior, fuera de alcance inicial).
3. **Emisión desde eventos existentes** (en el service que ya maneja el evento, misma
   `$transaction` donde cabe, o justo después con best-effort que no revierte el
   evento de negocio): CxC por vencer 7 días, OC recibida, reporte-campo asignado,
   cierre de caja PENDIENTE de aprobación, nómina pagada, incidente CRITICA, venta con
   idempotencia_colision (falla operativa). Empezar con 3–4 eventos de dinero.
4. **Frontend:** el centro del Topbar ya existe — coserlo al API real (badge con
   contador de no leídas + lista paginada + botón "marcar todas"), reemplazando el
   mock en memoria; auto-refresco (polling simple, p.ej. cada 60s, sin websockets).
5. **RBAC:** audiencia por rol vía `role_vistas` (una notificación de CxC solo la ven
   roles con `/finanzas` o `/cobranza` visible).
6. **Tests:** unit (service de emisión por evento) + integración real (emitir evento →
   fila en `notificaciones` con audiencia correcta; marcar leído audita SUCCESS).

### F2 — Componentes de loader/skeleton estandarizados

**Estado:** ✅ **REALIZADO (2026-11-07).** La primera impresión de toda vista es
skeleton (tablas → `DataTable.loading`), spinner en KPIs (`StatsCard.loading`),
botones con `skeleton`, refetches con `RefreshOverlay` (componente nuevo en ui,
documentado en `COMPONENTS.md`), banners/alertas post-carga con `fadeScaleIn`,
y la regla dura completa vive en `AGENTS.md` (Loaders/Skeletons, 7 puntos).
El delay de demo (`sleepDemo` 3s) se usó durante la demo y **se retiró el mismo
día** (helper `lib/demo-delay.ts` eliminado).

**Cómo se aplicará:**
1. **Auditoría:** grep de `Loader2`, `animate-spin`, `nulo estado de carga` en
   `(dashboard)/**/page.tsx` → lista de vistas que no cargan con
   `LoadingState`/`Skeleton`.
2. **Regla:** toda vista con datos de API muestra `<LoadingState>` (o
   `<Skeleton>`/`<SkeletonText>` en tabs/detalles) mientras carga y `<EmptyState>`
   cuando no hay datos — reutilizar lo que existe, no crear nada nuevo.
3. **Alcance:** solo changear páginas para usar lo existente; prohibido crear un
   "nuevo sistema de loading" paralelo.

### F3 — Validación consistente en todos los formularios existentes

**Estado (actualizado 2026-11-07): ✅ REALIZADO en Comercial + Operaciones** quedarías las
demás vistas partea otro dev (el hever yá enta disponible en `lib/api.ts` para
cuando las toque; regla dura documentada en `AGENTS.md` — "Toasts de error").

**Qué se hizo:**
1. **Helper único `mensajeErrorApi(res.error, fallback)`** en `lib/api.ts`:
   prioridad `details[].map(String).join(' · ')` → `error.message` → fallback de
   la vista (seguro con `details: unknown[]`).
2. **50 toasts reescritos en 13 vistas** (operaciones 3, inventario 4, proyectos
   4, criba 3, reportes 7, clientes 5, cotizaciones 3 — incluido el fallback con
   template literal —, facturas 6, cobranza 1, finanzas 3, proveedores 7 — los 2
   manuales details-join migrados —, ventas 2, cierres 2); `/ventas/corte` no
   tiene ramas de fallo de API.
3. Regla única en `AGENTS.md`: prohibido `res.error?.message || ...` a mano.

**Original (para referencia):** el backend ya cumple su parte: ValidationPipe
global con `whitelist + forbidNonWhitelisted` responde 422 con `details[]`
(`message = 'Error de validación'`). El problema era el frontend: solo
/proveedores mostraba los `details`; el resto mostraba error genérico o nada.

**Cómo se aplicará:**
1. **Auditoría:** inventario de todos los `FormModal` presentes en
   `(dashboard)/**/page.tsx` (y modales de `components/*`) con su handler de error.
2. **Regla base (una sola):** en el catch del submit, si `error.details?.length`
   → toast con `error.details.join(' · ')`; si no, `error.message`. Mejor en un solo
   helper compartido (p.ej. `mostrarErrorApi(err)` en `lib/`) que copiar el patrón 30
   veces — si existe un toast con ese comportamiento ya, usar ese.
3. **Validación client-side mínima:** required/formatos numéricos integral solo donde
   ya hay validación en otros modales del mismo estándar (no inventar librería de
   forms; nada de react-hook-form nuevo).
4. **Tests:** del helper compartido (unit front simple si aplica).

### F4 — Comprobación de flujos de datos: qué vista de Operaciones/Comercial necesita a cuál

**Estado (2026-11-07): ✅ ANÁLISIS REALIZADO** — la matriz siguiente es la salida
del audit (estática, verificada contra `schema.prisma`, la BD local y los
workflows). **Regla de uso: una vista del ERP se considera "al 100%" solo cuando
TODOS sus insumos tienen fila con ✅ en esta matriz.** Los gaps remiten a la
tarea del índice que los habilita.

#### Lo que YA está al 100% (cadena cierra end-to-end)

| Flujo | Cadena completa | Ref |
|---|---|---|
| Ciclo comercial del dinero | cotización → factura → CxC → cobro → transacción INGRESO (`$transaction` + folio anti-colisión) | workflows 01–03 |
| Renta facturable | bitácora-renta cerrada → factura → CxC (firma residente gatea) | workflow 02 |
| Reportes facturables | reporte-campo (máquina de estados) → factura → CxC | PR #15 |
| Compras → bodega | OC con líneas → recepción → **stock + movimientos en inventario** → CxP → abono → egreso | Fase 7 |
| Cobranza → tesorería | cobro atómico + reversión compensatoria | workflow 03 |
| Consolidado de cliente | `/clientes` tabs cotizaciones/facturas/CxC/cobros | restan tab trabajadores×proyecto (6.7) |

#### Matriz de gaps (vista → insumo → estado → habilitador)

**OPERACIONES**

| Vista | Insumo → Fuente | Estado | Habilitador |
|---|---|---|---|
| `/operaciones` | obras activas ← tabla `obras` | 🔴 BD con 3 obras; 4 proyectos EN_PROCESO sin obra | seed 4 obras (pendiente "go") + flujo proyecto→obra (Tier 2 #11) |
| `/operaciones` | catálogo de máquinas sin fallas ← `maquinas` | ✅ 100% | — |
| `/inventario` | salidas ← venta POS | ⏳ P4b (ventas_items ya cruza) | Tier 1 #7 |
| `/inventario` | entradas ← producción criba | ⏳ 6.5 | Tier 3 |
| `/criba` | FK `maquina_id`/`proyecto_id` | ⏳ 6.4 (solo FK trabajadores) | Tier 2 #13 |
| `/proyectos` | gastos desglosados | ⏳ Fase 3 FLUJO-PROGRESO | Tier 3 (6.8) |
| `/proyectos` | modal Ver Detalle | 🔴 mock | Tier 2 (6.6, tras flujo obra) |
| `/reportes` | incidente resuelto → deriva mantenimiento/reporte | ⏳ 6.2 | Tier 2 #12 |
| `/reportes` | progreso ← metas P8 / transacciones por costo | ⏳ 6.3 | Tier 1 #8 |

**COMERCIAL**

| Vista | Insumo → Fuente | Estado | Habilitador |
|---|---|---|---|
| `/cotizaciones` | partidas `cotizacion_items` | ⏳ P2 | Tier 3 |
| `/cotizaciones` | acción crear proyecto | ⏳ P3 | Tier 3 |
| `/cotizaciones` | UI: sin botones fantasma | ✅ 2026-11-07 — Aceptar/Rechazar solo en PENDIENTE (antes deshabilitados flotando) | — |
| `/ventas` | catálogo ← inventario + `articulos_precio` | ✅ (editor de medida = P7) | Tier 3 |
| `/ventas` | descuento → stock | ⏳ P4b | Tier 1 #7 |
| `/ventas` | venta a crédito → CxC | 🔴 C3 (service de ventas no crea entidad) | Tier 3 |
| `/ventas` | config: horario gate + categorías | 🔴 sin schema | F5 §11 |
| `/cobranza` | CxC de los 3 orígenes reales | ✅ (POS-crédito falta = C3) | = C3 |
| `/facturas` | fuentes facturadas | ✅ | — |
| `/finanzas` | CxP con `fecha_vencimiento` (flujo proyectado) | ⏳ §10 (columna sin uso) | Tier 2 #10 |
| `/finanzas` | egresos por puntero polimórfico | ⏳ diseño (FK vs puntero, 6.3) | Tier 3 |
| `/proveedores` | vencimiento OC → `cuentas_por_pagar` | ⏳ §10 | Tier 2 #10 |
| `/clientes` | tab trabajadores×proyecto | ⏳ 6.7 | Tier 2 #14 |

> **Deuda transversal conocida (fuera del par de módulos, referida por §6):**
> `dashboard`, `gps`, `documentos`, `MachineCard`, `ProjectCard`,
> `ProjectDetailsModal` siguen consumiendo mock de `@/lib/data`.

**Estado:** ⏳ Pendiente de auditoría formal. Objetivo: matriz **vista → insumos que
necesita para funcionar al 100%**, detectando vistas que aún comen mock o que le
faltan su insumo de otra vista.

**Lo que YA está al 100% (verificado):**
- Ciclo de vida del dinero completo: cotización → factura → CxC → cobro → ingresos;
  bitácoras-renta y reportes-campo facturables → CxC.
- Proveedores/OC: OC con líneas y recepción → al aplicarse la entrada, registra o
  actualiza stock en inventario (Fase 7, transaccional + audit FAIL/SUCCESS).

**Cómo se aplicará:**
1. Reporte por vista (desde §6 de este doc + `workflow/README.md`): columnas
   `vista | insumo que consume | fuente | estado del insumo (real/mock/faltante)`.
2. Sospechosos conocidos (de la auditoría §6): `dashboard`, `gps`, `documentos`,
   `ProjectDetailsModal`, `MachineCard`, `ProjectCard` siguen en mock de `@/lib/data`.
3. Salida esperada: la matriz en este mismo doc (o doc aparte en `docs-planes/`)
   + decisión por gap: "corregir insumo X" / "ese mock sobra" / "pendiente a flujo Y".

### F5 — Configuración del POS: horario de caja que gatee + categorías visibles

**Estado:** ⏳ Pendiente. **Verificado en schema:** `aperturas_caja`/`cierres_caja` NO
tienen ningún campo de horario de apertura/cierre — hoy la caja se abre y cierra a
cualquier hora (el único gate es unique(fecha): una apertura y un cierre por día).
Tampoco existe configuración de qué categorías de producto muestra el catálogo del POS.

**F5a — Horario de apertura/cierre que gatee de verdad:**
1. **Schema:** campos de horario en la configuración del POS (tabla de settings del
   POS: `pos_hora_apertura`, `pos_hora_cierre`, editables desde `/configuracion` con
   un formulario, acceso admin).
2. **Backend `ventas.service.ts`:** validar contra ese horario en:
   - apertura de caja (`aperturas_caja`) — si `abierta_en` está fuera del horario →
     `FUERA_DE_HORARIO` (400, audita FAIL).
   - registrar venta — venta fuera de horario → `FUERA_DE_HORARIO` (con override
     opcional para admin, ya que existe `autorizado_por` en ventas).
   - cierre de caja — permitir cierre aunque sea última hora; cierre "fuera de
     horario" se registra con flag `fuera_horario` para el aprobador.
3. **TZ America/Mexico_City:** la comparación de hora contra el horario configurado
   usa la TZ del main (`America/Mexico_City`) — cuidado con `@db.Date` + Timestamptz
   (la fecha de caja cambia a medianoche local, no UTC).
4. **Tests:** unit + integración (vender/abrir/cerrar dentro y fuera de horario con
   fechas simuladas; edge: cambia de día entre apertura y cierre).

**F5b — Categorías visibles en el POS (por configuración):**
1. **Schema/Config:** `pos_categorias_visibles` (lista de categorías de
   `articulos_inventario.categoria`) editable desde `/configuracion` con formulario.
   **Por ahora solo Materiales de Construcción** — pero editable, sin hardcode.
2. **Backend:** el catálogo que entrega `/ventas` (o el catálogo de artículos vendibles)
   filtra por esa lista; si no hay config, muestra todas (comportamiento actual).
3. **Frontend:** el POS consume el catálogo ya filtrado; `/configuracion` muestra un
   multiselect de categorías.
4. **Tests:** unit de filtro + integración con BD real (artículo fuera de categoría no
   aparece en catálogo POS).

### F6 — Seeds demo funcionales de todos los workflows

**Estado (2026-11-08): ✅ REALIZADO — `apps/api/scripts/seed-demo-workflows.ts`
idempotente, corrido contra la BD local con auditoría real:**
apertura (fondo 5,000) + venta POS con pagos mixtos 60/40 sobre catálogo real
(folio S17941004220715557, total 1,540) + retiro `[DEMO]` 350; guard
anti-producción (`NODE_ENV=production` requiere `DEMO_SEED=permiso`).
Hallazgo de la corrida: `configuracion_sistema.turno_cierre = '00:00'` dejaba el
POS bloqueado SIEMPRE (se interpreta nocturno) — data fix aplicado: `'23:00'`
(pendiente post-demo: soportar cierre medianoche en el backend). Los demás
workflows ya tenían variedad (verificada por psql).

**Cómo se aplicará:**
1. **`apps/api/scripts/seed-demo-workflows.ts`:** poblar datos demo que ejerciten
   **workflows completos** end-to-end, con `idempotencia` (poder re-correr sin
   duplicar — upserts por legible `demo-*`/códigos únicos), entre ellos:
   - cliente + cotización ACEPTADA → factura → CxC → pago parcial (+ reversión demo).
   - proveedor + OC con líneas → recepción → CxP → abono → egreso.
   - bitácora-renta cerrada → facturada → CxC.
   - reporte-campo en los 6 estados de la máquina.
   - inventario: artículo con precios por medida (`articulos_precio`) + movimientos
     ENTRADA/SALIDA.
   - POS: venta de hoy + apertura + retiro (+ cierre si aplica al día).
   - nómina: periodo + trabajadores + asistencia.
2. **Límite duro: NO correr en producción** — el script imprime advertencia y falla si
   detecta hostname/productiva (verificable por `NODE_ENV` o variable de entorno
   `DEMO_SEED=permiso-explicito`).
3. **Documentación:** documentar el uso (dev-only) en LEEME/README de scripts.

**Qué NO es este bloque:** F1–F6 no tocan el ciclo de dinero ya verificado al 100% —
lo usan como insumo (eventos de negocio para F1, flows a sembrar en F6), sin
acoplar módulos entre sí.
