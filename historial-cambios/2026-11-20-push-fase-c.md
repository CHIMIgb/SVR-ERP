# Push fase c — SW handlers + suscripción en la PWA

**Fecha:** 2026-11-20
**Autor:** agente
**Plan de origen:** fase (c) autorizada (tras la fase b `54a04b17`/`1a79c670`)

## Cambios realizados
- **`public/sw.js`** — los 2 handlers que faltaban:
  - `push`: extrae el payload JSON del API (fallback si no es JSON) y muestra
    la notificación del sistema (`showNotification` con `icon`/`badge`
    `/icons/pwa-192.png` y `data.referenciaTipo`).
  - `notificationclick`: cierra la notificación y enfoca la ventana abierta de
    la app (o la abre) — a `/m/reportes` si la referencia lo indica, si no a `/m`.
- **`lib/pwa/push.ts` (nuevo):** `estadoPush()` (5 estados tipados: sin-sw,
  no-soportado, bloqueadas, activadas, por-activar) y `activarPush()` — el
  **GESTO del usuario** dispara `requestPermission()`, la suscripción con la
  clave pública VAPID (convertida URL-safe → Uint8Array) y el POST a
  `/notificaciones/push-suscripcion` (fase a). Errores devueltos como
  mensajes accionables, sin excepciones fuera.
- **`lib/api.ts`:** `notificacionesApi.vapidPublica()` (GET) y
  `.suscribirPush()` (POST) — consume los endpoints de la fase a.
- **`NotificacionesModal`:** **banner de activación** al inicio con los 4
  estados del permiso: `por-activar` → botón «Activar» (gesto);
  `activadas` → confirmación; `bloqueadas` → instrucción de desbloqueo;
  `no-soportado` → «requiere la app instalada»; y `sin-sw` (dev) → sin
  banner. Éxito/error → toasts (`showToast` del kit).
- `COMPONENTS-PWA.md` §8 actualizada (banner + estados).

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores (2 arreglos de tipos: `showToast` sin
  instanciar y `Uint8Array<ArrayBuffer>` para `applicationServerKey`).
- `npm run lint`: 0 errores, 37 warnings preexistentes. `git diff --check`: sin errores.
- **Smoke pendiente (requiere build de producción — el SW no corre en dev):**
  escritorio Chrome con `npm run build && npm run start` → abrir el centro →
  «Activar» → permiso → suscripción en BD (`push_suscripciones`) → emitir un
  aviso por API → la notificación del SO aparece con la app cerrada → tap la
  reabre en /m/reportes. En el teléfono: el mismo flujo con la PWA instalada
  por HTTPS de LAN (iOS exige 16.4+ y instalada).

## Archivos tocados
- `apps/web/public/sw.js`
- `apps/web/src/lib/pwa/push.ts` (nuevo)
- `apps/web/src/lib/api.ts`
- `apps/web/src/components/pwa/NotificacionesModal/NotificacionesModal.tsx` + `.styles.ts`
- `COMPONENTS-PWA.md` (§8)
- `docs-planes/docs-pwa/PLAN-NOTIFICACIONES-PUSH-PWA.md` (estado: fase c implementada, smoke pendiente)
- `historial-cambios/2026-11-20-push-fase-c.md` (creado)

## Pendientes y riesgos
- **El smoke en dispositivos es el paso final** y requiere producción+HTTPS
  en el teléfono (el procedimiento exacto queda para el usuario — no agregué
  tooling de HTTPS sin autorización).
- El SW nuevo solo llega a los clientes tras el reload del SW (el shell lo
  registra en producción; el skipWaiting ya lo activa de inmediato).
- Sin push: el commit queda local.
