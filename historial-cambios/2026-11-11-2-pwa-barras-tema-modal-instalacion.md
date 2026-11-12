# PWA — barras del sistema según tema + modal de instalación en cada acceso

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base`

## Cambios realizados

**1. Barras naranjas → color del tema.** Android pinta status bar (arriba)
y nav bar (abajo) con el `<meta name="theme-color">`. Era estático
(`#f97316`) → naranja fijo. Effect en `(pwa)/layout.tsx` lo sincroniza
con el tema activo vía `MutationObserver` sobre la clase `dark` del
`<html>` (el ThemeToggle ya la manipula): claro → `#f8fafc` (canvas
claro), oscuro → `#0f172a` (canvas oscuro). El `manifest.json` conserva
su `theme_color` naranja — solo controla el splash de arranque.

**2. Modal de instalación en cada acceso** (petición del cliente —
reintroducido con las lecciones aprendidas):

- Script **inline** en el JSX del layout: captura `beforeinstallprompt`
  al parsear el HTML (se dispara una vez, ANTES de la hidratación — la
  lección del primer intento) y lo guarda en `window.__svrPrompt`.
- `lib/pwa/instalar.ts` (recreado): `obtenerPrompt()`, `estaInstalada()`
  (matchMedia standalone + `navigator.standalone` iOS), `instalarApp()`
  (lanza el diálogo nativo; `false` si Chrome no entregó el evento).
- `components/pwa/ModalInstalar.tsx` (recreado): sale en cada acceso si
  no está instalada (sin memoria de «oculto»); botón «Instalar» →
  diálogo nativo; si no hay evento, instrucciones del menú ⋮ en el mismo
  modal; «Ahora no» cierra solo la visita. Se oculta solo con
  `appinstalled`. Documentado en `COMPONENTS.md` (§16.3).
- Wire en el layout: estado `instalada` (inicia `true` para no dar
  destello a quien ya la tiene), revisión diferida al próximo tick (el
  lint de React 19 prohíbe `setState` síncrono en effects) + listener
  `appinstalled`.

Todo queda en el shell `(pwa)` — escritorio sin tocar (regla de oro).

## Archivos tocados

- `apps/web/src/app/(pwa)/layout.tsx` (effect barras + script inline + wire modal)
- `apps/web/src/lib/pwa/instalar.ts` (nuevo/recreado)
- `apps/web/src/components/pwa/ModalInstalar.tsx` (nuevo/recreado)
- `COMPONENTS.md` (§16.3 ModalInstalar)

## Pruebas / verificación

- `tsc --noEmit` ✅; eslint de los 3 archivos ✅.

## Pendientes y riesgos

- Sin push (orden del usuario).
- Verificación en el TELÉFONO: 1) cambiar tema → las barras deben
  repintarse (versiones viejas de Chrome pueden dejar la nav bar negra);
  2) desinstalar la app y recargar → debe salir el modal en cada acceso,
  y su «Instalar» lanzar el diálogo nativo (si Chrome aplica su
  enfriamiento tras descartes, el modal muestra la salida del ⋮).
