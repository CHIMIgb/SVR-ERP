# Bloqueador 1 y 2 del review PR #15 (/items y RFC) resueltos — fase de alineación

**Fecha:** 2026-11-06
**Autor:** agente OpenCode (por capturas y console del usuario)

## Diagnóstico (reproducido con la API real)
1. **Orden de compra:** el frontend mandaba el contrato viejo
   `{proveedorId, descripcion, monto}` sin `items`, pero el DTO de Fase 7
   exige `items[]` obligatorio y deriva el monto: `items must contain at
   least 1 elements`. Era la mitad frontend de la Fase 7 pendiente (igual
   que pasa con el botón "Recibir" del mismo PR).
2. **RFC de proveedor:** la regex SAT (`^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{2,3}$`)
   rechaza basuras ("gdm", "—"). En `undefined` pasa (201).
3. **El toast genérico "Error de validación"** que ocultaba ambas causas:
   las páginas muestran solo `res.error?.message` y no los `details` reales
   que la API manda.

## Cambios realizados
1. **`lib/api.ts`:** `OrdenCompraCreateInput` con `items[]`
   (`OrdenCompraItemInput[]`: articuloId nullable, nombre, cantidad,
   precioUnitario; monto se deriva en el backend) y `ordenesCompraApi.recibir`
   tipado con folio + inventario por línea.
2. **`proveedores/page.tsx` — modal de Orden**:
   - Sección **"Líneas del pedido"** con +Agregar/Quitar, producto,
     cantidad (input solo numérico), precio unitario e importe por
     línea + total calculado; sin límite.
   - `handleCrearOrden` válida en UI (proveedor, ≥1 línea, producto,
     cantidad,precio >0 por línea) y envía el contrato nuevo.
   - Toast de errores con `details` reales de la API (`details?.join(' · ')`).
3. **RFC validado en la UI** (`mayúsculas + regex oficial`) con mensaje
   claro en español antes de llamar al API; vacío sigue permitido.
4. El modal de creación del proveedor también muestra los details reales
   en el toast de error.

## Pruebas / verificación
- `npx tsc --noEmit` web y api ✔ (0 errores).
- `npm run test` api: **1023/1025** (2 fallas de cobranza conocidas).
- eslint proveedores/page.tsx: 0 errores.

## Pendientes y riesgos
- La línea nueva sin `articuloId` llevará **alta de catálogo** al recibir
  (modal de asignación/del recepción) — pendiente en la vista de editar
  (queda en el alcance del PR de Nómina y Flota del otro dev si lo pide).
- Los "micromensajes" a la UI deben continuar en los módulos restantes
  (214 capturas) para la fase del barrido del review.
