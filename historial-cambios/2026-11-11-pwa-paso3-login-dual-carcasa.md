# PWA base — paso 3: login dual, carcasa (pwa) y cambio de PIN

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base` (paso 3 del §8.6 ajustado — incluye la carcasa mínima de `(pwa)` con sus primeras rutas /m)

## Cambios realizados

### 1. Login dual (plan §8.4) — `src/app/page.tsx`
Una sola pantalla con dos modos:
- **Móvil** (`vistaEfectiva() === 'movil'`): número de empleado (formato
  PREF-NNN) + PIN de 8 casillas.
- **Escritorio**: email + password (intacto).
- El modo se decide en un `useEffect` con `requestAnimationFrame` (evita el
  setState síncrono en effect de la regla nueva de lint y el flash de
  hidratación).
- Tras autenticar enruta a la cara correspondiente (`/m` vs `/dashboard`) y
  si `pinEstado.requiereCambio` → `/m/pin-cambio` (obligatorio, spec §6.6).

### 2. Carcasa `(pwa)/layout.tsx` (mínima del paso 3)
- Guards: sesión (sin user → login) y ancho (escritorio → `/dashboard`).
- **Guard de PIN** via `GET /auth/pin/estado`: `requiereCambio` → cambio
  obligatorio antes de navegar.
- Header con iniciales del usuario, nombre y rol + botón de cerrar sesión.
- Banner del aviso a los 25 días (sin mostrar PIN, spec §6.6-5).
- El **nav inferior por rol (RoleNav) llega en el paso 4** — este layout solo
  trae header + contenido.

### 3. `/m/pin-cambio` — cambio de PIN propio
PIN actual + nuevo + confirmación (3 PinInput), mensajes de error con
`mensajeErrorApi`, al éxito va a `/m`. Botón de cerrar sesión accesible.

### 4. Componentes nuevos (documentados en COMPONENTS.md §16)
- **`PinInput`** — 8 casillas enmascaradas (auto-avanza, Backspace, pegar).
- **`PantallaPlaceholder`** — placeholder de la base (solo título).

### 5. `(pwa)/m` — placeholder Inicio (solo título, como pidió el usuario)

### 6. Soporte en `lib/api.ts` + AuthProvider
- `authApi.loginPin / pinEstado / pinCambio` + tipos (`LoginPinCredentials`,
  `LoginPinResponse` (user: **UserAuth completo**), `PinEstadoDTO`).
- `AuthProvider.loginPin` (misma ergonomía que login) expuesto en
  `useAuth`.
- **Backend ajuste:** `login-pin` ahora devuelve el perfil COMPLETO
  (`getProfile`) — el mismo shape que el login de email, para que el
  AuthProvider (persona/roles/vistas) funcione sin duplicar lógica.

## Archivos tocados

- `src/lib/pwa/dispositivo.ts` (nuevo — detector/interruptor §7a)
- `src/lib/api.ts` (tipos + 3 métodos)
- `src/providers/AuthProvider.tsx` (loginPin)
- `src/app/page.tsx` (login dual)
- `src/app/(pwa)/layout.tsx` (nuevo)
- `src/app/(pwa)/m/page.tsx` (nuevo, placeholder)
- `src/app/(pwa)/m/pin-cambio/page.tsx` (nuevo)
- `src/components/pwa/PinInput.tsx` + `PantallaPlaceholder.tsx` (nuevos)
- `COMPONENTS.md` (§16 documentación)
- `apps/api/src/auth/pin/pin.service.ts` (login-pin devuelve perfil completo)

## Pruebas / verificación

- `tsc --noEmit` web ✅; eslint de los archivos nuevos ✅ (solo queda la
  deuda previa de AuthProvider: setState en su effect de inicialización —
  probada con stash que existía antes de este paso).
- Sin suite frontend (infra pendiente) — smoke manual en navegador pendiente
  (probar: móvil ancho → número+PIN; escritorio → email+password; temporal
  → obliga cambio).

## Pendientes y riesgos

- Sin push (orden del usuario).
- **El humo del navegador no se ejecutó** (requiere navegador + API corriendo
  con usuarios demo con numero_empleado asignado — el alta/seed de números
  llega en un paso posterior): el primer login-pin real contra la BD requiere
  usuarios con numero_empleado + pin_hash sembrados.
- El nav inferior (RoleNav) y el resto de placeholders llegan en pasos 4-5.
