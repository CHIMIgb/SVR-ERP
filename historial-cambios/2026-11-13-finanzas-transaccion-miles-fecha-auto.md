# 2026-11-13 — /finanzas: nueva transacción con monto en miles, fecha automática y grid 2×2

## Qué se hizo

- **`apps/web/src/app/(dashboard)/finanzas/page.tsx`** — modal **Nueva
  Transacción**:
  - **Monto (MXN)** pasa a `type="text"` con separador de miles automático
    (`formatearMiles`); la validación y el payload usan `parsearMiles`.
  - **El input Fecha se elimina**: se registra la de hoy automáticamente
    (`fechaLocalHoy()` en `openCreate`; el backend ya exigía la fecha y la
    sigue recibiendo). El modal de EDICIÓN conserva su fecha (corregible).
  - **Grid 2×2**: Tipo | Categoría / Monto | Descripción (la categoría pierde
    el ancho completo; su input "otra categoría" sigue apareciendo dentro del
    campo cuando aplica).
- El modal de edición no se tocó (la fecha ahí es corregible, como se acordó
  en cotizaciones).

## Verificación

- `npx tsc --noEmit` (web): limpio.
- `npx eslint` del archivo: sin hallazgos.

## Pendientes / riesgos

- Smoke visual pendiente (sin navegador).
