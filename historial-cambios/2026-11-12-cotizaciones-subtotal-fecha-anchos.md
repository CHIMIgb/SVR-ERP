# 2026-11-12 — /cotizaciones: subtotal con comas, fecha automática y modales más anchos

## Qué se hizo

Ajustes pedidos por el cliente sobre los modales de cotización:

- **`apps/web/src/lib/formatters.ts`** — los helpers de miles que vivían
  duplicados en la vista de proyectos (`formatearMiles`, `parsearMiles`,
  `fechaLocalHoy`) pasan a ser **compartidos** con export desde aquí.
- **`apps/web/src/app/(dashboard)/proyectos/page.tsx`** — elimina sus copias
  locales e importa las compartidas (comportamiento idéntico; se aprovechó para
  borrar un comentario huérfano que quedaba de los helpers).
- **`apps/web/src/app/(dashboard)/cotizaciones/page.tsx`**:
  - **Subtotal (MXN, antes de IVA)** pasa a `type="text"` con separador de
    miles automático mientras se escribe (mismo patrón que proyectos); con
    partidas el valor calculado se muestra formateado. Las validaciones usan
    `parsearMiles` y el monto precargado al editar también va formateado.
  - **El input Fecha desaparece** de Nueva y Editar: al crear se envía la fecha
    de hoy automáticamente (`emptyForm.fecha`); al editar ya no se envía
    `fecha` en el PATCH (la original se conserva en BD).
  - **Modales más anchos**: Nueva, Editar y Ver pasan a `size="full"`
    (max-w-3xl, tamaño ya definido en el kit `Modal`/`FormModal`).

## Verificación

- `npx tsc --noEmit` (web): limpio.
- `npx eslint` de los 3 archivos: solo los avisos preexistentes
  (`set-state-in-effect` en ambos headers de página y `useMemo` sin usar en
  proyectos).
- Sin smoke visual (no hay navegador): pendiente ver el ancho y el formato con
  comas en vivo.

## Pendientes / riesgos

- El modal "Aceptar/Rechazar" sigue en su tamaño default (no se pidió).
- La fecha al editar ya no se puede corregir desde la UI: si una cotización se
  capturó con fecha equivocada, se ajusta en BD. Era lo pedido ("se capture
  automáticamente").
