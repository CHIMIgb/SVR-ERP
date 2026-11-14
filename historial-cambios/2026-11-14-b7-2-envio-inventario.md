# 2026-11-14 — B7.2: enviar la producción de criba al inventario (transacción)

## Qué se hizo

- **DTOs**: `materialId` (catálogo de criba, requerido en create; opcional en
  update — `undefined` no toca) reemplaza `tipoMaterial` como entrada; el
  `tipo_material` (snapshot del nombre) lo escribe el service con el nombre
  del material. Query: filtro `materialId`.
- **`criba.service.ts`**:
  - `resolverMaterial` (`MATERIAL_NO_ENCONTRADO`) + snapshot del nombre.
  - **`enviarInventario(id)`** — `POST /criba/:id/inventario`
    (permiso `operaciones.criba.editar`): transacción con
    `InventarioService.aplicarEntrada` (stock + movimiento
    `motivo='PRODUCCION_CRIBA'`, referencia al registro), guard
    anti-doble-envío (`inventario_en IS NULL` vía updateMany),
    auditoría SUCCESS (con stockAnterior/resultante) y FAIL
    (`YA_EN_INVENTARIO` 409, `SIN_MATERIAL_EN_CATALOGO` para registros
    viejos, `MATERIAL_SIN_ARTICULO`, `SIN_MATERIAL_AL_BANCO`).
  - `serialize` expone `materialId/material/inventarioEn` y el include trae
    `materiales_criba`.
  - Limpieza: el `tipo_material` ya no se valida contra `MATERIALES_CRIBA`
    (es snapshot); filtros por `materialId` (catálogo).

## Verificación

- `npx tsc --noEmit`: limpio.
- Unit `src/criba`: **40/40** (incluye DTO spec con materialId requerido y
  UUID inválido).
- Integración (BD real): **9/9** — los 6 previos + 3 nuevos:
  1. enviar → **stock de 'Criba fina' sube 450**, movimiento ENTRADA
     trazable, audit SUCCESS.
  2. doble envío → **YA_EN_INVENTARIO** audit FAIL y stock sin cambio.
  3. registro viejo sin material enlazado → rechazado.

## Pendientes / riesgos

- La UI (B7.3) todavía no tiene el botón de envío ni el indicador.
- La emisión al catálogo es por nombre: si el artículo se renombra, el seed
  del catálogo debe actualizar el `articulo_id` (una fila).
