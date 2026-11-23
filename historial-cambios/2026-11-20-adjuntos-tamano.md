# Subida de fotos rota por `tamano` — alineado escritorio y PWA

**Fecha:** 2026-11-20
**Autor:** agente
**Reporte:** teléfono real — al adjuntar desde el detalle de la PWA: 400 `property tamano should not exist`.

## Causa raíz
El DTO del server (`AdjuntoDto`) solo acepta `nombre`, `mime`, `datos` — **el
tamaño lo calcula el server desde el base64** (cap 2 MB + firma mágica
RIFF/WEBP/PNG/JPEG/GIF). El `ValidationPipe` con whitelist rechaza la prop
extra. El contrato del front (`lib/api.ts`) declaraba `tamano` y **4 lugares
lo enviaban** — la subida de fotos estaba rota en AMBAS apps (el escritorio
fallaba igual con su toast "imágenes no se subieron"; en la PWA el adjunte
tras ACK fallaba silencioso). Mis tests de integración no lo detectaron
porque enviaban el payload correcto.

## Cambios realizados
- `lib/api.ts`: `adjuntar()` ya no declara `tamano` (contrato alineado al DTO).
- PWA: `handleAdjuntar` (detalle) y el adjunte post-ACK del sincronizador
  envían `{nombre, mime, datos}` — el `tamano` se conserva en
  `AdjuntoPendiente` para el límite de 2 MB del lado del teléfono.
- Escritorio: `handleCreate` (alta) y `subirAdjunto` (detalle) sin `tamano`
  — mismo bug, mismo arreglo.

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 37 warnings preexistentes.
- **End-to-end por API** (como la PWA): login-pin `TRA-0142` → crear con
  idempotenciaKey → `POST /:id/adjuntos` con **WebP real** (firma RIFF/WEBP)
  y payload sin `tamano` → **201 OK**, el detalle lo muestra (1 adjunto).
  Reporte de prueba soft-eliminado por psql (el Trabajador no puede eliminar
  — 403 correcto).
- Smoke pendiente en el teléfono: misma secuencia desde la UI (cámara/galería).

## Archivos tocados
- `apps/web/src/lib/api.ts`
- `apps/web/src/app/(pwa)/m/reportes/page.tsx`
- `apps/web/src/lib/pwa/sincronizador.ts`
- `apps/web/src/app/(dashboard)/reportes/page.tsx`
- `historial-cambios/2026-11-20-adjuntos-tamano.md` (creado)

## Pendientes y riesgos
- El fixture del dump de integración no se regeneró (no cambió schema).
- Sin push: el commit queda local.
