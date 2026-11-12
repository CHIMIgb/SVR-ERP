# PWA base — la captura temprana del evento de instalación (fix del botón)

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base`

## Cambios realizados

**Por qué el botón «Instalar» no funcionaba:** el evento
`beforeinstallprompt` se dispara UNA sola vez al cargar la página — y el
usuario siempre aterrizaba primero en el **login** (`/`), que no tenía
ningún listener → el evento se perdía antes de que la PWA montara su
captura (montaje tardío por los guards). Además Chrome aplica un
**enfriamiento**: si el usuario descartó la barra/instalación antes, no
re-dispara el evento por un rato (regla del navegador, no forzable).

**Solución (la captura temprana estándar de las PWAs):**

1. **Script inline en el `<head>` del layout raíz** (junto al script de
   tema): captura `beforeinstallprompt` apenas carga CUALQUIER página
   (login incluido) con `preventDefault` y lo guarda en
   `window.__svrPrompt` + dispara el evento custom `svr-prompt-ready` para
   los suscriptores. Además registra `/sw.js` desde la primera página (el
   check de instalabilidad de Chrome evalúa la página cargada — antes el SW
   solo se registraba al entrar a `/m`).
2. **`lib/pwa/instalar.ts`** (nuevo): `obtenerPrompt()` (lee el evento
   global), `instalarApp()` (lanza el diálogo nativo — devuelve false si
   Chrome no lo entregó) y `suscribirseAPrompt()`.
3. **`ModalInstalar.tsx`**: el botón «Instalar» usa `instalarApp()` —
   funciona sin importar en qué página se cargó el evento; si Chrome no lo
   entregó, muestra la nota del menú ⋮ (sin silencio muerto).
4. **`(pwa)/layout.tsx`**: fuera su captura duplicada (quedó solo la
   detección de instalada/appinstalled para ocultar el modal).

**También en el humo:** `.next` eliminada de nuevo (la caché de Turbopack
trabada que rompía el arranque del `dev:https:ip` del usuario).

## Archivos tocados

- `apps/web/src/app/layout.tsx` (script global de instalación + registro SW)
- `apps/web/src/lib/pwa/instalar.ts` (nuevo)
- `apps/web/src/components/pwa/ModalInstalar.tsx` (botón con helper)
- `apps/web/src/app/(pwa)/layout.tsx` (limpieza)
- `.next` eliminada (regenerable)

## Pruebas / verificación

- `tsc` ✅; eslint ✅ (0 salidas); **build de producción ✅**.

## Pendientes y riesgos

- Sin push (orden del usuario).
- **Enfriamiento de Chrome:** si el navegador decidió no ofrecer por los
  descartes previos, el evento puede tardar en llegar — la salida es el
  menú ⋮ (y Chrome lo re-ofrece tras más uso del sitio). No forzable por
  código.
- La verificación final es en el teléfono: recargar la PWA, entrar, y
  probar el botón «Instalar» (con el CA ya instalado en el teléfono).
