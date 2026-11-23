# Sistema de notificaciones conectado a la PWA

**Fecha:** 2026-11-20
**Autor:** agente
**Plan de origen:** plan autorizado 2026-11-20 (análisis previo: permiso `sistema/notificaciones/ver` verificado para los 6 roles activos — sin migración)

## Cambios realizados
- **`(pwa)/layout.tsx`:** monta `NotificationProvider` (el provider COMPARTIDO
  del escritorio: polling de 60 s, marcar leída/todas/descartar — cero lógica
  duplicada) debajo del `ToastProvider` que ya existía. La campana decorativa
  muerta del header se reemplazó por `CampanaNotificaciones`.
- **`components/pwa/NotificacionesModal/` (nuevo):** centro de notificaciones —
  lista del buzón con badge de tipo (Alerta/Info), destacado de no leídas,
  acciones «Marcar todas leídas» / «Vaciar» (descartar) y tap por item para
  marcar leído. Estados: vacío (`EmptyState`), error silenciado por el
  provider (sin conexión el centro queda vacío, sin ruido).
- **`components/pwa/CampanaNotificaciones/` (nuevo):** campana ≥44px con badge
  del número de no leídas (`9+` si son más) que abre el modal. Vive DEBAJO del
  provider (por eso es componente propio: el layout no puede consumir el
  contexto que él mismo monta).
- **Documentación:** `COMPONENTS-PWA.md` §8-§9 con «cuándo NO usar».
- Permisos verificados en BD: los 6 roles activos tienen
  `sistema/notificaciones/ver` ✓ (sin migración).

## Cosas nuevas
- El operario ya recibe en el teléfono los avisos que el backend emite
  («Te asignaron el reporte», «Nueva actividad», «Cerraron tu reporte»,
  «Aceptaron tu reporte») — con el filtro por torre corregido (`34939ee1`).

## Archivos tocados
- `apps/web/src/app/(pwa)/layout.tsx`
- `apps/web/src/components/pwa/NotificacionesModal/` (3 archivos, nuevo)
- `apps/web/src/components/pwa/CampanaNotificaciones/` (3 archivos, nuevo)
- `COMPONENTS-PWA.md`
- `historial-cambios/2026-11-20-pwa-notificaciones.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 37 warnings
  preexistentes. `git diff --check`: sin errores.
- Smoke pendiente en el teléfono: aceptar un reporte desde un técnico →
  badge en el teléfono del trabajador/autor en ≤60 s → campana → lista →
  tap para marcar leída → «Marcar todas leídas» / «Vaciar».

## Pendientes y riesgos
- **Deep-link:** tap en una notificación NO navega al reporte referenciado —
  el provider compartido no expone `referenciaTipo`/`referenciaId`; exponerlos
  tocaría el archivo compartido del escritorio (mejora futura planificada).
- El modal no distingue «cargando» de «sin notificaciones» (el provider no
  expone flag de carga; al abrir la campana la precarga del arranque ya corrió).
- Sin push: el commit queda local.
