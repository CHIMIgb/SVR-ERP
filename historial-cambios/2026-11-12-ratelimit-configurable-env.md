# 2026-11-12 — Rate limit del login configurable por env (429 en dev)

## Problema (reportado por el SVR)

Tras activar el rate limit real (fix #3 de la review), el login respondía
`429 RATE_LIMIT_EXCEEDED` en dev con cualquier usuario: las pruebas del día
ya habían consumido el límite de **5 logins / 15 min por IP** (el 'short').
El "60 segundos" del mensaje era el fallback del filtro (no sabe qué
throttler tronó) — el bloqueo real era de 15 min.

## Cambios

- `app.module.ts` — el throttler **'short'** (login/login-pin/register) es
  configurable por env: `THROTTLE_SHORT_LIMIT` (default **5**, el valor que
  pidió la review) y `THROTTLE_SHORT_TTL_MIN` (default 15). 'medium' y
  'long' sin cambio.
- `apps/api/.env` (local) — `THROTTLE_SHORT_LIMIT=50`: en dev las pruebas no
  se bloquean; el anti fuerza bruta REAL no se toca (bloqueo escalonado por
  cuenta a los 5 fallos + bloqueo por IP a los 10 fallos/15 min, ambos del
  `BloqueoService`).

## Verificación / pruebas

- `npx tsc --noEmit` limpio; `auth.controller.spec` 5/5 (el spec importa el
  ThrottlerModule con su propia config, no pasa por el env).
- `npx prisma validate` limpio.

## Pendientes / riesgos

- **Reiniciar la API** para que lea el env (el dev server del usuario).
- El mensaje del filtro sigue sin decir el tiempo real restante (fallback
  60 s) — cosmético, no bloquea; se arregla al tocar el filtro si molesta.
- En producción no definir `THROTTLE_SHORT_LIMIT` → queda el default 5/15
  min como pidió la review.
