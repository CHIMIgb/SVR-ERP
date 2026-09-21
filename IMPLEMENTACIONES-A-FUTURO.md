# IMPLEMENTACIONES A FUTURO — Hoja de ruta de integración del ERP

> **Propósito:** Documentar los flujos de negocio pendientes y cómo los módulos (con
> foco en **cotizaciones** y el resto de las vistas CRUD) interactuarán entre sí. Este
> documento NO se aplica hoy: describe la hoja de ruta de integración que se ejecutará
> **cuando los módulos destino estén terminados**.
>
> **Estado actual (fase 1):** `/cotizaciones` funciona como **CRUD aislado** sobre
> PostgreSQL (listado, detalle, crear, editar, aceptar/rechazar con motivo, filtros,
> búsqueda, paginación, stats, RBAC y auditoría). Está bien construida técnicamente,
> pero **aún no genera ni consume nada aguas abajo** en el flujo de negocio.

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

## 1. Resumen ejecutivo

Hoy, una cotización es una **bolsa de datos suelta**: se crea → se acepta/rechaza → **y
ahí muere**. No dispara ventas, facturas, cuentas por cobrar, proyectos ni movimientos
de inventario. El objetivo de esta hoja de ruta es conectar `cotizaciones` con la
**cadena de valor** del ERP: **cliente → cotización → venta/factura → cuenta por cobrar
→ pago**, y de forma secundaria **→ proyecto/obra** e **→ inventario**.

El problema de fondo es de **modelo de datos**: la tabla `cotizaciones` solo se
relaciona con `clientes` (y con usuarios de auditoría / `vendedor_id`). No tiene
relación con `facturas`, `cuentas_por_cobrar`, `pagos`, `proyectos`, `articulos_`
`inventario`, `movimientos_inventario` ni `transacciones`. Además **no existe un
modelo `ventas`/`pedidos`** en el schema.

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

### 2.2 Integraciones que NO existen (por eso vive aislada)

| Relación | Modelo destino | Estado |
|----------|----------------|--------|
| Cotización → línea/partida (`cotizacion_items`) | (no existe el modelo) | ❌ Falta |
| Cotización → factura / factura_conceptos | `facturas` | ❌ Falta |
| Cotización → cuenta por cobrar | `cuentas_por_cobrar` | ❌ Falta |
| Cotización → pago | `pagos` | ❌ Falta |
| Cotización → proyecto / obra | `proyectos` (no hay `proyecto_id`) | ❌ Falta |
| Cotización → venta / pedido | (no existe modelo `ventas`) | ❌ Falta modelo |
| Cotización → artículo de inventario | `articulos_inventario` | ❌ Falta (vía partidas) |

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

**Hoy:** la transición `Pendiente → Aceptada` solo cambia un string `estado`. No dispara
nada.

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

**Cómo se aplicará:**
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

**Hoy:** los `pagos` (finanzas/cobranza) son independientes; no hay vínculo con la CxC
que nacería de la cotización.

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

## 4. Diagrama de la cadena de valor objetivo

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
> `schema.prisma`, frontend vía `apps/web/src/lib/api.ts` y cada `page.tsx`). Mayoría de
> las vistas ya consumen su CRUD desde PostgreSQL a través de `apps/web/src/lib/api.ts`
> (Ninguna importa `@/lib/data` en `page.tsx`, salvo `ProjectDetailsModal.tsx` que aún
> filtra mock). Abajo quedan los **cruce de negocio** y los **gaps de modelo** por
> dominio. Se ejecutarán cuando cada módulo esté terminado.

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

- **Hoy:** vistas de operaciones consumen su CRUD por API. El cruce de cobranza ya fue
  mapeado: **`bitacoras_renta_diaria` → `cuentas_por_cobrar[]` + `firmas_cliente`**.
- **Flujo pendiente:** al **cerrar/confirmar** una bitácora de renta, generar (o
  actualizar) la **`cuentas_por_cobrar`** del cliente y enlazar la **firma del cliente**
  (`firmas_cliente`) en la misma `$transaction`.
- **Gap de modelo:** verificar que `bitacoras_operacion` tenga el cruce a `maquinas`,
  `trabajadores` y `proyectos` (despachos_maquina ya cruza máquina+proyecto+operador).

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

- **Hoy:** CRUD por API; `ProjectDetailsModal.tsx` aún filtra mock (único residuo de
  `@/lib/data`) — **por migrar a API real**.
- **Flujo pendiente:**
  - **Proyecto → Obra(s):** `proyectos` tiene `obras[]`; cerrar el flujo de creación de
    obra desde un proyecto.
  - **Proyecto → Despacho de máquina:** `despachos_maquina` cruza `maquina_id +
    proyecto_id + operador_id`; alimentar el detalle del proyecto con las máquinas
    despachadas.
  - **Proyecto → Cotización (P3):** crear proyecto desde cotización aceptada.
  - **Avance/estado:** `proyectos.progreso` deriva de hitos/obras/reportes-campo.

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

