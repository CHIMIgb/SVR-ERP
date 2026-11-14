# 2026-11-14 — /inventario: "Pedir" removido y bloqueo de edición para materiales de criba

## Qué se hizo

- **Botón "Pedir" eliminado** (junto con su modal "Registrar Entrada",
  `openOrder`, `handleOrder`, estados y `emptyOrderForm`). El import
  `Badge` quedó sin uso y se quitó (era solo del modal de orden).
  Motivo: no "pedía" nada — hacía una **entrada directa de stock** al
  instante (`POST /inventario/movimiento` ENTRADA), engañoso frente al
  flujo real de órdenes de compra de `/ordenes-compra`.
- **Editar materiales de criba** (los enlazados a `materiales_criba`:
  Criba fina / Criba gruesa / Arena lavada): los inputs **Nombre** y
  **Stock Actual** quedan `readOnly`, con nota visible ("su stock solo
  sube al enviar la producción de criba al inventario" / "su nombre lo
  administra el catálogo de criba").
  Detección: `MAT-*` + nombre en el catálogo sembrado.
  `shortcut: por nombres del catálogo sembrado; al agregar/renombrar un
  material de criba hay que actualizar la lista, o exponer el catálogo
  por API.`, cuando eso pase.

## Verificación

- `npx tsc --noEmit` (web): limpio.
- eslint: solo el error **preexistente** (setState en effect, línea 140).
- La tabla sin la columna de acciones de "Pedir"; editar/eliminar intactos.

## Pendientes / riesgos

- El endpoint `POST /inventario/movimiento` SIGUE existiendo en el API
  (no se tocó backend) — solo se quitó la puerta en la UI.
- Smoke visual pendiente (sin navegador).

## Nota del cliente (futuro)

- "Pedir" podría regresar como **levantar una orden de compra
  automática** al proveedor del artículo con la cantidad sugerida; para
  eso se necesitan las respuestas del SVR (CLAVE 7: proveedores con
  crédito o contado; y CLAVE 1 para precios). La entrada directa actual
  no sirve para eso.
