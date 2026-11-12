# PWA — Perfil: cerrar sesión abajo y avatar cuadrado

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base`

## Cambios (autorizados por el usuario tras probar la vista)

1. **«Cerrar sesión» siempre hasta abajo** de la vista: la sección pasa a
   `min-h-full` y el botón a `mt-auto` — con contenido corto queda pegado
   al fondo; con scroll queda al final de la lista.
2. **Avatar cuadrado** con esquinas ligeramente redondeadas: `rounded-2xl`
   → `rounded-lg` (el 2xl en un cuadro de 64px se veía ovalado).

## Archivos tocados

- `apps/web/src/app/(pwa)/m/perfil/page.tsx` (solo clases)

## Pruebas / verificación

- `tsc --noEmit` ✅; eslint ✅.
- Smoke pendiente en teléfono (el usuario prueban directo).

## Pendientes y riesgos

- Sin push (orden del usuario).
- El avatar del header sigue `rounded-xl` (más pequeño, no se veía
  ovalado) — si el usuario lo quiere cuadrado igual, es 1 clase.