- **Hoy:** CRUD por API; `transacciones` no tiene FK a proyectos/facturas.
- **Flujo pendiente:**
  - Endpoints de **facturas, cuentas_por_cobrar y pagos** (aún por construir en finanzas/
    cobranza) para sostener P1/P5.
  - Ligar egresos a proyectos vía `transacciones.entidad_id` (= `proyecto.id`) o FK
    explícita.
  - Dashboard financiero que sume **ingresos** (pagos/CxC) vs **egresos** (transacciones)
    y muestre **utilidad por proyecto**.
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
| P1 | Aceptar cot. → Factura + Cuenta por Cobrar | `/cotizaciones` → `/finanzas` → `/clientes` | ⏳ Pendiente (cuando estén finanzas/cobranza) |
| P2 | Partidas de cotización (`cotizacion_items`) | `/cotizaciones` (editor interno) | ⏳ Pendiente |
| P3 | Cotización ↔ Proyecto/obra | `/cotizaciones` → `/proyectos` → `/operaciones` | ⏳ Pendiente (cuando estén operaciones/proyectos) |
| P4 | Bajada de inventario por líneas | `/cotizaciones` → `/inventario` | ⏳ Pendiente (cuando esté inventario) |
| P5 | Pagos → abono a la CxC | `/finanzas`/cobranza → `/clientes` | ⏳ Pendiente (cuando esté cobranza) |
| P6 | Vendedor real + catálogos | `/cotizaciones` → `/trabajadores` | ⏳ Pendiente |
| P7 | Edición de precios por medida de venta (POS ↔ Inventario) | `/inventario` ↔ `/ventas` | ⏳ Pendiente (hoy bloqueado; requiere sincronización medida base ↔ `precio_unitario`) |
| 6.1 | Bitácora renta cerrada → CxC + firma | `/operaciones` → `/finanzas` → `/clientes` | ⏳ Pendiente |
| 6.2 | Incidente resuelto → mantenimiento / reporte campo | `/incidentes` → `/mantenimiento` / `/reportes-campo` | ⏳ Pendiente |
| 6.3 | Reporte campo → progreso proyecto + transacción | `/reportes-campo` → `/proyectos` → `/finanzas` | ⏳ Pendiente |
| 6.4 | Criba → máquina/obra + producción → inventario | `/criba` → `/maquinaria` → `/inventario` | ⏳ Pendiente (gap: `registros_criba` sin FK a máquina/obra) |
| 6.5 | Inventario → entradas criba / salidas cotización | `/inventario` ↔ `/criba` ↔ `/cotizaciones` | ⏳ Pendiente |
| 6.6 | Proyecto → obras/despachos; `ProjectDetailsModal` mock | `/proyectos` ↔ `/operaciones` ↔ `/maquinaria` | ⏳ Pendiente (migrar modal a API) |
| 6.7 | Cliente → tabs consolidados | `/clientes` → (todos los tab) | ⏳ Pendiente |
| 6.8 | Finanzas → facturas/CxC/pagos + utilidad por proyecto | `/finanzas` ↔ `/proyectos` ↔ `/clientes` | ⏳ Pendiente (endpoints de cobranza aún por construir) |

> **Regla general:** cada uno de estos flujos se construirá **cuando el módulo destino
> (finanzas, proyectos, inventario, operaciones, cobranza) esté completo**, para evitar
> acoplar a un destino que aún no existe. Hito previo: **migrar `ProjectDetailsModal.tsx`
> a API real** (único residuo de `@/lib/data` en páginas). El orden sugerido es
> **P1 → P2 → P3 → P4 → P5 → P6** y, en paralelo, los flujos 6.4 → 6.5 → 6.6 → 6.8 que
> comparten el cruce con `transacciones` y el inventario. **P7** (precios por medida de
> venta) puede ejecutarse en paralelo con cualquiera de ellos: es independiente del
> módulo destino y desbloquea el catálogo de precios del POS.

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

### 8.4 Estado actual vs. pendiente

- **Con API ya:** `/clientes`, `/ventas`, `/finanzas`, `/proveedores` (módulos NestJS).
- **En Prisma pero sin endpoints aún:** `facturas`, `pagos`, `cuentas_por_cobrar`, `bitacoras_renta_diaria`.
- **Eslabones faltantes del ciclo (backend de cobranza):**
  1. **`ventas` → factura → `cuentas_por_cobrar`** (creación automática al facturar; hoy la factura no dispara CxC).
  2. **`/cobranza` → `pagos`** (el "Registrar cobro" escribe en `pagos` y actualiza `cuentas_por_cobrar.monto_pagado/estado` en la misma transacción).
  3. **Cierre del círculo en `/finanzas`**: el cobro alimenta la caja como ingreso.
- **Frontend:** `/cobranza` reconstruida en **fase 1 (mock local)** con contrato DTO listo en `src/lib/api.ts` (`CuentaPorCobrarDTO`, `CobroDTO`, `VencimientoDTO`, `CobranzaStats`, `CobroCreateInput`) — listo para consumir el API real sin tocar la UI.

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

1. **Schema:** agregar `fecha_vencimiento` (nullable) a la orden de compra y propagarla a
   `cuentas_por_pagar` al crear la CxP (misma fecha o un plazo configurable por
   proveedor, p.ej. neto 15/30/60). Migración + backfill opcional desde `fecha` +
   término para datos existentes.
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
