# Cola PWA con fotos del alta + helper de imágenes compartido (1/2 del formulario paritario)

**Fecha:** 2026-11-19
**Autor:** agente
**Plan de origen:** paridad de inputs del formulario de reportes con el escritorio (autorizado 2026-11-19, commit a de 2)

## Cambios realizados
- **`lib/imagenes.ts` (nuevo):** `convertirAWebp` (canvas WebP calidad 0.85), `MAX_IMAGENES` (4) y `MAX_TAMANO_IMAGEN` (2 MB) movidos desde la página de escritorio `/reportes` — el escritorio ahora los importa de aquí (única fuente; la conversión es local, sin red). **Único cambio al escritorio: el import y la eliminación de sus duplicados**, sin cambios de comportamiento.
- **`lib/pwa/offline.ts`:** `ElementoCola.adjuntos?: AdjuntoPendiente[]` (`{nombre,mime,tamano,datos}` base64 WebP) — campo opcional, **sin bump de IndexedDB** (el store keyPath `id` no cambia). Las fotos viajan junto al item, NO en el `payload` (el ValidationPipe rechazaría props extra en el POST). `encolar(endpoint, payload, adjuntos?)` acepta el tercer parámetro.
- **`lib/pwa/sincronizador.ts`:** `PuertoEnvio` ahora devuelve también `data` (el apiClient ya la entregaba). Tras el **ACK** del reporte, si el item trae adjuntos y hay `data.id`, los adjunta en secuencia con `reportesCampoApi.adjuntar()` — igual que el escritorio (que adjunta después de crear). Si un adjunto falla, el reporte queda guardado y el fallo se registra con `console.warn` (mismo comportamiento aceptado en escritorio: «súbelas desde el detalle»).

## Cosas nuevas
- Fotos offline-first: el operario toma las fotos sin señal y el sincronizador las sube solo al volver, después del reporte (FIFO garantiza el orden).

## Archivos tocados
- `apps/web/src/lib/imagenes.ts` (nuevo)
- `apps/web/src/app/(dashboard)/reportes/page.tsx` (import + eliminación de duplicados)
- `apps/web/src/lib/pwa/offline.ts`
- `apps/web/src/lib/pwa/sincronizador.ts`
- `historial-cambios/2026-11-19-pwa-cola-adjuntos.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 37 warnings preexistentes.
- `git diff --check`: sin errores.
- El smoke del flujo completo (reporte + fotos con y sin señal) llega con el commit b (el modal que usa esta infraestructura).

## Pendientes y riesgos
- Si un adjunto falla tras el ACK, la foto se pierde del item (el reporte ya se borró de la cola): misma aceptación del escritorio; el detalle permite re-subir.
- Un conflicto (409) con fotos mantiene todo en la cola hasta la decisión humana (Descartar también descarta las fotos).
- Sin push: el commit queda local.
