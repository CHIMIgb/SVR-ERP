# SW en modo dev + campana en tiempo real (postMessage del push)

**Fecha:** 2026-11-20
**Autor:** agente
**Plan de origen:** fase c del push — fixes del reporte del usuario: «las notificaciones no llegan como burbuja de aplicación normal» + «las notificaciones internas deben aparecer en tiempo real en la campanita»

## Causas raíz encontradas
1. **La notificación genérica ("SVR — Presiona para copiar la URL")** es el
   FALLBACK de Chrome: el SW registrado en el teléfono es el VIEJO (sin
   handlers de push) → llegó el push y no había listener → Chrome mostró su
   notificación genérica sin ícono ni título. Segunda capa: en dev el shell
   NO registraba el SW (por el cache-first de Turbopack) → en
   `dev:https:ip` nunca hubo SW nuevo ni forma de suscribirse (el banner de
   activación se ocultaba con `sin-sw`).
2. **La campana lenta:** el provider hace polling de 60 s — sin un canal
   instantáneo.

## Cambios realizados
- **`(pwa)/layout.tsx`:** el SW ahora se registra **TAMBIÉN en dev**, con
  `?modo=dev` (y se retiró el desregistro de SWs en dev).
- **`public/sw.js`:** consciente del modo — `MODO_DEV` (por query del
  script) **omite TODOS los handlers de caché** (los chunks de Turbopack no
  llevan hash y se pudrirían en su cache-first — el riesgo original sigue
  cubierto) pero MANTIENE `push` + `notificationclick` → el push es
  testeable en `dev:https:ip`. El `activate` limpia cachés viejas en ambos
  modos.
- **`push` handler:** tras `showNotification`, hace
  `clients.matchAll()` → `postMessage({tipo:'notificacion-nueva', titulo,
  cuerpo})` a las ventanas abiertas.
- **`NotificationContext.tsx` (compartido):** escucha el `message` del SW y
  **recarga el buzón al instante** — la campana y la burbuja abierta se
  actualizan en tiempo real. El polling de 60 s queda como respaldo.
  Cambio aditivo en el archivo compartido (el escritorio también se
  beneficiaría si tuviera suscripciones).

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 38 warnings
  (38 = 37 + 1 preexistente de SearchBar ya contado antes).
- `git diff --check`: sin errores.
- **Smoke en el teléfono (procedimiento del SW viejo):** cerrar la PWA y
  reabrirla 2 veces (el SW nuevo con skipWaiting reemplaza al viejo), luego:
  campana → banner «Activar» → permiso → suscripción → emitir un aviso
  (aceptar un reporte) → notificación del sistema con ícono/título/cuerpo
  Y la campana in-app se actualiza al instante.

## Archivos tocados
- `apps/web/src/app/(pwa)/layout.tsx`
- `apps/web/public/sw.js`
- `apps/web/src/components/layout/NotificationContext.tsx`
- `historial-cambios/2026-11-20-sw-dev-tiempo-real.md` (creado)

## Pendientes y riesgos
- El SW en dev NO cachea: la PWA en dev no funciona offline (por diseño —
  el offline del shell es de producción; la captura offline sigue viva por
  IndexedDB).
- El SW viejo del teléfono reemplaza al nuevo solo tras el ciclo de
  actualización del navegador; si persiste el genérico, desinstalar y
  reinstalar la PWA.
- Sin push: el commit queda local.
