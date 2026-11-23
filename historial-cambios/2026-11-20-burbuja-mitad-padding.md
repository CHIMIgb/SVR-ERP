# Burbuja de alertas: mitad de tamaño, padding interior y sin ícono en "activadas"

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** ajustes del usuario tras probar la burbuja en el teléfono

## Cambios realizados
- **Mitad de tamaño:** tarjeta `w-52` (13rem ≈ 208px, antes w-80/20rem) y
  `h-[min(16rem,40dvh)]` (antes min(28rem,60dvh)).
- **Espacio a lo ancho:** el contenido ya no se pega a los bordes — el
  header y el banner con `px-2`/`mx-2` y la lista con `px-2 pb-2` (todo el
  interior respira dentro del contorno redondeado).
- **Sin ícono en el texto:** el banner de push activado dice «Notificaciones
  del teléfono activadas» (se quitó el ✓ pegado al texto).
- La lista conserva su propio scroll; el header sticky dentro de la tarjeta.

## Archivos tocados
- `apps/web/src/components/pwa/NotificacionesModal/NotificacionesModal.tsx` (texto del banner)
- `apps/web/src/components/pwa/NotificacionesModal/NotificacionesModal.styles.ts`
- `historial-cambios/2026-11-20-burbuja-mitad-padding.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 38 warnings
  preexistentes. `git diff --check`: sin errores.
- Smoke pendiente en el teléfono: ancho de la burbuja con títulos largos
  (truncados) y el padding interior.

## Pendientes y riesgos
- Con el ancho de 13rem los títulos largos quedan truncados y la fecha
  apretada: si molesta, se oculta la fecha en anchos chicos o se sube a
  15rem.
- Sin push: el commit queda local.
