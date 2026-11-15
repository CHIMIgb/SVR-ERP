# trust proxy en la API — requisito de despliegue tras proxy (Railway)

**Fecha:** 2026-11-15
**Autor:** Agente (autorizado por el usuario; primera de las 2 líneas bloqueantes para el despliegue en Railway)

## Cambio

`apps/api/src/main.ts`: `app.getHttpAdapter().getInstance().set('trust proxy', 1)` justo tras
`NestFactory.create`, con comentario de por qué.

**Por qué:** el bloqueo escalonado por IP del login y la tabla `usuarios_bloqueados` usan
`req.ip`. Sin `trust proxy`, detrás del proxy de Railway `req.ip` sería la IP del proxy para
TODOS los usuarios: un solo mal actor bloquearía el login de toda la empresa (regla
documentada en README/AGENTS, "Despliegue con servidor" — confiar SOLO el primer salto).

## Verificación

- `npm run build` (nest build) ✓ · `npx tsc --noEmit` (api) ✓
- Smoke de arranque real: `node dist/src/main.js` con `PORT=3101` → Nest boot completo
  (módulos inicializados), proceso detenido después ✓
- Unitarias: 1415/1417 — las 2 fallas son la bomba de tiempo preexistente de
  `cobranza.service.spec.ts` (fixture `2026-10-01`), sin relación con este cambio.
- Lint: la API no tiene configuración eslint propia (el `lint` de turbo cubre web/shared) — gate no aplicable.

## Pendientes / riesgos

- El efecto real sobre `req.ip` no es verificable sin un proxy delante; se valida al
  desplegar (login fallido ×5 debe bloquear la IP del cliente real, no la del proxy).
- Con `trust proxy 1`, si algún día se pone nginx DELANTE del proxy de Railway (doble salto),
  la config tendría que revisarse — documentado en README "Despliegue con servidor".
