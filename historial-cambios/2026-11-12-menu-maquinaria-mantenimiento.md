# Maquinaria y Mantenimiento vuelven al menú lateral

**Fecha:** 2026-11-12
**Autor:** P4chec0php

## Cambios realizados
El menú del escritorio escondía las vistas de la app móvil con `!v.ruta.startsWith("/m")`. Ese filtro también
atrapaba `/maquinaria` y `/mantenimiento`, que dejaron de aparecer en el menú: solo se llegaba por el enlace
directo. Ahora se esconden solo `/m` y las rutas `/m/...`.

## Archivos tocados
- `apps/web/src/components/layout/Sidebar.tsx`

## Verificación
- `npx tsc --noEmit` y `npx eslint` en `apps/web`: sin errores.
- Se revisó el otro uso de `startsWith("/m")` (`lib/pwa/rol-nav.ts`): ahí además se cruza con `NAV_MOVIL`, así
  que no esconde nada de más.
- No se probó en navegador.
