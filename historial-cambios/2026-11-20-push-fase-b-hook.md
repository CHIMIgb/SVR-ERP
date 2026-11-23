# Push fase b (commit b.2) — el hook en emitir() + VAPID + clave pública

**Fecha:** 2026-11-20
**Autor:** agente
**Plan de origen:** fase (b) autorizada (tras `54a04b17`)

## Cambios realizados
- **El hook en `emitir()`:** tras el insert exitoso, `void this.enviarPushesDeEmision(input)` — **fire-and-forget**: resuelve el alcance y envía el push; el método se traga sus propios errores, el fallo del push JAMÁS toca el negocio. Si el insert falla, el push tampoco se dispara (test).
- **`GET /notificaciones/push-vapid-publica`:** la clave pública VAPID para que el navegador genere la suscripción (fase c). No es secreta pero vive bajo auth; sin VAPID configurado devuelve null.
- **Claves VAPID generadas localmente** (`npx web-push generate-vapid-keys`) en `apps/api/.env` (gitignored): `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
- **Tests:**
  - Unit: 2 nuevos — el hook dispara el push con el payload JSON exacto tras el insert (personal: solo la suscripción del destinatario) y si la BD del insert falla el push tampoco se dispara.
  - Integración (BD real + web-push simulado): emitir personal llega al endpoint del suscrito con el payload; emitir con audiencia de TORRE llega a los suscritos de esa torre.
- **Hallazgo de depuración (documentado):** la prueba de torre fallaba porque usaba `creadoPor: 'user-ajeno'` — un id inexistente que viola la FK de `notificaciones.creado_por` → el insert falla → `emitir` retorna antes del push (best-effort silencioso). El código era correcto; el test usaba un actor inexistente. Corregido con un usuario real.

## Verificación / pruebas
- Unit notificaciones: 40/40. Integración (BD real): 5/5.
- `npm run build`: OK. `git diff --check`: sin errores.
- Depuración instrumentada (console.log temporales en service + test) eliminada por completo.

## Archivos tocados
- `apps/api/src/notificaciones/notificaciones.service.ts`
- `apps/api/src/notificaciones/notificaciones.controller.ts`
- `apps/api/src/notificaciones/notificaciones.service.spec.ts`
- `apps/api/src/notificaciones/notificaciones.integration.spec.ts`
- `apps/api/.env` (claves VAPID locales — gitignored)
- `historial-cambios/2026-11-20-push-fase-b-hook.md` (creado)

## Pendientes y riesgos
- Falta la fase (c): handlers `push`/`notificationclick` en `/sw.js`, UX de
  permiso/suscripción en la PWA (botón con gesto) y consumo de
  `GET /notificaciones/push-vapid-publica` — requiere build de producción
  en el teléfono (el SW no corre en dev).
- Sin push: el commit queda local.
