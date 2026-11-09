# El Residente tampoco agrega imágenes (solo seguimiento completo)

**Fecha:** 2026-11-09
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

Coherencia con la función ya definida (solo seguimiento — no aceptar):
**"Agregar imagen"** desaparece para el rol Residente en el detalle del
incidente y en el modal Editar. El residente sigue pudiendo **comentar**
(bitácora textual) y ver las imágenes que sube la torre que atiende.

Backend reforzado con el mismo patrón: `POST /:id/adjuntos` rechaza al rol
Residente → `RESIDENTE_SOLO_SEGUIMIENTO` (403, audita FAIL antes de lanzar).

## Archivos tocados

- `apps/web/src/app/(dashboard)/reportes/page.tsx` (gating esResidente en los
  inputs de imagen del detalle y del editar)
- `apps/api/src/reportes-campo/service.ts` (guard en adjuntar)

## Pruebas / verificación

- Unitarios 81/81 · integración real 26/26 (sin cambios de comportamiento para
  otros roles) · `tsc --noEmit` api+web.

## Pendientes y riesgos

- El comentario textual del residente sigue permitido — si algún día el
  seguimiento debe ser read-only puro, es el mismo guard en `comentar`.
