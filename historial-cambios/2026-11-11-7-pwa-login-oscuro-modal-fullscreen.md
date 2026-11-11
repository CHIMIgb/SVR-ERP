# PWA — login siempre oscuro + modal cierra al primer clic + display fullscreen

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base`

## Cambios realizados (3 autorizados)

**1. Login siempre en modo oscuro.** Los tokens de tema se redefinen por
subtree (selector `.dark` en globals.css) — envolviendo los dos `<main>`
del login (`/`) en `class="dark"` toda la pantalla queda fija en oscuro
sin tocar el ThemeToggle ni el escritorio. Arregla el input PIN (sus
casillas usaban `bg-surface`/`border-ui-200` que volteaban a claro) y
cualquier otro elemento del login afectado por el tema. Nota: si con
«cambia el texto tu jornada empieza» el usuario pedía CAMBIAR el
redactado (no el color), falta definir el nuevo texto — el color ya
queda fijo (text-white sobre fondo oscuro).

**2. Modal de instalación cierra SIEMPRE al primer clic en «Instalar».**
Antes se cerraba solo si Chrome lanzaba el diálogo (tras instalar/
reinstalar, Chrome aplica enfriamiento y NO lanza nada → el modal
quedaba colgado con la nota del ⋮). Ahora `onCerrar()` corre antes del
prompt: el modal se va siempre; si Chrome tenía el evento, el diálogo
nativo sale encima. Se eliminó el estado/nota `sinPrompt` (código muerto).

**3. Botones del sistema ocultos (fullscreen).** Manifest: `display:
"fullscreen"` + `display_override: ["fullscreen", "standalone"]` — la
app instalada ocupa TODO el espacio (status + nav bar ocultas), los
botones del sistema reaparecen al deslizar desde el borde, como pidió
el usuario. Complementos:
- Header del shell con safe-area superior
  (`pt-[max(0.75rem,env(safe-area-inset-top))]`) para no quedar bajo la
  muesca/cámara cuando el app arranca desde y=0 (en standalone el inset
  es 0 → mismo look de antes).
- `RoleNav` ya usaba `env(safe-area-inset-bottom)` (queda compatible).
- `estaInstalada()` ahora también detecta `display-mode: fullscreen`
  (sin esto, en la app instalada fullscreen el matchMedia standalone
  daba falso y el modal saldría DENTRO de la app instalada).

## Archivos tocados

- `apps/web/src/app/page.tsx` (clase `dark` en ambos main del login)
- `apps/web/src/components/pwa/ModalInstalar.tsx` (cierre inmediato)
- `apps/web/public/manifest.json` (display fullscreen + display_override)
- `apps/web/src/app/(pwa)/layout.tsx` (safe-area superior del header)
- `apps/web/src/lib/pwa/instalar.ts` (fullscreen en detección)

## Pruebas / verificación

- `tsc --noEmit` ✅; eslint de los 5 archivos ✅.
- En el teléfono: desinstalar y reinstalar (el display fullscreen se
  graba al acuñar el WebAPK); probar login con tema claro (debe seguir
  oscuro); alternar tema dentro de la app (la pantalla debe cambiar y
  el login NO); botón Instalar → el modal desaparece de inmediato.

## Pendientes y riesgos

- Sin push (orden del usuario).
- **Fullscreen oculta también el reloj/batería** (todo el status bar) —
  es la única forma que la plataforma web ofrece de ocultar los botones
  de navegación; si el usuario quiere ver el reloj, la alternativa es
  activar navegación por gestos en los Ajustes de Android (sin código).
- Si el texto «Tu jornada empieza» debía CAMBIAR DE REDACTADO, falta el
  texto nuevo (no especificado).
- Comportamiento de `safe-area-inset-top` en fullscreen varía por
  versión de Chrome — si el header queda bajo la cámara del teléfono,
  reportarlo (se ajusta con una constante).
