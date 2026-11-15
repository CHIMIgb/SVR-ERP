# 2026-11-13 — B5.4: el centro de notificaciones del Topbar cosido al API real

## Qué se hizo

- **`apps/web/src/lib/api.ts`** — `notificacionesApi` (`listar`/`marcarLeida`/
  `marcarTodas`) + `NotificacionDTO` y `NotificacionesListadoDTO` (con
  `noLeidas`).
- **`apps/web/src/components/layout/NotificationContext.tsx`** — el mock en
  memoria (8 notificaciones demo) queda eliminado:
  - `cargar()` consume `GET /notificaciones` (el backend filtra por los roles
    del usuario; el front no filtra nada).
  - **Polling cada 60s** (sin websockets), arranca con la sesión y se detiene
    al desmontar.
  - `markAsRead` / `markAllAsRead` actualizan local (optimista) y llaman a la
    API; errores con `mensajeErrorApi`.
  - `addNotification` SE CONSERVA como overlay local (lo usan las vistas que
    aún lo usan: asistencia/combustible/horómetro); no persiste — las
    notificaciones reales las emite el backend.
  - `clearNotifications` limpia solo lo local (la API no tiene DELETE: las
    notificaciones se expiran después, fuera de alcance).
  - El tipo "correo" del mock queda congelado: nada lo genera hoy (la UI del
    Topbar lo sigue soportando para el futuro).
- Fecha en la lista: `creadoEn` formateado corto es-MX (dd/MM HH:mm).

## Verificación

- `npx tsc --noEmit` (web): limpio.
- `npx eslint` de los 2 archivos: sin hallazgos.
- **Smoke real de punta a punta**: aprobar la OC-2026-051 → notificación
  ALERTA "Orden OC-2026-051 aprobada" en el buzón (`noLeidas=1`) →
  `PATCH :id/leer` → `leida=true` ✓ → `leer-todas` → `marcadas=0` (ya
  leídas) ✓. El abono de B4 emitió para el rol **Administrativo** y NO
  aparece en el buzón del Administrador — la audiencia por rol funciona.

## Pendientes / riesgos

- Smoke visual pendiente (sin navegador): campana, badge, lista y botones.
- `addNotification` local no persiste: cuando las vistas mock (asistencia,
  combustible, horómetro) se cosan a su API real, sus avisos deben migrar a
  emisiones de backend.
- El evento "CxP/CxC por vencer" espera las dudas #34/#7/#5 (plan §12) — la
  tubería ya está lista para enchufarlo (`emitirARol` + cron pendiente).
