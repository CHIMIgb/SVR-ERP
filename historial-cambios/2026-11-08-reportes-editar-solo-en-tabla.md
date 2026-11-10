# /reportes — quita el botón Editar del detalle (queda en la tabla)

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

Decisión del usuario: el botón Editar estaba duplicado (columna de acciones de la
tabla + acciones del detalle). Se queda en la **columna de acciones de la
tabla**; el detalle pasa a ser puramente de seguimiento: Iniciar / Cerrar /
Asignar + imágenes + actividades.

## Archivos tocados

- `apps/web/src/app/(dashboard)/reportes/page.tsx` (botón Editar fuera del detalle)

## Pruebas / verificación

- `npx tsc --noEmit` (web) OK. Sin cambios de backend ni tests (solo UI).

## Pendientes y riesgos

- Editar sigue permitido hasta que el incidente se cierre; si algún día se
  quiere editar directo desde el detalle, es re-agregar el botón.
