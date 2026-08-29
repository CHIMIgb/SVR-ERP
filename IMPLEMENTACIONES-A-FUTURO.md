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
