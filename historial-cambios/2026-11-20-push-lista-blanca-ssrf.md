# 2026-11-20 — Push: lista blanca de hosts anti-SSRF + timeout (bloqueante 2 PR #23)

## Cambios realizados

**Bloqueante 2 de la review del PR #23 (SSRF):** el DTO solo exigía `^https:\/\/.+`, así
que cualquier usuario autenticado podía registrar `https://192.168.0.x:puerto/...` como
"suscripción" y el servidor le hacía POST en cada notificación emitida. Además
`webpush.sendNotification` corría sin timeout — un endpoint lento colgaba la promesa.

Fix (validación en el DTO + OTRA VEZ al enviar, fuente única):

- **Archivo nuevo `apps/api/src/notificaciones/push-hosts.ts`**: `esEndpointPushPermitido()`
  — parsea la URL, exige `https:` y valida el hostname contra la lista blanca de
  servicios push: `fcm.googleapis.com` (FCM), `push.services.mozilla.com` (Firefox),
  `notify.windows.com` (Edge/Windows) y `push.apple.com` (APNs). Host exacto o
  subdominio (`endsWith('.'+sufijo)` bloquea el lookalike `evil-fcm.googleapis.com`);
  URL malformada → `false`.
- **`dto/push.dto.ts`**: `@Validate(EndpointPushPermitido)` en `SuscripcionPushDto` y
  `BajaSuscripcionPushDto` (además del `@Matches` https que ya había), con mensaje en
  español: "endpoint debe pertenecer a un servicio de push conocido".
- **`notificaciones.service.ts` — `enviarPushesBestEffort`**: filtro de lista blanca
  ANTES de enviar (defensa en profundidad: una suscripción guardada con la regla
  antigua queda excluida al enviar — warn y sin envío ni limpieza) y
  `{ timeout: 10000 }` como tercer argumento de `sendNotification` (web-push@4.0.0 lo
  soporta — verificado en el código de la librería).

## Cosas nuevas

- `push-hosts.ts` — única fuente de la lista blanca (DTO y service).
- Constraint de class-validator `EndpointPushPermitido` (privado al DTO).

## Archivos tocados

- `apps/api/src/notificaciones/push-hosts.ts` — NUEVO.
- `apps/api/src/notificaciones/dto/push.dto.ts`
- `apps/api/src/notificaciones/notificaciones.service.ts`
- `apps/api/src/notificaciones/dto/push.dto.spec.ts` — +5 casos.
- `apps/api/src/notificaciones/notificaciones.service.spec.ts` — 2 aserciones
  actualizadas (3er argumento timeout) + 1 test nuevo.

## Verificación / pruebas

- `npm test -- --runInBand notificaciones` → 45/45, incluye:
  - DTO: rechaza IP interna (`https://192.168.0.10:8080/`), rechaza lookalike
    (`evil-fcm.googleapis.com`), acepta subdominios legítimos (db5.notify.windows.com,
    updates.push.services.mozilla.com, api.push.apple.com:443) en ambos DTOs.
  - Service: endpoint no permitido en BD → no se envía, no se limpia, enviados 0.
- `npm test -- --runInBand` (suite completa API) → 1480/1480.
- `npm run build` (nest build) → limpio.

## Pendientes / riesgos

- Suscripciones ya guardadas con host fuera de la lista quedan DORMIDAS en BD (no se
  envían pero tampoco se borran): la limpieza natural es la de siempre (410 Gone) o un
  `deleteMany` manual si el cliente lo pide.
- No probado contra los servicios push reales (FCM/APNs en producción): la lista cubre
  los 4 proveedores estándar, pero si algún navegador usa un dominio nuevo habría que
  agregarlo al sufijo.
- Timeout 10 s elegido a criterio (sin dato real de latencia de FCM en producción);
  si los push grandes tardan más en el campo, ajustar ese número.
