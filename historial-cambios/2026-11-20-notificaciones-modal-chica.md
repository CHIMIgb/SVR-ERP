# Modal de notificaciones PWA más compacta

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** pedido del usuario — «la modal de las notificaciones en la pwa la puedes hacer más chica»

## Cambios realizados
- `NotificacionesModal`: `size="md"` → `size="sm"` (max-w-sm del kit) — más
  compacta, como el popover del escritorio.

## Archivos tocados
- `apps/web/src/components/pwa/NotificacionesModal/NotificacionesModal.tsx`
- `historial-cambios/2026-11-20-notificaciones-modal-chica.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 37 warnings preexistentes.
- `git diff --check`: sin errores.
- Smoke pendiente: visual en el teléfono (la lista con textos largos debe
  seguir legible en el ancho nuevo).

## Pendientes y riesgos
- Sin push: el commit queda local.
