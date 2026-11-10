# /reportes — imágenes capturables en el alta (el gap de la foto de la avería)

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

Cierra la brecha señalada por el usuario: al levantar un reporte (p. ej. bomba de
agua rota) se puede **subir la evidencia en el mismo alta**, sin pasar por el
detalle después.

- Modal Crear: sección **"Imágenes de la avería (opcional)"** con botón agregar,
  miniaturas y "quitar" — mismos límites del detalle (máx 4, 2 MB, JPG/PNG/WebP/GIF,
  validados al elegir archivo).
- Al guardar: `handleCreate` crea el incidente (folio INC) y enseguida sube cada
  imagen vía `POST /:id/adjuntos` en secuencia, pegada al incidente recién nacido.
  Para la BD sigue siendo el orden exigido (incidente primero), para el usuario
  es un solo paso.
- Fallo parcial: si una imagen no sube, el **incidente queda creado** y el toast
  avisa cuáles fallaron ("súbelas desde el detalle") — nunca se pierde el reporte
  por una imagen. Staging en memoria (base64 con FileReader); si la página se
  cierra a mitad del alta, las imágenes en espera se pierden (lo documentado
  como costo hasta el modo offline del PWA).
- Backend sin cambios: los límites de `POST /:id/adjuntos` revalidan al subir.

## Archivos tocados

- `apps/web/src/app/(dashboard)/reportes/page.tsx` (staging `imagenesAlta` + UI + flujo)

## Pruebas / verificación

- `npx tsc --noEmit` OK; eslint de la página: 0 problemas.
- E2E real simulando el mismo flujo del handleCreate con HTTP: crea INC0028 →
  sube 2 imágenes → detalle reporta `adjuntos=2` → delete de limpieza auditar.
- La subida de archivos por el input del browser no se prueba por fetch (requiere
  browser); la cadena ya está cubierta por integración real (24/24).

## Pendientes y riesgos

- Si la app se cierra entre el clic "Registrar" y el fin de las subidas, el
  incidente queda sin alguna imagen (aviso en toast). Offline del PWA lo resuelve.
