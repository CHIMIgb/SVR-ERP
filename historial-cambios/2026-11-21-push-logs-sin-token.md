# Push: logs sin token de suscripción y con la causa real del 500

**Fecha:** 2026-11-21
**Autor:** SVR-ERP Dev (agente)

## Cambios realizados
- Menor 5 de la segunda revisión del PR #23, las dos partes:
  1. `suscribirPush`: el `catch` ahora LOGUEA el error original
     (`logger.error` con el mensaje) antes del `failir()` con
     `PUSH_SUSCRIPCION_FALLIDA` — antes el 500 no decía qué falló en el
     upsert.
  2. Los logs de push ya no imprimen el endpoint completo: contiene el
     token de la suscripción (`fcm/send/<token>`). Nuevo helper
     `hostDelEndpoint()` — solo el host va al log. Aplicado al warn del
     envío fallido Y al de "endpoint fuera de la lista blanca" (mismo
     defecto de clase, dos líneas más abajo en el mismo archivo).

## Archivos tocados
- apps/api/src/notificaciones/notificaciones.service.ts (modificado)
- apps/api/src/notificaciones/notificaciones.service.spec.ts (aserción del log)

## Pruebas / verificación
- `npm run build` (apps/api): OK.
- `npm test -- --runInBand notificaciones.service`: 33/33 — el test del
  upsert fallido ahora también aserta `logger.error` con la causa real
  ("BD caída") vía spyOn de Logger.prototype.
- `git diff --check`: limpio.
- No se corrió la suite completa de la API ni la integration de este
  módulo (el cambio es de logs; CI la corre en PR).

## Pendientes y riesgos
- Ningún cambio de comportamiento: los endpoints seguían bien en BD; solo
  el diagnóstico en logs cambió. Riesgo bajo.
