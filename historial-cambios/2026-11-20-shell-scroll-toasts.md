# Shell PWA: scroll real en main + toasts centrados

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** reporte del usuario — «no dejaste fijo de los filtros hacia arriba, aún está el scroll en toda la vista» + «los toasts haz que parezcan centrados»

## Causa raíz del sticky roto (arquitectura)
El `<main flex-1 overflow-y-auto>` del shell **no era el scroller real**: en
una columna flex con `min-h-screen` y sin `min-h-0`, el main crece con su
contenido (min-height auto) y quien scrollea es el documento. Por eso:
1. toda la vista se movía (incluido el bloque "fijo"), y
2. el bloque sticky del page se pegaba al `top-0` del viewport pero quedaba
   **debajo del header del shell** (también sticky top-0, z-30 > z-20).

## Cambios realizados
- **`(pwa)/layout.tsx`:** `<main>` con **`min-h-0`** → main se vuelve el
  scroller real (el header del shell queda fijo de verdad, fuera del
  scroll), y el bloque sticky de `/m/reportes` ahora se pega justo **debajo
  del header**. El scroll visual de las demás páginas `/m/*` es idéntico
  (cambia el contenedor, no el resultado).
- **`components/layout/Toast.tsx` (kit compartido):** `ToastProvider`
  acepta **`posicionPorDefecto?: ToastPosition`** (default `top-right` —
  escritorio intacto) — los toasts sin posición explícita la usan.
- **`(pwa)/layout.tsx`:** `<ToastProvider posicionPorDefecto="top-center">`
  — toasts centrados en la PWA (el kit ya traía el estilo `top-center`).

## Archivos tocados
- `apps/web/src/app/(pwa)/layout.tsx` (2 clases/props)
- `apps/web/src/components/layout/Toast.tsx` (prop del provider)
- `historial-cambios/2026-11-20-shell-scroll-toasts.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 38 warnings (1
  nuevo preexistente revisado: pertenece a SearchBar, deuda conocida).
- `git diff --check`: sin errores.
- **Smoke pendiente en el teléfono:** deslizar /m/reportes (bloque fijo
  bajo el header) Y abrir 2-3 pantallas `/m/*` más para confirmar que el
  scroll sigue behaving igual con el contenedor nuevo.

## Pendientes y riesgos
- El cambio del scroller toca el shell completo: cualquier página que
  dependa del scroll del documento (ninguna encontrada con grep de
  scrollTo) tendría que ajustarse.
- Sin push: el commit queda local.
