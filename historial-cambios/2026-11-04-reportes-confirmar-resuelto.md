# /reportes — confirmación al marcar como Resuelto

**Fecha:** 2026-11-04
**Autor:** agente OpenCode (a petición del usuario)

## Cambios realizados
- El botón de avanzar al estado **Resuelto** ya no aplica de golpe: abre un
  **modal de confirmación** ("Marcar como Resuelto") con el resumen del reporte
  (quien reportó · área) y queda claro **quién resolvió** (responsable asignado).
  Botones: "Sí, Marcar Resuelto" / Cancelar.
- Las demás transiciones (Pendiente→Visto→Atendido) siguen aplicando directo,
  y la regla previa se mantiene: sin responsable no se abre el modal, se
  redirige a "Asignar".
- El `resuelto_en` + auditoría `resueltoPor` siguen naciendo igual en el backend.

## Archivos tocados
- `apps/web/src/app/(dashboard)/reportes/page.tsx` (solo este)

## Pruebas / verificación
- `npx tsc --noEmit` ✔; eslint del archivo ✔ (backend no cambió).
- Visual pendiente del usuario.

## Pendientes y riesgos
- Ninguno; cambio puramente frontend.
