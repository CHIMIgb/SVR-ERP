# Botón «Ubicación» en las tarjetas de /m/reportes (obra → domicilio / GPS → Maps)

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** pedido del usuario — «al lado de ver el reporte puedes añadir el botón de ubicación: si es domicilio de obra que se muestre la modal con el domicilio; si es la ubicación que se abra google maps»

## Cambios realizados
- **`TarjetaReporte`:** nueva prop opcional `onUbicacion?: () => void` →
  botón «Ubicación» con ícono `MapPin` (≥44px, junto a «Ver»). Presentacional:
  el padre decide si la provee.
- **`/m/reportes/page.tsx`:** la página decide el comportamiento con la MISMA
  lógica del detalle:
  - **Obra** (`proyectoId && proyecto`) → modal con el nombre de la obra + el
    domicilio (`proyectoDireccion`; «Sin domicilio registrado» si es null).
  - **GPS** (`latitud`/`longitud`) → `window.open('https://maps.google.com/?q=lat,lng')`
    (pestaña nueva — en el teléfono salta a Maps).
  - **Sin ubicación** → la prop no se pasa y el botón no se muestra.
- La modal de domicilio es inline (kit `Modal`, igual que el detalle/preview).
- `COMPONENTS-PWA.md` §5 (TarjetaReporte): nueva prop documentada.

## Archivos tocados
- `apps/web/src/components/pwa/TarjetaReporte/TarjetaReporte.tsx`
- `apps/web/src/app/(pwa)/m/reportes/page.tsx`
- `COMPONENTS-PWA.md`
- `historial-cambios/2026-11-20-pwa-ubicacion-tarjeta.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 37 warnings preexistentes.
- `git diff --check`: sin errores.
- Smoke pendiente en el teléfono: tarjeta de reporte con obra → modal con el
  domicilio; tarjeta con GPS → Maps; tarjeta sin ubicación → sin botón. Ver
  el ancho de 3 acciones (Ver + Ubicación + Aceptar) en 320px.

## Pendientes y riesgos
- En 320px una tarjeta con Ver + Ubicación + Aceptar puede ajustarse justo —
  el `MapPin` mantiene el texto «Ubicación» corto; si se ve apretado se pasa
  a ícono-only.
- Sin push: el commit queda local.
