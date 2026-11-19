# Throttler: el mensaje 429 dice el tiempo real de bloqueo

**Fecha:** 2026-11-18
**Autor:** agente

## Cambios realizados
- `ThrottlerExceptionFilter` siempre caía al fallback de 60 segundos porque `ThrottlerException.getResponse()` devuelve un string, nunca un objeto con `ttl`. El fallback ahora lee `THROTTLE_SHORT_TTL_MIN` (default 15) y lo convierte a segundos; el mensaje se expresa en minutos, coherente con los mensajes de `auth.service.ts`.
- `details.retryAfter` pasa de 60 a 900 con la configuración vigente (15 min).
- El spec fija el valor esperado leyendo la misma env, para que no se rompa si cambia el TTL.

## Cosas nuevas
- Ninguna.

## Archivos tocados
- `apps/api/src/common/filters/throttler-exception.filter.ts` (modificado)
- `apps/api/src/common/filters/throttler-exception.filter.spec.ts` (modificado)
- `historial-cambios/2026-11-18-throttler-mensaje-real.md` (creado)

## Pruebas / verificación
- `cd apps/api; npx jest --runInBand src/common/filters/throttler-exception.filter.spec.ts` → 1 suite, 2/2 pruebas, exit 0.
- `cd apps/api; npx tsc --noEmit` → exit 0.

## Pendientes y riesgos
- Cambio menor de contrato en el cuerpo del 429: el frontend muestra `error.message` y no lee `details.retryAfter`, así que no rompe nada conocido.
- La política `short` solo se aplica en `AuthController`. No se tocó `.env` ni `app.module.ts`.
- La API corriente en `:3001` sigue con el proceso anterior: el nuevo mensaje se activa al reiniciarla.
