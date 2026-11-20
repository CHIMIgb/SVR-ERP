# Plan — Notificaciones PUSH en la PWA (Web Push, «como cualquier app del teléfono»)

**Fecha:** 2026-11-20
**Estado:** plan por fases — NO se escribió código para estas fases (solo el rediseño del centro in-app, commit hermano).
**Alcance:** notificaciones que llegan con la app CERRADA como notificaciones del sistema, vía **Web Push** (el estándar de PWAs).

## Por qué Web Push (y no la alternativa fácil)

`new Notification()` desde la página solo funciona con la app abierta en
primer plano — NO es «como cualquier app del teléfono». Web Push sí: el
service worker recibe el mensaje aunque la app esté cerrada y el SO lo
muestra como notificación del sistema. Requiere HTTPS (ya se cumple con
mkcert) y permiso del usuario otorgado en un gesto.

## Restricciones duras (leer antes de ejecutar)

1. **iOS:** solo **iOS 16.4+** y **con la PWA instalada en pantalla de
   inicio** (ustedes ya instalan con mkcert + «Instalar»). El permiso se
   pide durante un gesto del usuario (tap) — jamás en carga automática.
2. **Service worker:** el shell registra `/sw.js` SOLO en producción
   (cache-first de Turbopack rompía hidratación en dev). Hoy el teléfono
   corre `dev:https:ip` (NODE_ENV development) → **sin SW → sin push en
   dev**. Para probar push hay que servir un **build de producción por
   HTTPS**, o evaluar habilitar el SW en dev con los riesgos conocidos de JS
   viejo.
3. **«Para todos»:** un push a alcance global es para TODOS los usuarios del
   sistema — puede ser pesado. Resolver destinatarios igual que el buzón
   (personal/torre/rol/global → usuarios), excluyendo al actor.
4. **Transporte:** 10 MB de adjunto ≈ 13.4 MB de base64 — cuando exista
   nginx/Railway, `client_max_body_size` debe cubrirlo (ya anotado en
   `2026-11-20-limite-fotos-10mb.md`).

## Fases

### Fase a — infraestructura backend
- Dependencia `web-push` + claves **VAPID** en `.env`
  (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`) — jamás en el repo.
- Migración: tabla `push_suscripciones` (endpoint único, `p256dh`, `auth`,
  `user_id`, `creado_en`) + modelo en `schema.prisma`.
- Endpoints: `POST /notificaciones/push-suscripcion` (guarda/actualiza la
  suscripción del usuario autenticado) y `DELETE` (baja). El permiso de
  lectura del buzón (`sistema/notificaciones/ver`) es el mismo que ya tienen
  los 6 roles.

### Fase b — hook de envío en `NotificacionesService.emitir()`
- Tras crear la fila en BD, resolver los **usuarios del alcance**
  (personal → 1; torre → usuarios con esa torre; rol → usuarios del rol;
  global → todos), **excluyendo al actor** (`creado_por`), y enviar el push
  con `web-push` (best-effort: fallo solo loggea, igual que el insert).
- Limpieza: una suscripción que responda **410 Gone** se elimina.

### Fase c — service worker + UX en la PWA
- `/sw.js`: handlers `push` (mostrar la notificación con título/cuerpo del
  payload) y `notificationclick` (abrir/focus de la app — idealmente a
  `/m/reportes` si la referencia lo indica).
- Cliente: petición de permiso con un **botón** (en `/m/perfil` o al abrir la
  campana por primera vez — gesto del usuario), envío de la suscripción al
  API, y el badge de la campana queda como hoy (el polling del centro no se
  va — es la capa in-app).

### Fase d — verificación en dispositivos
- Android Chrome (instalada): enviar un aviso con la app cerrada.
- iPhone real (iOS 16.4+, instalada): mismo escenario.
- Escritorio Chrome/Edge como tercer caso.
- Si una fase falla en iOS, documentar la limitación con evidencia antes de
  intentar workarounds.

## Fuera de alcance (explícito)
- No se toca el enum `TipoNotificacion` ni el catálogo (el push reenvía el
  título/cuerpo que ya construye `construirAlerta`).
- No se reemplaza el polling del centro: el push es la capa «app cerrada».
- No se implementan deep-links por `referencia_id` aquí (mejora ya identificada).
