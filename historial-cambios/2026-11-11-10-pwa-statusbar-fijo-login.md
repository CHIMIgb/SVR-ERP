# PWA — status bar siempre claro + texto del login

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base`

## Cambios realizados (2 autorizados)

1. **Status bar SIEMPRE en modo claro.** El effect que seguía el tema
   (MutationObserver: claro/oscuro) se reemplazó por un valor FIJO:
   `<meta name="theme-color">` = `#f8fafc` sin importar el tema (se fija
   una vez al montar). `manifest.json`: `theme_color` → `#f8fafc` (lo que
   Chrome graba al acuñar el WebAPK). El login oscuro con barra clara era
   lo pedido explícitamente («siempre modo claro y no se pueda cambiar»).
2. **Login:** eliminado el título «Tu jornada empieza» del modo PIN —
   ahora muestra «Bienvenido a SVR» igual que el modo email (texto
   unificado; el usuario pedía eliminar ese redactado).

## Archivos tocados

- `apps/web/src/app/(pwa)/layout.tsx` (meta fijo, sin observer)
- `apps/web/public/manifest.json` (theme_color claro)
- `apps/web/src/app/page.tsx` (título del modo PIN)

## Pruebas / verificación

- `tsc --noEmit` ✅; eslint ✅.
- En el teléfono: REINSTALAR (el theme_color del manifest se graba al
  acuñar) y verificar que la barra quede clara también en tema oscuro.

## Pendientes y riesgos

- Sin push (orden del usuario).
- El color del status bar en la app instalada depende de qué lee el
  Chrome del teléfono (manifest al instalar / meta al cargar) — con
  ambos fijos a `#f8fafc`, cualquiera de las dos vías da barra clara.
- El splash de arranque conserva `background_color` oscuro (`#0f172a`)
  con el casco — si se quiere el splash claro también, avisar.
