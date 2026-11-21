# 2026-11-20 — Tope de fotos a prueba de carrera, código muerto y padding móvil del Modal — menores 7, 8 y 9 PR #23

## Cambios realizados

**Menor 7 — `ModalNuevoReporte.agregarImagen` contaba con el estado viejo:** dos fotos
seguidas (cámara rápida) leían el mismo `imagenes.length` del render y ambas pasaban el
check del tope de 4. Fix: el check del tope ahora vive DENTRO del updater de
`setImagenes` (patrón idéntico al escritorio `/reportes`) — el updater es la única
fuente de verdad del array; la segunda foto en carrera ve el estado actualizado y es
rechazada con su toast.

**Menor 8 — código muerto:** `MAX_TAMANO_ADJUNTO` (2 MB) en
`reportes-campo.service.ts` ya no se usa (el tamaño se DERIVA del base64 desde la
review de PR #17, tope de 10 MB en `MAX_BYTES_DECODIFICADOS_ADJUNTO`). Eliminado.

**Menor 9 — padding del Modal del escritorio en celular:** el PR cambió
`p-2 sm:p-4` → `p-4` en el Overlay de `Modal.tsx` (kit compartido): 16 px menos de
ancho de pantalla para TODOS los modales del escritorio en móvil. Revertido a
`p-2 sm:p-4` — regla #1 del repo (modales que caben en móvil); desde `sm:` (640 px)
sigue el padding generoso. `EmailPreviewModal` lleva su propio `p-4` y no se tocó.

## Cosas nuevas

- Ninguna (correcciones).

## Archivos tocados

- `apps/web/src/components/pwa/ModalNuevoReporte/ModalNuevoReporte.tsx` — menor 7.
- `apps/api/src/reportes-campo/reportes-campo.service.ts` — menor 8.
- `apps/web/src/components/ui/Modal/Modal.tsx` — menor 9.

## Verificación / pruebas

- `npx tsc --noEmit` (apps/web) → limpio.
- `npm run lint` (apps/web) → 0 errores, 38 warnings (baseline).
- `npm test` (apps/web) → 12/12.
- `npm run build` (API) → limpio; spec de reportes-campo 79/79 (la constante muerta no
  tenía test que la usara).

## Pendientes / riesgos

- El toast del tope dentro del updater puede duplicarse en DEV con StrictMode
  (React 19 re-invoca updaters en dev) — en producción corre una sola vez. Es el
  mismo trade-off que ya acepta el escritorio.
- El revert del padding (menor 9) afecta a TODOS los modales que usan `Modal`/`Modal`
  del kit — smoke rápido de un modal de escritorio en vista móvil (ej. `/reportes`
  a 320-599 px) para confirmar que el modal respira bien con los 8 px de borde.
