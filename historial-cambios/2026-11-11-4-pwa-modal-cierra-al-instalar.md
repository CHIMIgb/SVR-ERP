# PWA — el modal de instalación se cierra al lanzar el diálogo nativo

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base`

## Cambios realizados

Petición del usuario: al pulsar «Instalar» el modal quedaba visible
detrás del diálogo nativo todo el rato. Ahora `ModalInstalar` lo cierra
(`onCerrar`) apenas el diálogo nativo se lanza con éxito; si Chrome no
entregó el evento, el modal se queda abierto mostrando la salida del menú
⋮ (comportamiento anterior intacto).

## Archivos tocados

- `apps/web/src/components/pwa/ModalInstalar.tsx` (2 líneas en `instalar()`)

## Pruebas / verificación

- `tsc --noEmit` ✅; eslint ✅.
- Comportamiento final confirmado por el usuario en el teléfono (el
  diálogo nativo ya se abre con el script en el HTML del server).

## Pendientes y riesgos

- Sin push (orden del usuario).
- Si el usuario CANCELA el diálogo nativo, el modal ya se cerró — vuelve
  en el próximo acceso (es el diseño de «cada acceso» que pidió el cliente).
