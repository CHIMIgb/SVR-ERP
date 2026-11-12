# 2026-11-11 — Fix review PR #18 #4: enforcement server del cambio de PIN obligatorio

## Problema (review del PR #18, bloqueante 4)

`requiereCambio` solo viajaba al cliente: el layout PWA redirigía a
`/m/pin-cambio`, pero ni `JwtStrategy` ni guard alguno lo revisaban. Quien
tuviera el mensaje de WhatsApp usaba el token del login con el PIN temporal
contra **cualquier endpoint** sin cambiar nunca el PIN. El vencimiento de
30 días tampoco se aplicaba en el servidor.

## Cambios

**Claim `rpc` en el access token (solo sesiones PWA):**
- `auth.types.ts`: `JwtPayload.rpc?: boolean`.
- `auth.service.ts` — `crearSesionYTokens(user, ip, ua, opts?)`: con
  `requierePinCambio` agrega `rpc: true` al access y marca la sesión con
  `dispositivo: 'pwa-pin'` (columna ya existente — sin migración). La marca
  permite que `refresh()` **recalcule** el claim: temporal activo o PIN
  vencido (30 días) → claim sigue; tras el cambio → claim fuera. Las
  sesiones de email+password **nunca** llevan el claim (factor password
  fuerte; los del alta P14 tienen password inutilizable — el threat del
  temporal solo puede autenticarse por login-pin).
- `pin.service.ts` — `loginPin` pasa `{ requierePinCambio: estado.requiereCambio, pwaPin: true }` (el `estado` se computa antes de firmar).

**Enforcement en el único punto:**
- `jwt-auth.guard.ts` — `canActivate`: tras autenticar, si
  `req.user.requierePinCambio` y la ruta no está en la whitelist
  (`auth/pin/cambio`, `auth/pin/estado`, `auth/logout`, `auth/profile`)
  → **403** "Debes crear tu PIN propio antes de continuar". Los 32
  controllers ya usan este guard — un solo lugar. `refresh` no se toca
  (JwtRefreshAuthGuard aparte; rota tokens pero el nuevo access vuelve a
  llevar el claim si sigue debiendo el cambio).
- Gotcha real descubierto en el smoke: en Nest 11 + Express 5
  `req.route.path` **incluye el prefijo global** (`/api/auth/profile`) — la
  normalización de la whitelist tolera con/sin `/api` y con/sin slash.

**Front:**
- `(pwa)/m/pin-cambio/page.tsx`: tras el cambio exitoso repone tokens con
  `authApi.refresh` → `setTokens` (el access vivo podía cargar el claim por
  hasta 15 min → todo daría 403). Si el refresh falla → logout (re-login con
  el PIN propio ya creado).

## Verificación / pruebas

- Unit: `npx jest src/auth` → 101/101 (incluye 4 tests del guard nuevo y 3
  del claim en refresh: pwa-pin temporal renueva, tras cambio se limpia,
  sesión email nunca lleva claim aunque el PIN esté viejo).
- Integración BD real: 7/7 — test nuevo "6": reinicio → login temporal →
  `jwtService.decode(accessToken).rpc === true` → cambio → refresh →
  `rpc` ausente.
- **Smoke HTTP end-to-end** (API en :3002, sin tocar la del :3001):
  login email admin → `pin/reinicio` sobre TRA-0142 → login-pin con el
  temporal → `GET /api/auth/profile` **200** (whitelist) →
  `GET /api/trabajadores` **403 "Debes crear tu PIN propio..."** →
  `pin/cambio` success → refresh → `GET /api/trabajadores` **403 pero desde
  PermissionsGuard** ("No tienes permiso para rrhh.trabajadores.ver" — el
  bloqueo del PIN ya no aplica) → `profile` **200**.
- Limpieza post-smoke: estado PIN de TRA-0142 restaurado al snapshot exacto
  (verificado hash/historial/intentos/fechas) y sesiones creadas por el
  smoke cerradas + refresh tokens revocados (solo las de los últimos 15
  min — no se tocaron sesiones reales).
- `npx tsc --noEmit` limpio en api y web. Suite completa: 1301/1303 (los 2
  fallos siguen siendo los de `cobranza.service.spec.ts`, pre-existentes).

## Pendientes / riesgos

- El claim vive 15 min (vida del access): tras el cambio, la pantalla repone
  tokens — si el refresh falla por red, el layout manda de nuevo a
  pin-cambio hasta que el claim muera o el usuario re-loguee.
- El bloqueo 403 alcanza también al escritorio para usuarios PWA con PIN
  vencido (30 días): es la regla del spec §6.5. El primer vencimiento real
  ocurrirá ~28 días después de las altas — a más tardar entonces conviene
  un acceso a `pin/cambio` desde el escritorio si se quisiera cambiar el
  PIN sin entrar a la PWA (el endpoint ya funciona con JWT de escritorio).
- `lint` de `apps/web` falla con 18 errores pre-existentes en otros archivos
  (Tooltip.tsx `react-hooks/refs`, etc.) — ninguno en los archivos tocados
  por este fix; no corregidos aquí (trabajo ajeno).
- No verificado: comportamiento del `AuthProvider` cuando el 403 llega a
  llamadas que no son login (el front no reacciona a 403, solo a 401) — el
  layout PWA ya encausa por `pinEstado`, y el smoke muestra el flujo sano.
