# Ubicación del detalle PWA con Google Maps (paridad del escritorio)

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** «en ver reporte, en ubicación, haz que sea igual que en la versión de escritorio, que si se captura con la ubicación propia envíe a Google Maps»

## Cambios realizados
- `(pwa)/m/reportes/page.tsx` — la celda «Ubicación» del detalle replicaba la
  lógica LITERAL del escritorio (L1307-1330), que antes era una sola línea de
  texto (`proyecto ?? coordenadas ?? —`):
  1. **Proyecto**: nombre + dirección (texto pequeño) si el reporte tiene
     `proyectoId`.
  2. **GPS**: «GPS {lat}, {lng}» + enlace **«Ver en Google Maps»**
     (`https://maps.google.com/?q=lat,lng`, `target="_blank"` — en el teléfono
     abre Maps/Chrome), mismo texto y colores del escritorio.
  3. **Sin ubicación** si no hay ni proyecto ni coordenadas.
- Se eliminó el `const ubicacion` (string plano) que ya no se usa.

## Archivos tocados
- `apps/web/src/app/(pwa)/m/reportes/page.tsx`
- `historial-cambios/2026-11-20-pwa-ubicacion-maps.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores (primer corte falló por estrechamiento de
  tipos con `reporteDetalle` — se usa `detalle.reporte` como el resto del
  bloque). `npm run lint`: 0 errores, 37 warnings preexistentes.
- `git diff --check`: sin errores.
- Smoke pendiente en el teléfono: abrir un reporte con GPS (los creados desde
  el modal con «Ubicación GPS») → el enlace abre Maps; uno con proyecto →
  nombre + dirección; uno sin nada → «Sin ubicación».

## Archivos tocados / riesgos
- El enlace es `maps.google.com` (mismo dominio del escritorio): en el teléfono
  abre en el navegador o en la app de Maps según el sistema — comportamiento
  esperado.
- Sin push: el commit queda local.
