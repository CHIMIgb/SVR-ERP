# PWA — detección de instalación a nivel de dispositivo (el modal ya no sale si la app está instalada)

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base`

## Cambios realizados

**Reporte:** tras instalar la app, el modal de instalación seguía saliendo
al abrir la URL en Chrome y no desaparecía al pulsar «Instalar».

**Causa:** la pestaña de Chrome no es standalone aunque la app esté
instalada en el dispositivo — el check de `display-mode: standalone`
devolvía falso siempre en el navegador → modal en cada acceso. Y Chrome
**no dispara `beforeinstallprompt`** para una app ya instalada →
`instalarApp()` devolvía false → el modal se quedaba con la nota del ⋮.

**Fix (API estándar del caso):** `navigator.getInstalledRelatedApps()`
(Chrome Android 84+; web.dev/learn/articles/get-installed-related-apps):

1. `manifest.json`: `related_applications` con `{platform: "webapp",
   url: "/manifest.json", id: "/m"}` — la relación verificada que la API
   exige (el `id` ya existía en el manifest).
2. `lib/pwa/instalar.ts`: nueva `estaInstaladaEnDispositivo()` —
   standalone O apps relacionadas instaladas (`platform === "webapp"`).
3. `(pwa)/layout.tsx`: el effect del modal ahora usa la detección de
   dispositivo (async; el listener `appinstalled` queda para el caso de
   instalarse en esta visita).

Con esto, la app instalada abre la URL en Chrome y NO sale el modal (el
comportamiento pedido: «cada que se entre y se detecte que NO está
instalada en el dispositivo»). Instalada por primera vez → la pestaña de
Chrome sí muestra el modal y su botón sí tiene evento.

## Archivos tocados

- `apps/web/public/manifest.json` (related_applications)
- `apps/web/src/lib/pwa/instalar.ts` (estaInstaladaEnDispositivo)
- `apps/web/src/app/(pwa)/layout.tsx` (effect async de detección)

## Pruebas / verificación

- `tsc --noEmit` ✅; eslint ✅.
- En el teléfono: con la app instalada, abrir la URL en Chrome → el
  modal NO debe salir; desinstalar → debe salir y «Instalar» debe abrir
  el diálogo nativo.

## Pendientes y riesgos

- Sin push (orden del usuario).
- La detección de dispositivo requiere que el WebAPK instalado conserve
  el `id` `/m` — si algún día cambia el `id` del manifest, la relación
  se rompe (el modal volvería a salir en pestaña; no rompe nada más).
