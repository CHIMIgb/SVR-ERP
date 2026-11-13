# 2026-11-13 — B5.9: el buzón por destinatario explícito (usuario/torre/rol/todos)

## Qué se hizo

Fase 2 del rediseño (B5.8 puso las columnas, esta el código):

- **`filtroDeBuzon` reescrito** — el buzón ya NO se filtra por acceso a vista
  (mapa `referencia_tipo → ruta` y consulta a `role_vistas` retirados). Ahora
  es: **dirigido a mí** — `destinatario_user_id = yo` **O** `audiencia_torre`
  = mi `users.torre` **O** `audiencia_rol_id` ∈ mis roles activos **O** para
  todos — **menos** lo disparado por mí (actor excluido). Consulta la torre
  del usuario (`users.torre`) y sus roles con `activo: true`.
- **Helpers de emisión nuevos** (todos best-effort, patrón emitirARol):
  - `emitirAUsuario(userId, …)` — destinatario personal.
  - `emitirATorre(torre, …)` — toda un área; sin torre no emite.
  - `emitirATrabajador(trabajadorId, …)` — los trabajadores NO tienen FK a
    cuentas: resuelve la cuenta por nombre completo contra `personas`
    (nombre + apellidos); sin match único o sin cuenta → NO emite y queda
    loggeado (`shortcut:` conocido, se mejora si se agrega FK en schema).
- `emitir` persiste los 3 canales de destinatario (`destinatario_user_id`,
  `audiencia_torre`, `audiencia_rol_id`).

## Verificación

- `npx tsc --noEmit` (api): limpio.
- Unit `src/notificaciones`: **18/18** (nuevos: destinatarios explícitos en
  emitir, personal/torre/trabajador + casos sin cuenta y nombre ambiguo,
  visibilidad con torre y sin torre, conteo de no leídas).

## Pendientes / riesgos

- Los 4 eventos previos (OC/abono/cierre/nómina) siguen emitiendo por ROL —
  siguen funcionando igual con el filtro nuevo (audiencia por rol).
- El match trabajador→cuenta es por nombre: si hay dos personas con nombre
  idéntico, la notificación no se emite (queda loggeada) — a futuro, agregar
  FK `users.trabajador_id` en schema lo hace exacto.
- Smoke del buzón pendiente hasta conectar los eventos de reportes (B5.10).
