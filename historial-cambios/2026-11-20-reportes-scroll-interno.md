# /m/reportes con scroll interno real — todo lo de arriba fijo

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** «la parte superior de la vista reportes (filtros, barra, KPIs, título y botón) no se quedan fijos, aún se desliza toda la vista»

## Causa raíz (por qué el sticky no funcionó)
1. El `<main>` del shell **no era el scroller real**: columna flex con
   `min-h-screen` sin `min-h-0` → main crecía con su contenido y scrolleaba
   el documento (con 100vh > visible en el navegador del teléfono, doble
   scroll).
2. El bloque sticky se pegaba al viewport top-0, donde el header del shell
   (sticky z-30) lo tapaba.
3. La burbuja de notificaciones tapaba el header porque el Overlay del kit
   cubre toda la pantalla (corregido en el commit hermano con la prop
   `blur` y el anclaje bajo el header).

## Cambios realizados
- **`(pwa)/layout.tsx`:** `<main>` con **`min-h-0`** → main es el scroller
  real; el header del shell y la RoleNav quedan FUERA del scroll (fijos).
- **`(pwa)/m/reportes/page.tsx`:** abandono el sticky y paso a **scroll
  interno real** (lo que pediste originalmente):
  - La página mide EXACTAMENTE el alto del main: `h-[calc(100%-2.5rem)]`
    (el 2.5rem es el `py-5` del main) como **columna flex**.
  - Todo lo de arriba (encabezado + stats + EstadoCola + error + búsqueda +
    chips) queda en un bloque `shrink-0` **fuera del contenedor que
    scrollea** → fijo de verdad, sin trucos ni sticky.
  - **SOLO la lista** tiene `overflow-y-auto` (`flex-1 min-h-0`).
  - La paginación quedó **fuera del scroll** (fija abajo, siempre visible,
    como pediste antes).
  - El error de sintaxis del primer corte (`</div>` extra de mi cierre
    doble) fue corregido.

## Archivos tocados
- `apps/web/src/app/(pwa)/layout.tsx` (min-h-0)
- `apps/web/src/app/(pwa)/m/reportes/page.tsx` (reestructura de scroll)
- `historial-cambios/2026-11-20-reportes-scroll-interno.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores (un `</div>` extra corregido en el camino).
- `npm run lint`: 0 errores, 38 warnings preexistentes.
- `git diff --check`: sin errores.
- **Smoke pendiente en el teléfono:** deslizar la lista → el bloque
  superior NO se mueve; filtros/búsqueda funcionan dentro del bloque fijo;
  la paginación fija abajo. Y abrir 2-3 páginas `/m/*` más (el scroller
  del shell cambió).

## Pendientes y riesgos
- El cambio del scroller del shell (min-h-0) afecta a TODAS las páginas
  `/m/*`: el comportamiento visual es el mismo, pero cualquier detalle con
  dvh/teclado debe revisarse en el smoke general.
- Sin push: el commit queda local.
