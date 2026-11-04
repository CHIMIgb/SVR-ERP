# Plan de Implementación — Fase 6: Utilidad/ margen por proyecto (O4)

> Origen: `implementation_plan copy.md` §4 → O4 (costo de venta → utilidad por
> proyecto, flujo 6.8) y `implementation_plan_fase5.md` §5f (bloqueado por datos
> en Fase 5). Esta fase ejecuta O4 con la preparación de datos mínima posible
> dado el terreno real del schema.

## 0. Resumen

La Fase 5 cerró el ciclo de dinero (cobro, factura, conciliación). Lo que falta
es la **utilidad por proyecto**: cuánto se cobró por una obra contra cuánto
costó. O4 quedó bloqueado en Fase 5 por ausencia de datos de costo; esta fase
**crea la fuente de costo mínima** (último costo conocido por artículo) y
construye el reporte honesto de utilidad por proyecto.

| Sub-fase | Flujo | Migración | Costo | Valor |
|----------|-------|-----------|-------|-------|
| 6a | Preparación de datos: `costo_unitario` en artículos + `proyecto_id` en facturas + `articulo_id` en conceptos | Sí (chica) | Bajo | Habilita todo |
| 6b | `GET /proyectos/:id/utilidad` (ingresos − costos + completitud) | No | Medio | Alto (dirección) |
| 6c | Frontend: desglose de utilidad en `/proyectos` + costo en `/inventario` | No | Medio | Alto |
| 6d | (Opcional) Costo APU o promedio | — | ⏳ diferido | — |

Orden de ejecución: **6a → 6b → 6c** (cada una committeable por separado en
rama `fase6-utilidad`). 6d no se ejecuta salvo decisión explícita.

---

## 1. Decisiones de negocio adoptadas (validar antes de 6a)

1. **Fuente de costo = Opción A (último costo conocido, manual).**
   - Campo `articulos_inventario.costo_unitario` capturado al editar el artículo
     en `/inventario`. Es la única fuente que produce datos confiables con el
     terreno actual (no hay compras con partidas ni histórico de movimientos
     con costo).
   - Se aplica a líneas facturadas ligadas a artículo (`factura_conceptos.articulo_id`).
   - **No se implementan** costo promedio (opción B) ni costo APU (opción C) en
     el MVP; quedan como 6d diferido.
2. **Política de doble conteo (anti-duplicación):**
   - Si una factura tiene conceptos con costo conocido (`articulo_id` +
     artículo con `costo_unitario`) → su costo sale de `costosConceptos`.
   - `proyectos.gastado` (override administrativo existente) cubre **solo** lo
     que no pasa por facturación con costo (conceptos sin artículo, egresos no
     facturados, históricos).
   - Nunca se suman ambos para la misma línea.
3. **Honestidad del dato:** el API devuelve `completitud` (% de conceptos
   facturados con costo conocido) y el frontend muestra un callout informativo
   cuando < 100%. Un proyecto con históricos sin costo NO debe aparentar
   utilidad real.

---

## 2. Terreno real verificado (schema.prisma, previo al diseño)

| Componente | Estado | Implicación |
|---|---|---|
| `articulos_inventario` | Sin costo (solo `precio_unitario`) | Agregar `costo_unitario` |
| `facturas` | Sin `proyecto_id` | Agregar FK proyectos (SET NULL) |
| `factura_conceptos` | Sin `articulo_id` (`referencia_tipo/id` genérico) | Agregar FK artículos (SET NULL) |
| `cotizaciones` | Sin conceptos ni `proyecto_id` | Fuera del MVP |
| `ordenes_compra` | Sin partidas | No hay costo de compra por artículo |
| `movimientos_inventario` | Sin costo | No hay historial |
| `proyectos.ingreso_cobrado` / `gastado` | Existen (override manual) | Reutilizar `gastado` |
| `cuentas_por_cobrar.proyecto_id` | ✔ (Fase 4a) | Ingreso cobrado por proyecto |
| `reportes_campo.proyecto_id` | ✔ (Fase 5d) | Ingreso por campo facturado |
| `transacciones.entidad_tipo/id` | Genérico (flujo 6.8) | Egresos ligables a proyecto |
| `apu_items.costo_unitario` | Existe | 6d (opcional) |

---

