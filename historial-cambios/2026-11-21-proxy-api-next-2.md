# 2026-11-21 — Rutas del proxy salen del `.env` + nota de Railway por servicio (2)

## Contexto

Seguimiento de `2026-11-21-proxy-api-next.md`. El usuario pidió que no queden
rutas hardcodeadas en el cambio nuevo: el `destination` del rewrite estaba
escrito a mano como `http://localhost:3001/api/:path*` en `next.config.ts`, y la
documentación no decía qué variable va en el servicio WEB ni cuál en la API de
Railway.

## Cambios realizados

1. **`apps/web/next.config.ts`** — el rewrite ya no contiene ninguna ruta
   literal. Tanto el `source` como el `destination` se derivan del entorno:
   - `source: \`${NEXT_PUBLIC_API_URL}/:path*\``
   - `destination: \`${API_PROXY_DESTINATION}/:path*\``
   - El proxy solo se activa si `NEXT_PUBLIC_API_URL` empieza por `/api` **y**
     `API_PROXY_DESTINATION` tiene valor (evita un rewrite roto a `/:path*` si
     falta la variable).
   - `API_PROXY_DESTINATION` **no** lleva prefijo `NEXT_PUBLIC_`: se evalúa en
     el servidor de Next y hornear un `localhost` en el bundle sería dañino.
2. **`apps/web/.env`** (local, no commiteado) — agregada
   `API_PROXY_DESTINATION=http://localhost:3001/api`.
3. **`apps/web/.env.example`** — agregada `API_PROXY_DESTINATION=` con su
   ejemplo y la advertencia de que es solo dev; agregada `NEXT_PUBLIC_TZ`
   (que faltaba y la regla de zona horaria exige). Arriba del todo, una nota de
   **Railway por servicio**:
   - **WEB**: `NEXT_PUBLIC_API_URL` (URL ABSOLUTA de la API — nunca `//api` en
     producción), `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_TZ`,
     `PORT`/`ALLOWED_DEV_ORIGINS` (solo dev). **No** configurar
     `API_PROXY_DESTINATION`.
   - **API** (`apps/api/.env.example`): `DATABASE_URL`, `JWT_*`, expiraciones,
     `TZ`/`TIMEZONE`, `BLOQUEO_IP_*`, `THROTTLE_*` y `FRONTEND_URL` o
     `CORS_ORIGINS` apuntando al dominio HTTPS de la WEB.
4. **`historial-cambios/2026-11-21-proxy-api-next.md`** — corregido el
   pendiente que decía que el `destination` estaba hardcodeado (ya no lo está).

## Verificación / pruebas

- `npx tsc --noEmit` → limpio.
- `npm run lint` → 0 errores, 38 warnings (baseline de la rama).
- `npm test` (web) → 12/12.
- `git diff --check` → sin whitespace roto.
- Requiere reinicio del dev server (el rewrite se evalúa al arrancar) y vuelve
  a necesitar `API_PROXY_DESTINATION` en el `.env` local para que el proxy
  exista.

## Pendientes / riesgos

- El `.env` local no commitea: si el servidor se reinicia sin la variable nueva,
  el rewrite simplemente no se activa y vuelve el mixed content — el
  `.env.example` ya documenta el valor.
- La nota de Railway es documentación; no toca workflows ni variables reales
  de GitHub/Railway. Confirmar los nombres de dominio al desplegar.
- No probé el reinicio del dev server ni el teléfono en esta vuelta (cambio de
  configuración; el smoke sigue pendiente del usuario).
