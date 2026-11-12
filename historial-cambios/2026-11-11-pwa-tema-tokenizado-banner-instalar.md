# PWA base — ajustes del humo: tema 100% tokenizado + banner de instalación

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base` (ajustes del humo del teléfono, después del paso 6)

## Cambios realizados

### 1. Tema 100% tokenizado en la PWA (decisión del cliente)
La PWA tenía colores oscuros hardcodeados (`bg-secondary`, `bg-ui-900/60`,
`text-white`…) — en modo CLARO el fondo quedaba gris y el texto blanco
ilegible. Ahora usa el **mismo sistema de tokens del escritorio**:

- Fondo: `bg-canvas` (claro = casi blanco ✅ / oscuro = `#0f172a`, igual que
  el escritorio oscuro).
- Header/nav: `bg-surface` + `border-ui-200` (idéntico look al Topbar).
- Textos: `text-ui-900` (títulos) / `text-ui-500` (secundarios) — se
  invierten solos → el contraste nunca se pierde.
- PIN: casillas `bg-surface border-ui-200` en claro (blancas), **puntos del
  PIN en `text-ui-900`** (oscuros en claro, claros en oscuro).
- Tocados: `(pwa)/layout.tsx`, `RoleNav.tsx`, `PantallaPlaceholder.tsx`,
  `PinInput.tsx`. **El login/landing NO se toca** (oscuro por diseño en
  ambos temas, igual que el escritorio).

### 2. Tema por defecto de la PWA = el modo del teléfono
- Al autenticarse desde el móvil (login dual), si el usuario **nunca eligió
  tema** (`localStorage[svr-tema]` vacío) → `setPreferencia('system')`: la
  PWA sigue al modo del teléfono. El escritorio conserva su default claro.
- Se aplica en el **login** (event handler — sin setState síncrono en
  effects, regla del linter); el toggle del header permite cambiar
  (claro/oscuro/sistema, reutilizado del escritorio).

### 3. Botón de cerrar sesión restaurado
En el header de la PWA: notificaciones + **cerrar sesión** (como pidió el
cliente).

### 4. Banner de instalación (decisión del cliente: sale en cada acceso si NO está instalada)
- **`components/pwa/BannerInstalar.tsx`** (nuevo): detecta si la app corre
  como instalada (`display-mode: standalone`) — si NO, muestra el banner con
  botón ✕ que lo oculta solo por la sesión (`sessionStorage`).
- Si el navegador entrega `beforeinstallprompt` (HTTPS), el botón lanza el
  prompt nativo; si no (HTTP en dev), instruye: menú ⋮ → Instalar.
- `manifest.json` gana `id: "/m"` (base para `getInstalledRelatedApps`).
- **Causa raíz de "no aparece la instalación": HTTP no es contexto seguro** —
  Chrome exige HTTPS (o flag `unsafely-treat-insecure-origin-as-secure` para
  probar). El manifest/SW/iconos ya estaban correctos.
- **Lint:** el banner usa `useState` lazy initializer (sin setState síncrono
  en effects — la regla nueva del linter lo exigía).

## Archivos tocados

- `apps/web/src/app/(pwa)/layout.tsx` (tokens + logout + banner)
- `apps/web/src/components/pwa/RoleNav.tsx` (tokens)
- `apps/web/src/components/pwa/PantallaPlaceholder.tsx` (tokens)
- `apps/web/src/components/pwa/PinInput.tsx` (tokens: casillas surface, punto
  por tema)
- `apps/web/src/components/pwa/BannerInstalar.tsx` (nuevo)
- `apps/web/public/manifest.json` (id)
- `apps/web/src/app/page.tsx` (tema default en el login dual)

## Pruebas / verificación

- `tsc` ✅; eslint de todos los archivos ✅ (queda 1 error PREVIO de
  AuthProvider, deuda ya declarada).
- `npm run build` de producción ✅.
- Visual: claro → fondo blanco + letras oscuras; oscuro → igual que el
  escritorio oscuro. Confirmar en el teléfono con el toggle.

## Pendientes y riesgos

- Sin push (orden del usuario).
- La instalación nativa sigue requiriendo HTTPS (el banner instruye el menú
  mientras tanto).
- El toggle de tema muestra iconos pequeños del kit — si el cliente quiere
  otro estilo, se ajusta solo ahí.
