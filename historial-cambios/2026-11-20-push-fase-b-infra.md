# Push fase b (commit b.1) — infraestructura de envío Web Push

**Fecha:** 2026-11-20
**Autor:** agente
**Plan de origen:** fase (b) autorizada (tras la fase a `9f442bf6`/`cc34cae6`)

## Cambios realizados
- **Dependencia `web-push` (4.0.0) + `@types/web-push`** en `apps/api`.
- **`notificaciones/push.config.ts` (nuevo):** lectura **perezosa** de las
  claves VAPID (`VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` de
  `.env`). Sin VAPID configurado → el push se salta con warn: build, CI y
  tests no crashean.
- **`NotificacionesService`:**
  - `usuariosDelAlcance(input, creadoPor)`: convierte la audiencia de la fila
    a USUARIOS concretos (personal → 1; torre → `users` activos de esa torre;
    rol → `users_roles` activos; global → todos los activos) y **excluye al
    actor** — mismas reglas que el buzón.
  - `enviarPushesBestEffort(notificacion, usuarios)`: busca suscripciones por
    usuario, configura VAPID y envía con `Promise.allSettled` — **410/404 →
    limpia la suscripción muerta**, otros errores → warn; devuelve
    `{enviados, limpiadas}`.
- **Spec:** mock del módulo `web-push` + 7 tests nuevos (resolvedor por
  torre/rol/global con exclusión del actor, envío sin VAPID, envío con
  payload JSON exacto, 410 limpia, 5xx solo warn). Corregido el mock de
  `users_roles` (el resolvedor mapea `user_id`, no `rol_id`).

## Verificación / pruebas
- Unit notificaciones: 38/38 (incluye catálogo). `npm run build`: OK.
- `npx tsc --noEmit`: 0 errores. `git diff --check`: sin errores.

## Archivos tocados
- `apps/api/package.json` + lockfile (`web-push`, `@types/web-push`)
- `apps/api/src/notificaciones/push.config.ts` (nuevo)
- `apps/api/src/notificaciones/notificaciones.service.ts`
- `apps/api/src/notificaciones/notificaciones.service.spec.ts`
- `historial-cambios/2026-11-20-push-fase-b-infra.md` (creado)

## Pendientes y riesgos
- `enviarPushesDeEmision` (el hook fire-and-forget desde `emitir()`) viene en
  el commit (b.2) junto con las claves VAPID reales en `.env` y el endpoint
  `GET /notificaciones/push-vapid-publica`.
- El envío es paralelo sin límite de concurrencia: con un padrón grande de
  «para todos» habrá que acotarlo (anotado en el plan).
- Sin push: el commit queda local.
