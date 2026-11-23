# 2026-11-20 — Push: alta/baja de suscripción quedan auditadas — menor 3 PR #23

## Cambios realizados

**Menor 3 de la review del PR #23:** `suscribirPush` convertía CUALQUIER error en 404
(`NotFoundException` — semánticamente mentira, nada "no se encontró") y no audita ni el
éxito ni el fallo.

Fix:
- **Enum `AuditAction`**: 2 valores nuevos `PWA_PUSH_SUSCRITO` y `PWA_PUSH_BAJA` (no
  existía ninguno de push y "pedir prestado" uno ajeno está prohibido por las reglas
  del repo). Migración `20261120020000_audit_push_suscripcion` (`ALTER TYPE ADD VALUE`,
  PG 12+ lo permite en transacción). NOTA: `migrate dev` NO funciona en este repo
  (historial baselined — replay muere en el seed); migración manual + `migrate deploy`.
- **`suscribirPush`**: audit `PWA_PUSH_SUSCRITO` SUCCESS tras el upsert (actorUserId
  explícito, `newValue` = endpoint). El catch ya no devuelve 404: audit FAIL
  (`error_code: 'PUSH_SUSCRIPCION_FALLIDA'`, severity WARNING, vía `fallir()`) +
  `InternalServerErrorException` (500).
- **`cancelarSuscripcionPush`**: audit `PWA_PUSH_BAJA` SUCCESS (`newValue` = endpoint +
  canceladas; entityId placeholder porque la columna no admite una URL).
- **`audit.constants.ts`**: los 2 actions nuevos entran en `ACTION_SEVERITY_MAP` — el
  `Record<AuditAction, AuditSeverity>` exige TODAS las claves y el build truena sin
  ellas (pescado en el build, no en los tests).
- **Dump de integración regenerado** (`svr_erp_export/svr_erp_sin_postgis.sql`): el
  `migrate diff --exit-code` de integration.yml habría fallado con el enum nuevo fuera
  del dump. Verificado: diff = "No difference detected" y el dump contiene los valores.

## Cosas nuevas

- 2 valores de `AuditAction` + 1 migración (solo enum, sin tablas).

## Archivos tocados

- `apps/api/prisma/schema.prisma` — enum.
- `apps/api/prisma/migrations/20261120020000_audit_push_suscripcion/migration.sql` — NUEVA.
- `apps/api/src/notificaciones/notificaciones.service.ts`
- `apps/api/src/notificaciones/notificaciones.service.spec.ts`
- `apps/api/src/notificaciones/notificaciones.integration.spec.ts`
- `apps/api/src/audit/audit.constants.ts`
- `svr_erp_export/svr_erp_sin_postgis.sql` — regenerado (anónimo, sin datos de negocio).

## Verificación / pruebas

- Unitarios notificaciones: 33/33 (SUCCESS audit del alta, SUCCESS audit de la baja,
  FAIL con error_code y 500 — antes 404).
- **Integración (BD real) notificaciones: 7/7**, incluye:
  - `suscribirPush` real → fila `PWA_PUSH_SUSCRITO` SUCCESS en `registro_auditoria`
    con el actor correcto.
  - `cancelarSuscripcionPush` real → fila `PWA_PUSH_BAJA` SUCCESS.
  - user inexistente → FK rechaza el upsert → error, y NINGUNA fila queda en BD.
- Suite completa API: 1485/1485. `nest build` limpio. `prisma validate` OK.
- `migrate diff` local-vs-schema = cero; dump regenerado coincide (diff = cero).

## Pendientes / riesgos

- **Descubrimiento de BD:** `registro_auditoria.actor_user_id` tiene FK a `users` —
  una fila de auditoría con actor fantasma NO puede persistir (AuditService la traga
  por diseño). El FAIL auditado con actor real queda cubierto por el spec unitario;
  con user inexistente el integration verifica el rechazo, no la fila FAIL.
- **BUG del script `regenerar-dump-integracion.ps1`** (preexistente, NO arreglado sin
  autorización): el path por defecto usa `..\..` desde `apps/api/scripts` y cae en
  `apps/svr_erp_export` (inexistente) — hoy se regeneró pasando `-Salida` explícito a
  la raíz. Corregir el default del script cuando toque tocarlo.
- Si el servidor ya tenía el enum sin los 2 valores (no puede: la migración es nueva),
  nada que hacer; en entornos con la BD vieja, `migrate deploy` la agrega.
