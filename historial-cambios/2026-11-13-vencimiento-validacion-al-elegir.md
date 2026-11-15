# 2026-11-13 — /proveedores: el vencimiento se valida al ELEGIR la fecha, no al guardar

## Qué se hizo

- **`apps/web/src/app/(dashboard)/proveedores/page.tsx`** — la validación de
  "la fecha de vencimiento no puede ser anterior a hoy" ahora se dispara
  **onChange** (al elegir la fecha), no solo al guardar — mismo patrón que la
  fecha de inicio en obras: toast inmediato + el input se limpia. Aplica en:
  - El campo de la modal **Nueva Orden**.
  - El campo de la acción **"Vencimiento"** (modal de corrección).
  - Los guards al guardar se conservan como defensa extra.

## Verificación

- `npx tsc --noEmit` (web): limpio.
- `npx eslint` del archivo: sin hallazgos.

## Pendientes / riesgos

- Smoke visual pendiente (sin navegador).
