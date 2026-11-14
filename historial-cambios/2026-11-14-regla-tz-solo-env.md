# 2026-11-14 — Regla dura: la zona horaria vive SOLO en los .env

## Qué se hizo

Tras el bug reportado por el cliente (registrando a las 11 p.m. del 12-nov se
guardó fecha del 13-nov), análisis completo y aplicación de la regla:

**Análisis:**
- **API**: `.env` ya define `TZ` + `TIMEZONE` y `main.ts` los aplica, PERO
  tenía fallback hardcodeado `'America/Mexico_City'` (viola la regla). Lo
  mismo en `common/validacion.ts` (`hoyEnZona`, `inicioDelDiaEnZona`).
- **WEB**: `lib/formatters.ts` tenía `APP_TIMEZONE = 'America/Mexico_City'`
  hardcodeado, y **7 tomas de fecha por UTC** (`new Date().toISOString()
  .split('T')[0]`): clientes, cotizaciones, cobranza, ventas (hoyIso — los
  retiros del día dejaban de contarse a las 11 p.m.), CorteCaja (lo mismo),
  horometro/maquinaria (sumarDias: aritmética de fecha pura, correctos) y 3
  nombres de archivo CSV. **El culpable del bug del cliente es la captura por
  UTC en el navegador** (23:00 CST = 05:00 UTC del día siguiente).

**Cambios (la zona horaria ahora vive SOLO en los .env):**
- **API**: `main.ts` sin fallback (`process.env.TZ = process.env.TZ || process.env.TIMEZONE`);
  `validacion.ts` (`hoyEnZona`/`inicioDelDiaEnZona`) usa `process.env.TIMEZONE`
  sin fallback. `apps/api/.env` ya define ambos.
- **WEB**: `lib/formatters.ts` → `APP_TIMEZONE = process.env.NEXT_PUBLIC_TZ`
  (sin fallback; si falta, Intl usa la zona del equipo). **`apps/web/.env`
  gana `NEXT_PUBLIC_TZ=America/Mexico_City`.**
- **Regla documentada** en `AGENTS.md` (sección RBAC) y
  `.opencode/agent/svr-erp.md`: zona horaria SOLO .env; PROHIBIDO capturar
  "hoy" con `toISOString()` — usar `hoyEnZona()` (API) / `fechaLocalHoy()`
  (web); los comparadores de fecha pura (`sumarDias` con `T00:00:00Z`) sí son
  correctos.

## Verificación

- `npx tsc --noEmit` (web y api): limpios.
- `npx jest src/common` (validación): **9/9** — el spec pasa los timezone
  explícitos como argumento, no depende del fallback.
- Suite completa api: **1355/1357** — los 2 fallos preexistentes de cobranza.

## Pendientes / riesgos

- Si algún `.env` pierde `TZ`/`NEXT_PUBLIC_TZ`, el API corre con la zona del
  sistema y la web con la del equipo — la regla lo documenta como
  responsabilidad del .env.
- El reinicio del dev server es necesario para que Next lea el nuevo
  `NEXT_PUBLIC_TZ`.
