# 2026-11-14 — B7.1: catálogo `materiales_criba` + FK en registros + estado de envío

## Qué se hizo

Diseño propuesto por el cliente (patrón catálogo, como `categorias_puesto`):
la lista de materiales de criba deja de ser una constante de código y pasa a
ser una tabla de negocio que enlaza cada material a su artículo de inventario.

- **Migración `20261114020000_materiales_criba`**:
  - **Renombrado de negocio**: artículo "Arena de río" → **"Arena lavada"**
    (el material de la criba y el artículo quedan con el mismo nombre; el
    stock 118 m³ se conserva).
  - Tabla **`materiales_criba`**: `id`, `nombre` (único), `articulo_id`
    (FK a `articulos_inventario`, ON DELETE SET NULL), timestamps.
  - **Seed** de los 3 materiales enlazados a su artículo por nombre:
    `Criba fina` (46 m³), `Criba gruesa` (41 m³), `Arena lavada` (118 m³).
  - **`registros_criba`**: `material_criba_id` (FK al catálogo, SET NULL) +
    `inventario_en` (estado de envío, guard anti-doble-envío) + 2 índices.
  - **Backfill**: los 8 registros existentes enlazados al material de su
    `tipo_material` (8/8 ✓).

## Verificación

- `npx prisma validate` OK; cliente regenerado; migración registrada.
- `psql`: catálogo con 3 materiales y su artículo/stock; registros 8/8
  enlazados.

## Pendientes / riesgos

- El backend sigue leyendo `tipoMaterial` del DTO — se rewired en B7.2
  (siguiente commit).
- El catálogo no tiene UI de administración: agregar un material nuevo
  futuro será un seed/manual (no se pidió CRUD).