## 3. Sub-fase 6a — Migración aditiva `fase6_utilidad_proyecto`

### Cambios en `schema.prisma`

```prisma
model articulos_inventario {
  // + costo_unitario: último costo conocido (Decimal?, captura manual en /inventario).
  costo_unitario      Decimal?            @db.Decimal(12, 2)
}

model facturas {
  // + proyecto_id: atar la factura a la obra (enriquece reporte por obra).
  proyecto_id         String?             @db.Uuid
  proyectos           proyectos?          @relation(fields: [proyecto_id], references: [id], onUpdate: NoAction, onDelete: SetNull)
  @@index([proyecto_id])
}

model factura_conceptos {
  // + articulo_id: ligar la línea facturada al artículo → costo derivable.
  articulo_id         String?             @db.Uuid
  articulos_inventario articulos_inventario? @relation(fields: [articulo_id], references: [id], onUpdate: NoAction, onDelete: SetNull)
  @@index([articulo_id])
}
```

- Sin enums nuevos, sin backfill (los datos históricos no tienen costo y NO se
  inventan — la `completitud` lo reporta).
- **Flujo manual de migración** (estándar del repo): `prisma migrate diff
  --from-config-datasource --to-schema prisma/schema.prisma --script` → extraer
  SOLO el cambio (excluir drift preexistente de `incidentes`) → `prisma db
  execute --file` → INSERT idempotente en `_prisma_migrations` → `prisma generate`.

### Impacto Backend
- `apps/api/prisma/schema.prisma` (3 modelos, 2 FKs, 2 índices).
- **Sin DTOs ni endpoints nuevos** (6a es solo esquema; los endpoints llegan en
  6b y el campo de costo se edita vía el CRUD de inventario existente — el
  `UpdateArticuloDto` de inventario se amplía en 6c).

### Testing
- No hay lógica nueva → se valida con `npx tsc --noEmit` y la suite existente
  de inventario/facturas sigue verde.

---

## 4. Sub-fase 6b — `GET /proyectos/:id/utilidad`

### Resumen del requerimiento
Reporte de utilidad por obra: ingresos cobrados/facturados del proyecto menos
costos conocidos, con margen porcentual y `completitud` para no engañar.

### Impacto Backend
- **Endpoint:** `GET /api/proyectos/:id/utilidad` — permiso
  `operaciones.proyectos.ver` (ya sembrado en RBAC).
- **Service `utilidad(id)`** — consultas paralelas (`Promise.all`):

```
ingresos:
  cobrado        = Σ monto_pagado  CxC activas con proyecto_id
  facturado      = Σ total         facturas activas con proyecto_id
  reportesCampo  = Σ monto_servicio reportes_campo estado FACTURADO con proyecto_id
  total
egresos:
  costosConceptos = Σ (cantidad × articulo.costo_unitario)
                   por factura_conceptos donde articulo_id IS NOT NULL y costo_unitario IS NOT NULL
  gastadoManual   = proyectos.gastado   (override; solo lo NO cubierto por costosConceptos)
  total = costosConceptos + gastadoManual
utilidad = totalIngresos − totalEgresos
margen % = (utilidad ÷ totalIngresos) × 100   (null si totalIngresos = 0)
completitud = conceptosConCosto ÷ conceptosFacturadosConArticulo (0–100)
```

- Proyecto inexistente o eliminado → `PROYECTO_NO_ENCONTRADO` (404) con el
  patrón `fallir()` del repo (audit FAIL).
- **No auditar consultas** (paridad con los GETs actuales del proyecto).
- **Shape del response (contrato frontend):**

```ts
interface UtilidadProyectoDTO {
  proyectoId: string;
  ingresos: { cobrado: number; facturado: number; reportesCampo: number; total: number };
  egresos: { costosConceptos: number; gastadoManual: number; total: number };
  utilidad: number;
  margenPorcentaje: number | null;
  completitud: number; // 0-100
}
```

### Impacto Frontend
- Definición del contrato en `apps/web/src/lib/api.ts` + `proyectosApi.utilidad(id)`.

