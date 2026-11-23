# Detalle PWA con la información y orden del escritorio

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** captura del usuario — «en la PWA se muestra menos información y la descripción se muestra arriba del informe en lugar de abajo»

## Cambios realizados
- `(pwa)/m/reportes/page.tsx` — la sección de información del detalle quedó
  con los MISMOS campos y orden del escritorio (grid 2 col en móvil, 3 col
  allá):
  1. **Fecha** (hora · fecha), **Ubicación** (proyecto+dirección / GPS +
     «Ver en Google Maps» / Sin ubicación), **Área**, **Prioridad**,
     **Estado**, **Responsable** («Sin asignar» si vacío), **Levantó**,
     **Teléfono** (enlace `tel:` cuando existe) y **Puesto / Rol**
     (`reportadoPor.rol`).
  2. **DESCRIPCIÓN** debajo, con su mini-título y `whitespace-pre-wrap`
     (antes iba encima y sin título).
- Se retiraron los campos que el escritorio no muestra en ese lugar
  («Categoría», «Reportó» — su equivalente es «Levantó») y el párrafo suelto
  de teléfono (ahora vive en el grid como el escritorio).

## Archivos tocados
- `apps/web/src/app/(pwa)/m/reportes/page.tsx`
- `historial-cambios/2026-11-20-pwa-detalle-info-escritorio.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 37 warnings preexistentes.
- `git diff --check`: sin errores.
- Smoke pendiente en el teléfono: abrir un reporte → info en el orden del
  escritorio con descripción al fondo, seguida de acciones/Imágenes/Actividades.

## Pendientes y riesgos
- La subcategoría ya no aparece en el detalle (el escritorio tampoco la
  muestra allí): queda en la tarjeta de la lista.
- Sin push: el commit queda local.
