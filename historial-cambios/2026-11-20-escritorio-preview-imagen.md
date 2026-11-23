# Preview de imagen también en el escritorio (paridad con la PWA)

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** «la preview también debe ser en escritorio»

## Cambios realizados
- `(dashboard)/reportes/page.tsx` — el detalle del escritorio replicaba el
  flujo de la PWA:
  - Las miniaturas de adjuntos ya no son `<a target="_blank">` (pestaña
    nueva con data-URI): ahora son **botones** (`aria-label="Ampliar …"`,
    hover scale igual que antes) que abren un **Modal del kit** (size xl)
    con la imagen en grande (`object-contain`, `max-h-[70dvh]`), botón
    **«Descargar»** (ancla con `download`) y **«Cerrar»** — idéntico al
    implementado en la PWA (`d5587505`).
  - Se agregó el import de `Modal/ModalBody/ModalFooter/ModalHeader` del kit
    (ya usaban FormModal de la misma fuente).
- El grid conserva 2/4 columnas según viewport y el efecto hover.

## Archivos tocados
- `apps/web/src/app/(dashboard)/reportes/page.tsx`
- `historial-cambios/2026-11-20-escritorio-preview-imagen.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 37 warnings preexistentes.
- `git diff --check`: sin errores.
- Smoke pendiente en escritorio: abrir un incidente con imágenes → tap en la
  miniatura → modal con la imagen, Descargar y Cerrar; Escape/overlay también cierran.

## Pendientes y riesgos
- El ancla de Descargar sigue estilizada inline (mismo caso pendiente de la PWA).
- Sin push: el commit queda local.
