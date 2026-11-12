# 2026-11-11 — Mediano review PR #18: la cola offline se limpia al cerrar sesión

## Problema (review del PR #18, mediano)

La base `svr-pwa` (IndexedDB, `lib/pwa/offline.ts`) no se limpiaba al cerrar
sesión: en un teléfono compartido, lo pendiente de un trabajador se habría
enviado con el token del siguiente.

## Cambios

- `lib/pwa/offline.ts` — `limpiarCola()`: `store.clear()` del outbox.
- `providers/AuthProvider.tsx` — `logout()` la llama en el `finally`
  (fire-and-forget con `catch` vacío: el logout NUNCA falla por la limpieza).
  Cubre el logout explícito y los `logout()` automáticos de sesión muerta.
  El error de red NO limpia (protege capturas pendientes de un trabajador
  con mala señal).

## Verificación / pruebas

- `npx tsc --noEmit` limpio.
- Smoke manual pendiente (no hay infra front): capturar algo sin señal →
  logout → login con otro usuario → el badge de pendientes debe estar en 0.

## Pendientes / riesgos

- Si un trabajador cierra sesión con capturas sin sincronizar, se pierden
  (es el comportamiento pedido: la cola es del dispositivo, no del usuario).
- Si en el futuro la captura se asocia al usuario en la cola, esto cambia a
  "borrar solo las del usuario" — por ahora el outbox no guarda identidad.
