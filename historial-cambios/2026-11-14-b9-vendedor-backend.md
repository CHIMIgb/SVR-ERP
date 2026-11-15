# 2026-11-14 — B9/P6: vendedor real en cotizaciones (backend)

## Qué se hizo

`cotizaciones.vendedor_id` existía en el schema y en la BD pero estaba en
**cero uso**. Ahora es real:

- **`cotizaciones.service.ts`**:
  - `create`: `vendedor_id = userId` (el usuario logueado que captura,
    viene del JWT — sin campo en el formulario). Incluye la relación del
    vendedor en el create para que la respuesta ya traiga el nombre.
  - `findAll`: filtro `vendedorId` + include de la persona del vendedor.
  - `findOne`: include del vendedor (detalle).
  - `serialize`: expone `vendedorId`; `serializeGlobal`: `vendedorNombre`
    (nombre completo de la persona, mismo patrón que `creadoPor`).
  - **Nuevo `findCatalogos()`**: `vendedores: [{id, nombre}]` de usuarios
    activos — no existe rol "Vendedor" en el RBAC (6 roles: Administrador,
    Administrativo, Residente, Técnico, Cobrador, Trabajador), así que el
    catálogo es de usuarios activos.
- **`query-cotizaciones-global.dto.ts`**: filtro `vendedorId` opcional.
  `@IsString` y NO `@IsUUID`: el UUID del usuario admin seed
  (`c0000000-…-0001`) **no pasa la validación RFC** de class-validator
  (bits de versión en 0); `clienteId` ya usaba `@IsString` por lo mismo.
- **`cotizaciones-global.controller.ts`**: `GET /cotizaciones/catalogos`
  (antes de `:id`), permiso existente `comercial.cotizaciones.ver` — sin
  permisos nuevos.
- **Backfill ejecutado (decisión mía, autorizada por el cliente):**
  `update cotizaciones set vendedor_id = creado_por where vendedor_id is
  null and creado_por is not null and eliminado_en is null` → **5 filas
  actualizadas** (2 quedan sin vendedor: sin `creado_por`, filas legadas
  del sistema).

## Verificación

- `npx tsc --noEmit` (api): limpio.
- Unit `src/clientes`: **86/86** (3 tests nuevos: create asigna vendedor,
  findAll filtra e incluye persona, findCatalogos devuelve nombre completo).
- Integración (BD real): **17/17** — test nuevo `VENDEDOR (B9/P6)`: create
  persiste vendedor, detalle trae nombre, filtro lo encuentra, catálogo lo
  incluye.
- Smoke real: `GET /cotizaciones/catalogos` → 35 vendedores;
  `GET /cotizaciones?vendedorId=<admin>` → 5 cotizaciones con
  "vendedor: Carlos SVR" (gracias al backfill).

## Pendientes / riesgos

- Commit 2 (web): columna, filtro y chip en `/cotizaciones`.
- Sin índice en `vendedor_id` (tabla chica, listado paginado); si crece,
  migración con `prisma db execute` + `migrate resolve` (aquí `migrate dev`
  no funciona).
- El backfill asume que `creado_por` era el vendedor real del histórico —
  es lo mejor disponible (no se guardaba nada más).
