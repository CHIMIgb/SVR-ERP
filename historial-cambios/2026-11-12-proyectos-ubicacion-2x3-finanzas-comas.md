# 2026-11-12 — /proyectos: ubicación en 2×3, edición sin progreso y finanzas con comas

## Qué se hizo

Todo en `apps/web/src/app/(dashboard)/proyectos/page.tsx`.

1. **Ubicación de la obra en "Nuevo Proyecto"** — se quitó el `sm:col-span-2` de
   "Calle y número"; los 6 campos quedan en **2 columnas × 3 filas** en
   escritorio (`Calle | Colonia`, `Municipio | Ciudad`, `Estado | Código postal`)
   y en 1 columna en móvil. En el alta, el bloque ahora es idéntico al de edición.
2. **"Editar Proyecto"** — se eliminó el input "Progreso (%)". La sección
   "Ubicación de la obra" queda igual que en crear (misma corrección de rejilla).
   El `progreso` se sigue enviando en el payload con el valor que ya tenía el
   proyecto (no se toca desde el formulario).
3. **Modal "Actualizar Finanzas"** — `ingresoCobrado` y `gastado` pasan de
   `type="number"` a `type="text"` + `inputMode="decimal"` con el mismo
   `formatearMiles()` de crear/editar (comas cada 3 y máx. 2 decimales).
   `openFinanzas` muestra los valores ya formateados; `validateFinanzas` y
   `parseOptionalMoney` parsean con `parsearMiles()` (quitan las comas antes de
   validar/enviar).

## Verificación

- `npx tsc --noEmit` (web): sin errores.
- `npx eslint "src/app/(dashboard)/proyectos/page.tsx"`: solo los 2 hallazgos
  preexistentes (`useMemo` sin usar y `setState` en el efecto de carga).
- Revisado por grep: los dos bloques "Ubicación de la obra" tienen los mismos 6
  campos y ningún `col-span`; no queda ningún input de `progreso`.

## Pendientes / riesgos

- `progreso` ya no se captura en ningún modal: solo cambia por otra vía (o queda
  fijo). `validateForm` sigue validando el rango 0–100 con el valor del form.
- Smoke visual pendiente (sin navegador): confirmar las 3 filas de 2 columnas y
  el formateo de comas al abrir el modal de finanzas de un proyecto con montos.
