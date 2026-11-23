# 2026-11-20 — conversión de imágenes con MIME real + guardia de secuencia en /m/reportes — menores 5 y 6 PR #23

## Cambios realizados

**Menor 5 — `convertirAWebp` etiquetaba PNG como WebP:** `canvas.toBlob('image/webp')`
en navegadores sin encoder WebP (algunos Safari/iPhone) devuelve el PNG del fallback,
que el código etiquetaba `image/webp` fijo — la firma del server (`RIFF....WEBP`)
rechazaría el adjunto con 422.

Fix:
- `lib/imagenes.ts`: si el blob NO es `image/webp`, re-codifica a **JPEG** (universal,
  y para fotos pesa menos que PNG) y `ImagenConvertida` gana `mime` — el MIME REAL del
  blob que se produjo.
- Los 4 callers dejaron de hardcodear `mime: 'image/webp'` + extensión `.webp`
  (escritorio `/reportes` en alta y detalle, PWA `/m/reportes` detalle y
  `ModalNuevoReporte` del alta offline): usan `webp.mime` y la extensión derivada
  (`.webp`/`.jpg`). El server valida la FIRMA del contenido, no la extensión — pero
  el nombre ahora tampoco miente.

**Menor 6 — carrera de `recargar` en `/m/reportes`:** sin guardia de secuencia, una
respuesta vieja (cambio de filtro/búsqueda/página mientras corren dos consultas) podía
pisar los datos de la más nueva. Fix: `corridaRef` (contador) — cada llamada incrementa
y solo aplica resultados/setState si sigue siendo la ÚLTIMA corrida; el `finally`
también solo baja `refrescando` de la corrida vigente (una vieja que termina tarde no
apaga el spinner de la nueva).

## Cosas nuevas

- `ImagenConvertida.mime` (campo público del helper compartido).
- Ningún componente nuevo.

## Archivos tocados

- `apps/web/src/lib/imagenes.ts`
- `apps/web/src/app/(dashboard)/reportes/page.tsx` — 2 sitios.
- `apps/web/src/app/(pwa)/m/reportes/page.tsx` — adjuntar + guardia de secuencia.
- `apps/web/src/components/pwa/ModalNuevoReporte/ModalNuevoReporte.tsx`

## Verificación / pruebas

- `npx tsc --noEmit` (apps/web) → limpio.
- `npm run lint` → 0 errores, 38 warnings (baseline de la rama).
- `npm test` (apps/web) → 12/12.
- Sin test automatizado del encode (jsdom no implementa `canvas.toBlob` con codecs
  reales): la verificación del caso Safari es el **smoke en iPhone** que pide la
  review.

## Pendientes / riesgos

- **Probar en iPhone real** (la review lo pide explícito): tomar una foto en
  `/m/reportes` y verificar que el adjunto sube (Safari viejo → JPEG) y que la vista
  previa lo muestra. Si tu Safari sí codifica WebP, seguirá siendo WebP — el fix solo
  actúa cuando el navegador no puede.
- Las fotos JPEG pesan más que WebP (calidad 0.85 a 2048px: ~300-800 KB): siguen
  dentro del tope de 10 MB con holgura.
- La guardia de secuencia cubre `recargar` del listado; `cargarStats` sigue sin guardia
  (stats no compiten por el mismo estado del listado — riesgo menor, no tocado).
