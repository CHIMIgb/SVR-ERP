# /reportes — imágenes convertidas a WebP en el navegador + botón Ver en azul (info)

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

1. **Toda imagen que se suba (alta o detalle) se convierte a WebP en el
   navegador** antes de viajjar: canvas drawImage → toBlob('image/webp', 0.85).
   Se acepta cualquier `image/*` (`accept="image/*"`), el archivo guardado pasa
   a llamarse `*.webp` con `mime image/webp` y el límite de 2 MB se aplica al
   WebP resultante (la conversión casi siempre lo reduce antes de tocarlo).
   Logra el commit "pesen menos" sin tocar backend ni storage. Fuera del
   listado MIMES del frontend que quedó obsoleto.
2. **Botón "Ver" de la tabla → `variant="info"`** (fondo azul, blanco) según la
   doc de componentes reutilizables (COMPONENTS.md: info = mostrar informacion).

## Archivos tocados

- `apps/web/src/app/(dashboard)/reportes/page.tsx` (helper `convertirAWebp`,
  `handleAltaImagen`/`handleAdjuntar` convertidas, `accept="image/*"`, botón info)

## Pruebas / verificación

- `npx tsc --noEmit` OK; `eslint` de la página: 0 problemas.
- La conversión corre en el browser — prueba real a mano: elegir foto en el
  alta y en el detalle; el nombre WebP y el descuento de tamaño visibles en la
  miniatura/nombre. Cadena server ya cubierta por integración (acepta image/webp).

## Pendientes y riesgos

- Navegadores viejos que no exporten WebP desde canvas (Safari < 15) rechazarán
  con mensaje claro "formato no soportado por el navegador". Desktop moderno y
  el PWA sobre HTTPS (Safari 16+) no presentan problema.
- HEIC directo del iPhone no decodifica en canvas de todos los navegadores —
  si llega a pasar, se lo manejamos con el mensaje de error (o conversión en
  server-side con sharp, si algún día vemos HEIC reales).
