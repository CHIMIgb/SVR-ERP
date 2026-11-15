# 2026-11-13 — B5.13: al reasignar un reporte se notifica al anterior Y al nuevo

## Qué se hizo

Petición del cliente: *"si tengo un reporte asignado y alguien lo reasigna, se
me notifica que fue reasignado y a la nueva persona se le informa que se le
asignó"* — estaba a medias (solo el nuevo).

- **`apps/api/src/reportes-campo/reportes-campo.service.ts`** — `asignar` ahora:
  - **Nuevo asignado**: ALERTA *"Te asignaron el reporte"* — SOLO si cambió
    (reasignar a la misma persona no notifica nada).
  - **Anterior (trabajador)**: INFO *"El reporte fue reasignado a otra
    persona"* — si tenía `asignado_a_id` distinto al nuevo.
  - **Anterior (usuario que lo aceptó por texto)**: INFO *"El reporte que
    aceptaste fue reasignado a otra persona"* — vía `asignado_user_id`.
- El reasignador no se auto-notifica (el filtro del buzón excluye al actor).

## Verificación

- `npx tsc --noEmit` (api): limpio.
- Unit `src/reportes-campo`: **103/103**.
- **Smoke real con los 2 trabajadores enlazados** (Juan Garcia Perez = ADM-002,
  Juan Perez Garcia = TEC-005): crear reporte → asignar a ADM-002 →
  reasignar a TEC-005. En BD quedaron las 3 notificaciones personales:
  ADM-002 *"Te asignaron"* (primera) + ADM-002 *"fue reasignado a otra
  persona"* + TEC-005 *"Te asignaron"* ✓.

## Pendientes / riesgos

- Smoke visual pendiente (sin navegador).
- La notificación del anterior va SOLO si su cuenta está enlazada
  (`trabajadores.usuario_id`, B5.11) o era usuario aceptador.
