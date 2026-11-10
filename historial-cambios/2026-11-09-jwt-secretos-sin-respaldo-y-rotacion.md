# JWT: sin secretos de respaldo en el código + rotación de los secretos filtrados

**Fecha:** 2026-11-09
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

Hallazgo de la revisión del PR #16 (Observación del propio revisor Humano): el
secreto del JWT tenía **valor de respaldo escrito en el código** en
`auth.module.ts`, `auth.service.ts`, `jwt.strategy.ts`, `jwt-refresh.strategy.ts`
y `cotizaciones.e2e.spec.ts` (`svr-erp-*-secret*, con 'k3y-2026-prod' pegado en
la especificación de integración junto al secreto del `.env` local). El repo es
público: un servidor arrancado sin variables podría aceptar tokens falsificados
con el secreto público (nivel 100 = Administrador).

1. **Fail-fast:** `main.ts` ahora detiene el arranque si
   `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` no existen o miden
   < 32 caracteres, con mensaje de causa (antes: corrupción silenciosa).
2. **Fuera los respaldos (8 spots):** auth.module, auth.service (create/refresh
   y verify de blacklist), ambas strategies y cotizaciones.e2e.spec
   (`process.env.JWT_*` directo, sin fallback).
3. **Fuera el literal que filtraba el secreto local:**
   `auth.integration.spec.ts` ya no menciona `k3y-2026-prod`; los secretos se
   sirven desde el `.env` (dotenv ya lo carga via `setupFiles`).
4. **Rotación de los secretos locales** (`apps/api/.env` — archivo NO trackeado,
   verificado con `git check-ignore`): los dos valores anteriores quedaron
   invalidados porque el de access era el mismo literal público — cualquier
   token firmado con él era falsificable. Utilidad nueva:
   `scripts/rotate-jwt-secrets.js` (regenera y escribe en .env sin trackear).
5. Target specs actualizados: `jwt.strategy.spec.ts` define su secreto de prueba
   en `beforeAll` (la estrategia es fail-fast sin entorno).

## Archivos tocados

- `apps/api/src/main.ts`, `auth.module.ts`, `auth.service.ts`,
  `strategies/jwt.strategy.ts`, `strategies/jwt-refresh.strategy.ts`,
  `auth.integration.spec.ts`, `strategies/jwt.strategy.spec.ts`,
  `test/cotizaciones.e2e.spec.ts`
- `apps/api/.env` (rotación local, no trackeado)
- `apps/api/scripts/rotate-jwt-secrets.js` (nueva, no trackeada)

## Pruebas / verificación

- Unitarios auth **64/64**, integración real **6/6** (con los secretos nuevos
  rotados cargados desde `.env` via dotenv), cotizaciones e2e **6/6**.
- `tsc --noEmit` OK; grep del repo: cero referencias a los literales viejos.
- El `.env` con los valores nuevos quedó sin alterar fuera de las 2 lineas JWT.

## Pendientes y riesgos

- **Rotación implica re-entrar sesión:** los tokens con los secretos anteriores
  (incluidos los del repo antes del fix) son inválidos — en cualquier servidor
  desplegado: definir los nuevos en su entorno y reiniciar (el fail-fast lo
  advierte en claro).
- La historia de git conserva los secretos viejos: no es un problema ahora que
  están rotados (un secreto filtrado solo es un problem si sigue en uso).
- `.env.example` ya trae `JWT_ACCESS_SECRET=` / `JWT_REFRESH_SECRET=` vacíos con
  comentario — no cambió.
