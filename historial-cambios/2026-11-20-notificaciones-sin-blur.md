# Burbuja de notificaciones sin difuminado del fondo

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** «has que el fondo no se difumine al abrir las notificaciones»

## Cambios realizados
- **`ui/Modal/Modal.tsx` (kit compartido):** nueva prop **`blur?: boolean`**
  (default `true` — escritorio y demás modales intactos) que se pasa al
  `Overlay`; la burbuja de notificaciones la pasa en `false` — el fondo se
  oscurece SIN el difuminado.
- **`NotificacionesModal`:** `blur={false}`.

## Archivos tocados
- `apps/web/src/components/ui/Modal/Modal.tsx`
- `apps/web/src/components/pwa/NotificacionesModal/NotificacionesModal.tsx`
- `historial-cambios/2026-11-20-notificaciones-sin-blur.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 38 warnings preexistentes.
- `git diff --check`: sin errores.
- Smoke pendiente: abrir la burbuja — el fondo oscuro sin blur.

## Pendientes y riesgos
- El kit cambia de firma aditiva (prop opcional): los callers existentes no
  pasan `blur` → comportamiento anterior intacto (verificado por tsc).
- Sin push: el commit queda local.
