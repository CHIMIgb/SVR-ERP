# 2026-11-12 — /cotizaciones: estado como texto y área de condiciones más grande

## Qué se hizo

Ajustes visuales pedidos por el cliente sobre la vista ya migrada a partidas:

- **`apps/web/src/app/(dashboard)/cotizaciones/page.tsx`**
  - La columna **Estado** (tabla y modal de detalle) ya no pinta badges de
    color: solo el texto ("Pendiente" / "Aceptada" / "Rechazada") con peso
    semibold neutro. Se eliminó el import de `Badge` (quedó sin uso); los
    iconos `CheckCircle2`/`XCircle`/`Clock` siguen en uso en otras partes de
    la vista.
  - El textarea de **"Condiciones (se muestran en la cotización)"** pasa de
    `min-h-[70px]` a `min-h-[180px]` en los modales Nueva y Editar.

## Verificación

- `npx tsc --noEmit` (web): limpio.
- `npx eslint` del archivo: solo el 1 error preexistente
  (`react-hooks/set-state-in-effect` en el efecto de carga inicial).

## Pendientes / riesgos

- Smoke visual pendiente (sin navegador): confirmar el tamaño del textarea y
  el texto plano en la columna.
