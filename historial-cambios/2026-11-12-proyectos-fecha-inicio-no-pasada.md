# 2026-11-12 — /proyectos: la fecha de inicio no acepta días anteriores a hoy

## Qué se hizo

- **`apps/web/src/app/(dashboard)/proyectos/page.tsx`**
  - `fechaLocalHoy()` — fecha de hoy en horario **local** como `YYYY-MM-DD`
    (con `toISOString()` el día se adelanta por el UTC y bloquearía el día real).
  - `handleFechaInicioChange()` — si la fecha capturada es anterior a hoy,
    muestra el toast de error ("La fecha de inicio no puede ser anterior a hoy.")
    y **deja el input vacío**; si es válida, la guarda. Aplica a los modales de
    **crear** y **editar**.

**No** se agrega `min` al `<input type="date">` ni una regla en `validateForm`:
los proyectos existentes tienen fechas de inicio pasadas y `min`/la validación
impedirían guardar una edición (p. ej. cambiar solo el progreso). El bloqueo vive
solo en la captura del campo.

## Verificación

- `npx tsc --noEmit` (web): sin errores.
- `npx eslint "src/app/(dashboard)/proyectos/page.tsx"`: solo los 2 hallazgos
  preexistentes (`useMemo` sin usar y `setState` en el efecto de carga).
- Revisado que el handler está en los dos inputs (líneas 781 y 933).

## Pendientes / riesgos

- Smoke visual pendiente: capturar una fecha anterior a hoy debe mostrar el toast
  y vaciar el campo; una fecha futura debe quedarse.
- `fechaFin` no cambió: la validación existente sigue rechazando que sea anterior
  a `fechaInicio` (puede ser pasada si el inicio también lo es, como en edición).
