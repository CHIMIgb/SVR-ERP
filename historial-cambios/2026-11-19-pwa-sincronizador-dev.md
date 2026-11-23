# Sincronizador PWA corre también en desarrollo (tarea #3 del plan de saneamiento offline)

**Fecha:** 2026-11-19
**Autor:** agente
**Plan de origen:** `docs-planes/docs-pwa/PLAN-SINCRONIZACION-OFFLINE-PWA-2026-11-19.md` (punto 3)

## Cambios realizados
- El `useEffect` de `(pwa)/layout.tsx` que mezclaba dos responsabilidades se separó en dos:
  - **Efecto A — service worker (solo producción):** mantiene intactos la guarda `!("serviceWorker" in navigator)`, el bloque DEV de desregistro de SWs + borrado de cachés, y el `register("/sw.js")` de producción. Sin cambios de fondo.
  - **Efecto B — sincronizador (todos los entornos):** `iniciarSincronizador()` + su cleanup `parar()`, SIN guarda de `serviceWorker` (los `useEffect` solo corren en el navegador). Antes el `return` de la rama DEV (línea 68) y la guarda de la 62 impedían llegar a la línea 71 en desarrollo.
- Comentario del bloque actualizado: el SW sigue prod-only por el cache-first de Turbopack; el sincronizador corre también en DEV porque no depende del SW (`navigator.onLine` + evento `online` + intervalo de 2 min).

## Cosas nuevas
- Primera tarea del plan de saneamiento offline ejecutada; quedan #2 (refresh del 401 en el sincronizador) y #1 (estado por registro y trato del 409).

## Archivos tocados
- `apps/web/src/app/(pwa)/layout.tsx`
- `historial-cambios/2026-11-19-pwa-sincronizador-dev.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit` en `apps/web`: 0 errores.
- `npm run lint` en `apps/web`: 0 errores, 37 warnings preexistentes (deuda conocida, no bloquean).
- `git diff --check`: sin errores.
- **Smoke manual pendiente de ejecutar en la sesión de pruebas:** con `npm run dev` + API en `:3001`, insertar a mano un item en IndexedDB (`svr-pwa` → `outbox`, forma de `ElementoCola`), pasar a offline, reconectar y confirmar que el item desaparece y que no hay SW registrado en DEV. Hoy ninguna vista llama a `encolar()`, así que el smoke requiere inserción manual.

## Pendientes y riesgos
- No se probó en teléfono ni APK. El ciclo real offline se ejercerá al conectar `/m/reportes`.
- La pasada inicial corre aunque la sesión no esté inicializada (el efecto no depende de `isInitialized`): sin token el item queda en `error` y reintenta en la próxima pasada — mismo comportamiento que ya tenía en producción, no se gateó.
- El callback `onCambio` de `iniciarSincronizador()` sigue sin usarse (el badge se alimenta de `useCola` con su propio intervalo de 30 s): conectarlo es parte de la tarea #1, no de esta.
- Sin push: el commit queda local, como indica la regla del repo.
