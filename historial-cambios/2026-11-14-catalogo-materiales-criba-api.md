# 2026-11-14 — Catálogo `materiales_criba` por API: cero nombres hardcodeados

## Qué se hizo

Segundo commit del plan autorizado: la lista de "materiales de criba" vivía
duplicada en el código frontend (`/criba` y `/inventario`); ahora la única
fuente de verdad es la tabla `materiales_criba` de la BD, expuesta por API
y consumida por **id**.

**Backend:**
- `criba.service.ts` → `findCatalogos` ahora devuelve
  `materiales: [{ id, nombre, articuloId }]` (el catálogo ya era la fuente
  del select de material en B7; el endpoint se amplía).
- `inventario.service.ts` → `findCatalogos` devuelve el mismo shape como
  `materialesCriba` (para bloquear edición de lo que produce la criba).
- Ambos usan sus permisos de ruta existentes (`operaciones.criba.ver` /
  `operaciones.inventario.ver`) — sin permisos nuevos.

**Web:**
- `lib/api.ts`: `CribaCatalogos.materiales` e
  `InventarioCatalogos.materialesCriba` tipados.
- `/criba/page.tsx`:
  - El catálogo de materiales viene de `cribaApi.catalogos()`; el **stock
    en la etiqueta del select** se cruza por `articuloId` contra el listado
    de inventario (antes: filtro de artículos **por nombre**, era frágil).
  - La fila de resumen por material (stats) usa los nombres del catálogo
    (se propagan solos en renombres futuros del CRUD de materiales).
  - Borrados `const MATERIALES` y el filtro por nombre.
- `/inventario/page.tsx`: `esDeCriba` ahora compara el **id** del artículo
  enlazado (`materialesCriba.some(m => m.articuloId === selectedItem.id)`);
  fuera la lista de nombres `NOMBRES_CRIBA`.

## Resultado

- Renombrar o agregar un material de criba en el catálogo se propaga solo a
  los selects/filtros de `/criba` y al bloqueo de edición de `/inventario`
  (que es por id, inmune a renombres).
- Verificación en BD real: `/api/criba/catalogos` y `/api/inventario/catalogos`
  devuelven los 3 materiales (Arena lavada, Criba fina, Criba gruesa) con su
  `articuloId` enlazado.

## Verificación

- `npx tsc --noEmit` (api y web): limpios.
- Unit criba + inventario + controles: **67/67**.
- Integración (BD real) criba + inventario: **17/17**, incluye el test nuevo
  `findCatalogos → materiales con articuloId enlazado`.
- Smoke real de ambos endpoints con login admin (arriba).
- eslint: solo los errores **preexistentes** (setState en effect en
  `/criba` y `/inventario` — deuda conocida).

## Pendientes / riesgos

- Registros antiguos de criba guardan el nombre del material como string en
  `tipo_material`: si se renombra un material, sus stats históricas siguen
  con el nombre viejo (cosmético; el CRUD futuro de materiales decidirá si
  se sincronizan los nombres de registros y del artículo de inventario).
- Smoke visual en navegador pendiente (sin navegador).
