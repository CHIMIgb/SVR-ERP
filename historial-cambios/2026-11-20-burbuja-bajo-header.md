# Burbuja de alertas: siempre bajo el header, contorno completo y tamaño fijo

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** captura del usuario — «debe tener todo el contorno redondeado, ser más grande, y aparecer siempre debajo del header»

## Causa raíz
El `Overlay` del kit cubre toda la pantalla **incluido el header del shell**
(z-40 > z-30) y mi ancla `mt-2` ponía la burbuja SOBRE el header (la captura
la muestra tapando el header). El ancho sin margen izquierdo hacía que el
contorno se perdiera contra el borde, y la altura era la del contenido
(con 1 notificación la burbuja se veía enana).

## Cambios realizados
- **Anclaje:** `mt-[calc(env(safe-area-inset-top)+4rem)]` — SIEMPRE debajo
  del header del shell (4rem ≈ 64px de header + safe-area del teléfono).
- **Contorno completo:** `w-80 max-w-[calc(100vw-1.5rem)] ml-auto mr-3` —
  margen visible a ambos lados, nada se come los bordes.
- **Más grande:** `h-[min(28rem,60dvh)]` — tamaño fijo con el listado
  respirando y **su propio scroll** (`lista` con `flex-1
  overflow-y-auto`); el encabezado queda sticky dentro de la tarjeta con
  `rounded-t-2xl` para no tapar el radio.

## Archivos tocados
- `apps/web/src/components/pwa/NotificacionesModal/NotificacionesModal.styles.ts`
- `historial-cambios/2026-11-20-burbuja-bajo-header.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 38 warnings
  preexistentes. `git diff --check`: sin errores.
- Smoke pendiente en el teléfono: burbuja bajo el header con contorno
  completo, tamaño fijo con scroll en la lista.

## Pendientes y riesgos
- Con teclado abierto (dvh) la burbuja se ajusta; probado solo en smoke.
- Sin push: el commit queda local.
