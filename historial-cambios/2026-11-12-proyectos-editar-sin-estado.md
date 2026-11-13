# 2026-11-12 — /proyectos: el formulario de edición deja de capturar el estado

## Qué se hizo

- **`apps/web/src/app/(dashboard)/proyectos/page.tsx`** — se eliminó el `select`
  "Estado" del modal **Editar Proyecto**. El estado ya se cambia con la acción
  **"Estado"** de la tabla (commit `9515a1d1`), así que el editar queda solo con
  datos del proyecto, fechas y ubicación.
- Para no dejar un hueco en la rejilla de 2 columnas, **Presupuesto (MXN)** pasa
  a `sm:col-span-2` en ese modal: queda Presupuesto a todo lo ancho y debajo
  Fecha de inicio | Fecha estimada de entrega (misma estructura que crear).
- `form.estado` se conserva: `openEdit` lo precarga y `buildPayload` lo reenvía
  sin cambios al guardar (no se puede modificar desde el formulario).

## Verificación

- `npx tsc --noEmit` (web): sin errores.
- `npx eslint "src/app/(dashboard)/proyectos/page.tsx"`: solo los 2 hallazgos
  preexistentes (`useMemo` sin usar y `setState` en el efecto de carga).
- Revisado por grep: en el modal de edición ya no hay `label="Estado"` de
  proyecto; los que quedan son el estado de la dirección (campo "Estado" de
  ubicación) y el del modal "Cambiar Estado".

## Pendientes / riesgos

- Smoke visual pendiente (sin navegador): confirmar la nueva distribución del
  modal de edición.
- El payload de edición sigue incluyendo `estado` con el valor actual: es un
  no-op, pero si el estado cambió desde la acción mientras el modal estaba
  abierto, guardar el editar lo regresaría al valor que tenía al abrirlo.
