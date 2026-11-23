# Push fase a — tabla `push_suscripciones` + API de suscripción

**Fecha:** 2026-11-20
**Autor:** agente
**Plan de origen:** `docs-planes/docs-pwa/PLAN-NOTIFICACIONES-PUSH-PWA.md` (fase a, con la enmienda aprobada: `web-push` y VAPID se mueven a la fase b — para guardar suscripciones no se necesitan)

## Cambios realizados
- **`schema.prisma`:** modelo **`push_suscripciones`** (id UUID, `user_id` FK a
  `users` con `onDelete: Restrict`, `endpoint` UNIQUE — uno por
  dispositivo/permiso del navegador, `p256dh`, `auth`, `creado_en`) + la
  relación inversa en `users`. Convención de vecinos: español como
  `notificaciones_lecturas`.
- **Migración `20261120010000_push_suscripciones`** aplicada con el
  procedimiento del repo (`migrate diff` + `psql` + `migrate resolve`;
  `migrate dev` sigue roto por el baseline). Cliente Prisma regenerado;
  `migrate status`: 104 migraciones, BD al día.
- **DTOs** (`dto/push.dto.ts`): `SuscripcionPushDto` (`endpoint` HTTPS +
  `llaves {p256dh, auth}` con `@IsDefined` + `@ValidateNested` — el fix nació
  del test: ValidateNested solo no valida si la prop no viene) y
  `BajaSuscripcionPushDto` (endpoint). Con su spec (`push.dto.spec.ts`,
  `import 'reflect-metadata'` necesario para `@Type`).
- **API:** `NotificacionesService.suscribirPush(userId, dto)` (upsert por
  endpoint: si ya existía se reasigna al usuario con llaves nuevas) y
  `cancelarSuscripcionPush(userId, endpoint)` (deleteMany acotado a endpoint
  + usuario — solo la propia). Rutas `POST /notificaciones/push-suscripcion`
  (201) y `DELETE /notificaciones/push-suscripcion` — heredan el permiso de
  clase `sistema/notificaciones/ver` que los 6 roles ya tienen. El
  `user_id` SIEMPRE viene del JWT (nunca del body).
- No se agrega todavía la dependencia `web-push` ni VAPID (fase b — el
  envío es lo que las necesita).

## Verificación / pruebas
- `npx prisma validate`: OK. `npm run build`: OK. `npx tsc --noEmit`: 0 errores.
- Unit notificaciones: 31/31 (3 nuevos: upsert reasigna, cancelación solo
  propia, best-effort con NotFound si la BD falla) + DTO spec 6/6 incluidos.
- **Integración (BD real):** 3/3 — suscribir deja la fila con su usuario;
  re-suscribir el MISMO endpoint lo reasigna (1 fila, sin duplicados);
  cancelar SOLO borra la propia (la ajena devuelve 0). Limpieza FK-safe por
  endpoint en el afterAll.

## Archivos tocados
- `apps/api/prisma/schema.prisma` + `migrations/20261120010000_push_suscripciones/migration.sql`
- `apps/api/src/notificaciones/dto/push.dto.ts` + `push.dto.spec.ts` (nuevos)
- `apps/api/src/notificaciones/notificaciones.service.ts` + spec
- `apps/api/src/notificaciones/notificaciones.controller.ts`
- `apps/api/src/notificaciones/notificaciones.integration.spec.ts` (nuevo)
- `historial-cambios/2026-11-20-push-fase-a.md` (creado)

## Pendientes y riesgos
- **Dump de CI:** el commit 2 de esta fase regenera `svr_erp_sin_postgis.sql`
  con la tabla nueva (si no, el job `integration` falla el `migrate diff`).
- Sin push: el commit queda local.
