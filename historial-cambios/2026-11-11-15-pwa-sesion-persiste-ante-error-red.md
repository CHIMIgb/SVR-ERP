# PWA — la sesión ya no se borra por un error de red (persistencia real)

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base`

## Diagnóstico (bug reportado: reabrir la PWA mandaba al login)

Al reabrir la app, `initializeAuth` rotaba el refresh token; si la API no
respondía EN ESE INSTANTE (PC dormida, dev server reiniciándose, Wi-Fi
caído un segundo), el `catch` de `refreshAccessToken` hacía
`clearTokens()` — **un error de red borraba la sesión igual que un token
vencido**. Además `refreshProfile` cerraba sesión en CUALQUIER error del
catch, incluido el de conexión.

## Fix — distinguir error de red de token inválido

1. **`lib/api.ts`**:
   - `refreshAccessToken()` ahora devuelve `'ok' | 'invalid' | 'red'`:
     - `'invalid'` (HTTP 401/400 o success:false) → `clearTokens()` —
       sesión muerta de verdad.
     - `'red'` (fetch lanzó — sin conexión — o HTTP 500/503) → **NO
       limpia tokens**.
   - `initializeAuth()` retorna el mismo estado.
   - Interceptor de 401: `'ok'` → reintenta con nuevo token;
     `'red'` → devuelve `API_DOWN` SIN redirigir ni limpiar (el caller
     muestra su error de conexión); `'invalid'` → redirect al login.
2. **`providers/AuthProvider.tsx`**:
   - Init: `'invalid'` → logout limpio; `'red'` → conserva usuario
     cacheado y tokens (la app abre; al volver la señal, la primera
     petición 401 dispara el refresh y recupera el access token).
   - `refreshProfile` catch: solo hace logout si NO hay access token en
     memoria (revocación real) — un error de red ya no mata la sesión.
   - `setUser(storedUser)` movido dentro del `.then` (la regla de
     eslint de React 19 prohíbe setState síncrono en el effect).

## Archivos tocados

- `apps/web/src/lib/api.ts`
- `apps/web/src/providers/AuthProvider.tsx`

## Verificación

- `tsc --noEmit` ✅; eslint ✅.
- Prueba del usuario: iniciar sesión → cerrar la app → reabrir → debe
  entrar directo (con la API arriba); con la API abajo NO debe borrar
  la sesión (arranca con datos cacheados; al volver señal funciona).

## Pendientes y riesgos

- Sin push (orden del usuario).
- Con sesión 'red' (API abajo al abrir), las peticiones fallan con
  error de conexión hasta que haya señal — esperado; el toast lo dice.
- No hay refresh PROACTIVO (temporizador): el token se rota al primer
  401 — comportamiento original conservado.
