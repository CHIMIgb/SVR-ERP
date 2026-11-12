# PWA — cerrar sesión anclado al fondo del perfil (main flex)

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base`

## Diagnóstico

El botón «Cerrar sesión» no llegaba al fondo: el `min-h-full` de la
sección no se resolvía porque `<main>` del shell no tiene altura
definida (quirk de porcentajes dentro de flex: el 100% del hijo no
resuelve contra la altura calculada del padre).

## Fix

1. `(pwa)/layout.tsx`: `<main>` ahora es `flex flex-col` (además de
   flex-1/overflow) — sus hijos pueden anclarse al fondo con `flex-1`/
   `mt-auto` de forma fiable.
2. `m/perfil/page.tsx`: la sección cambia `min-h-full` por `flex-1`
   (llena el main) + `w-full` — el botón con `mt-auto` queda SIEMPRE
   pegado al fondo, con contenido corto o largo.

## Archivos tocados

- `apps/web/src/app/(pwa)/layout.tsx` (main flex column)
- `apps/web/src/app/(pwa)/m/perfil/page.tsx`

## Pruebas / verificación

- `tsc --noEmit` ✅; eslint ✅.
- Smoke en teléfono pendiente: perfil con botón abajo; resto de vistas
  sin cambios visuales (sus secciones apiladas se comportan igual en
  flex column — la única diferencia teórica es la pérdida del colapso
  de márgenes entre hermanos, que ninguna vista usa).

## Pendientes y riesgos

- Sin push (orden del usuario).
- `<main>` es compartido por TODAS las vistas PWA: si alguna vista
  mostrara un espaciado distinto entre bloques (márgenes colapsados),
  avisar y se revierte a un fix contenido solo en perfil.
