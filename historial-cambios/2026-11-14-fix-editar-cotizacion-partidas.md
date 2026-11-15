# 2026-11-14 — Editar cotización: las partidas ahora se cargan (fix)

## El bug

Al dar "Editar" desde la tabla de `/cotizaciones`, el modal abría con todo
cargado **excepto las partidas** (un renglón vacío placeholder).

**Causa raíz:** el botón "Editar" de la tabla pasaba el item del **listado**
directo a `openEditar` — y el listado global **omite las partidas a
propósito** (no las incluye para no cargar N+1; solo `GET /cotizaciones/:id`
las trae). Así que `item.items` siempre era `undefined` → el modal se abría
con `editHasItems = false` y un renglón vacío, imposible de ver/editar las
partidas reales.

**Riesgo de pérdida de datos asociado:** con ese estado erróneo, si el
usuario agregaba un renglón nuevo y guardaba, el payload iba con ese único
renglón y el backend hacía `deleteMany + create` — **borraba todas las
partidas originales**. Con el fix, se ven las partidas reales antes de
guardar.

## El fix

`openEditar` ahora pide el **detalle** antes de abrir el modal (el mismo
patrón que ya usa `openDetail`, línea ~206): con `GET /cotizaciones/:id`
llena descripción, monto, condiciones, cliente **y las partidas reales**;
el modal abre hasta que llega la respuesta. Si falla, toast de error con
`mensajeErrorApi` y no se abre. Backend sin cambios (el detalle ya devuelve
todo).

## Verificación

- `npx tsc --noEmit` (web): limpio.
- eslint: solo el error **preexistente** de setState en effect (línea ~171).
- Smoke manual sugerido (sin navegador): editar una cotización con
  partidas desde la tabla → el modal debe mostrar los renglones; guardar
  sin cambios no debe alterar las partidas.

## Pendientes / riesgos

- Breve destello: el modal abre tras el fetch (latencia de un request);
  no se puso skeleton en el modal (el patrón del repo usa `FormModal.
  isSubmitting` para submits, no para aperturas).
