# Preview de imagen en el detalle PWA (sin salir del reporte)

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** «al hacer clic sobre la imagen en ver reporte que se abra una previsualización en lugar de redirigir a otra página»

## Cambios realizados
- `(pwa)/m/reportes/page.tsx` — las miniaturas del detalle ya no son
  `<a target="_blank">` (que abría una pestaña nueva con el data-URI):
  ahora son **botones** (`aria-label="Ampliar …"`) que abren un **Modal del
  kit** (size xl) con:
  - la imagen en grande (`object-contain`, `max-h-[70dvh]`),
  - botón **«Descargar»** (ancla con `download` — data-URI, sin server extra),
  - botón **«Cerrar»**.
- Alcance solo PWA; el escritorio conserva su `_blank` (diferencia aceptada,
  documentada aquí).

## Archivos tocados
- `apps/web/src/app/(pwa)/m/reportes/page.tsx`
- `historial-cambios/2026-11-20-pwa-preview-imagen.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 37 warnings preexistentes.
- `git diff --check`: sin errores.
- Smoke pendiente en el teléfono: tap en miniatura → modal con la imagen
  completa → Descargar (archivo .webp al teléfono) → Cerrar.

## Pendientes y riesgos
- El ancla de Descargar estilizada con clases inline (el kit no tiene
  AnchorButton); si aparece un segundo caso, se extrae.
- Sin push: el commit queda local.
