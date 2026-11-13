# 2026-11-13 — B5.2: módulo notificaciones (API con los 4 checkpoints)

## Qué se hizo

- **Módulo nuevo `apps/api/src/notificaciones/`** (service + controller +
  module, registrado en `app.module.ts`, service EXPORTADO para que los
  demás módulos emitan eventos en B5.3):
  - **`emitir()`** — best-effort: crea la fila y, si falla, solo loggea el
    warning **sin revertir el evento de negocio** que la originó. Uso interno
    (no tiene endpoint).
  - **`GET /notificaciones`** — buzón del usuario: audiencia "todos" +
    los roles del usuario (`users_roles`), paginado (default 10, techo 100,
    patrón criba), regresa `{ items, pagination, noLeidas }`.
  - **`PATCH /notificaciones/leer-todas`** — marca el buzón completo (audita
    con el conteo). Ruta fija declarada antes que `:id/leer`.
  - **`PATCH /notificaciones/:id/leer`** — marca una; 404 audita FAIL
    (`NOTIFICACION_NO_ENCONTRADA`).
  - Los 3 endpoints llevan JWT + blacklist + `PermissionsGuard` con el
    permiso nuevo `sistema.notificaciones.ver`; las mutaciones auditan
    SUCCESS (y FAIL antes de lanzar).
- **Permiso #107** `sistema.notificaciones.ver` (UUID `aa00001d-…-0001`,
  sin duplicados) en migración `20261113031000_notificaciones_permiso`,
  otorgado a TODOS los roles vivos (el centro del Topbar es de todos; el
  filtro por audiencia de rol es de datos, no de permiso).
- **`AuditAction.NOTIFICACION_LEIDA`** agregado al enum del schema con
  severidad INFO en `audit.constants.ts`; en BD con
  `ALTER TYPE … ADD VALUE` (NO recrea el tipo: el drift preexistente de
  `REPORTE_CAMPO_FACTURADO` queda intacto).

## Verificación

- `npx tsc --noEmit` (api): limpio.
- Unit `src/notificaciones`: **7/7** (emitir normal y best-effort, filtro de
  audiencia con paginación, marcar leída con audit SUCCESS/FAIL, marcar todas
  con conteo).
- BD: permiso insertado (1) + 6 roles con el permiso; enum con
  `NOTIFICACION_LEIDA`; 2 migraciones registradas.

## Pendientes / riesgos

- Nadie emite todavía (B5.3) y el frontend sigue en mock (B5.4).
- La lectura compartida por rol (decisión del spec F1) aplica: marcar leída
  lo es para todo el rol destinatario.
