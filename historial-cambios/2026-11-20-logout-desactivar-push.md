# 2026-11-20 — Logout desuscribe el push del teléfono — menor 4 PR #23

## Cambios realizados

**Menor 4 de la review del PR #23, dos desincronías del push:**
1. Al cerrar sesión NO había `pushManager.unsubscribe()` — en un teléfono compartido la
   suscripción quedaba ligada al usuario anterior (seguía recibiendo cierres de caja,
   nómina pagada...).
2. `estadoPush()` decía "activadas" aunque el ALTA en el server hubiera fallado — el
   navegador estaba suscrito localmente pero el server no registraba nada.

Fix:
- **`lib/pwa/push.ts` — `desactivarPush()`:** baja en el server (con el token VIVO) +
  `pushManager.unsubscribe()` local. Best-effort completo: nunca rompe el logout.
- **`activarPush()`:** si el alta en el server falla → `unsubscribe()` local ANTES de
  regresar el error — el estado del navegador queda alineado con el server (la próxima
  vez `estadoPush()` dirá "por-activar", no "activadas" mentiroso).
- **`AuthProvider.tsx` — `logout()`:** `desactivarPush().catch(() => {})` ANTES de
  `authApi.logout()` — el logout revoca el token (blacklist por jti) y la baja en el
  server lo necesita vivo. Orden: desactivarPush → authApi.logout → clearTokens →
  limpiarCola (invariante previa intacta).
- **`lib/api.ts`:** `notificacionesApi.cancelarPush({ endpoint })` (el endpoint del
  backend ya existía, el front nunca lo llamó) + `apiClient.delete(endpoint, body?,
  options?)` — el 2º parámetro nuevo es opcional y los 19 callers existentes solo
  pasan endpoint (compatible; verifico con grep antes de tocar).

## Cosas nuevas

- `desactivarPush()` (lib) — el flujo inverso de `activarPush()`.
- `notificacionesApi.cancelarPush` + body opcional en `apiClient.delete`.

## Archivos tocados

- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/pwa/push.ts`
- `apps/web/src/providers/AuthProvider.tsx` (pieza compartida de sesión — excepción
  permitida de la regla escritorio/PWA)

## Verificación / pruebas

- `npx tsc --noEmit` (apps/web) → limpio.
- `npm run lint` (apps/web) → 0 errores, 38 warnings (baseline de la rama).
- `npm test` (apps/web) → 12/12.
- Sin tests automatizados del flujo (jsdom no tiene PushManager/SW; no hay infra para
  mockear navigator en este repo) — el gate automático queda en tsc/lint y el smoke
  manual es la verificación real.

## Pendientes / riesgos

- **Smoke manual en dispositivo (el que valida este cambio):** activar push → cerrar
  sesión → verificar en BD (`push_suscripciones` por endpoint) que la fila desapareció
  y que el teléfono ya no recibe push; volver a entrar y activar → la suscripción
  vuelve con el usuario nuevo (upsert).
- Si el logout ocurre SIN señal: la baja en server falla y `unsubscribe` local sí se
  ejecuta — la fila queda en BD apuntando al usuario anterior pero con la suscripción
  muerta del navegador; el próximo login/activar reasigna (upsert por endpoint).
  Escenario aceptable, documentado.