### Testing
- **Unit (service + controller):**
  - proyecto sin datos → 0/0/0, `margenPorcentaje: null`, `completitud: 0`.
  - solo ingresos (CxC cobrada + reportes facturados), sin costos → utilidad = ingreso, completitud 0.
  - con `costosConceptos` (concepto con artículo y costo) → se descuenta; sin doble conteo con `gastado`.
  - conceptos sin artículo o sin costo → van a `gastadoManual`/completitud < 100.
  - margen negativo (costos > ingresos).
  - proyecto inexistente → 404 + audit FAIL `PROYECTO_NO_ENCONTRADO`.
- **Integration (`*.integration.spec.ts`):** crear proyecto + CxC con proyecto +
  cobro + factura con concepto ligado a artículo con costo → utilidad correcta
  en BD; limpieza FK-safe; `registro_auditoria` inmutable se deja.

---

## 5. Sub-fase 6c — Frontend (`/proyectos` + `/inventario`)

### Impacto Frontend
- **`/proyectos`:** en el detalle/modal del proyecto, bloque de utilidad:
  - StatsCards: **Utilidad** y **Margen %** (verde si ≥ 0, rojo si negativo).
  - Desglose: Ingresos (Cobrado / Facturado / Reportes de campo) y Egresos
    (Costo de conceptos / Gasto administrativo).
  - Callout ámbar si `completitud < 100`: "n% de los costos de este proyecto
    están capturados" (sin datos → no aparentar utilidad real).
  - Reemplaza el mock actual de `utilidadReal`/`margenUtilidadPorcentaje` en la
    vista de proyectos (patrón `/inventario`: fetch client-side + `initialLoading`).
- **`/inventario`:** campo `costo_unitario` en el FormModal de crear/editar
  artículo (+ en el DTO `ActualizarArticuloDto`/`CrearArticuloDto` del backend
  de inventario). El grid ya muestra `precio_unitario`; el costo es interno.
- Componentes UI existentes (`StatsCard`, `Badge`, `DataTable`, `FormModal`,
  `formatCurrency` de shared). Responsive obligatorio.
- Callouts: usar el patrón de aviso de los planes previos (bloque ámbar Tailwind).

### Testing
- Frontend sin test runner configurado aún → validar `npx tsc --noEmit` +
  eslint + build. (El estándar backend sigue siendo obligatorio.)

---

## 6. Estándares que aplican a TODAS las sub-fases

1. Endpoints con `JwtAuthGuard` + `PermissionsGuard` + `@RequirePermission`
   (permisos ya sembrados en RBAC; ninguno nuevo).
2. Auditoría de éxito en mutaciones; `fallir()` con `result: FAIL` +
   `error_code` antes de lanzar excepción. Consultas GET no auditan (paridad).
3. Soft deletes (`activo`/`eliminado_en`), nunca DELETE físico.
4. DTOs estrictos `class-validator` + swagger (en 6c, para inventario).
5. **Migraciones:** flujo manual documentado (`migrate diff` → `db execute` →
   INSERT en `_prisma_migrations` → `generate`); excluir el drift de
   `incidentes` de cualquier diff.
6. Tests obligatorios: unit (`*.spec.ts` cada método público + endpoint + DTOs)
   e integration real (`*.integration.spec.ts`, `npm run test:integration`,
   limpieza FK-safe).
7. Frontend: `npx tsc --noEmit` tras cada cambio; suite unit completa verde
   antes de commit.
8. No AGRANDAR el MVP: 6d (APU/promedio) SOLO con decisión explícita.

---

## 7. Validación y riesgos

1. **Doble conteo `gastado` vs `costosConceptos`:** mitigado por política
   documentada (§1.2) y verificado en tests unit + integration.
2. **Históricos sin costo:** la utilidad histórica saldrá inflada; `completitud`
   + callout lo señalan. Nunca "dar números" huecos (riesgo 4 del plan 5f).
3. **Facturas desde cotización** no llevarán `articulo_id` (las cotizaciones no
   tienen líneas de insumo): su costo cae en `gastado` — documentado.
4. **`proyectos.gastado` ya alimenta el frontend mock de proyectos:** el cambio
   a API real debe conservar el override manual (gastado sigue siendo editable).
5. **Migración** con el flujo manual probado; riesgo bajo (aditiva, FKs SET NULL).
6. **Turbopack:** el bloque de utilidad en `/proyectos` sigue el patrón
   `initialLoading` + fetch client-side; sin `next/dynamic` nuevo.