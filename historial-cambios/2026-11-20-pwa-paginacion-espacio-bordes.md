# 2026-11-20 — Paginación de la PWA despegada y con esquinas suaves

## Cambios realizados

Ajuste visual pedido por el usuario para la PWA: la paginación de `/m/reportes` estaba
pegada al contenedor principal y sin forma propia.

- Espacio entre el contenedor y la paginación (`mt-3`).
- La paginación ahora se ve como un rectángulo independiente: borde completo
  (`border border-ui-100`) y esquinas **ligeramente** redondeadas (`rounded-lg`, 8px).

**Dónde:** SOLO en el uso de la PWA (`/m/reportes/page.tsx`), vía la prop `className`
del kit — el componente `Pagination` NO se tocó (compartido con el escritorio, que
sigue colgándola de la tabla con `border-t rounded-b-xl` como siempre). `tailwind-merge`
resuelve el conflicto: la `className` del caller gana sobre `rounded-b-xl`.

## Archivos tocados

- `apps/web/src/app/(pwa)/m/reportes/page.tsx`

## Verificación / pruebas

- `npx tsc --noEmit` → limpio.
- `npm run lint` → 0 errores, 38 warnings (baseline de la rama).

## Pendientes / riesgos

- Verificación visual del usuario en el teléfono (320px: el bloque de "Mostrando X-Y"
  se apila — el `mt-3` y el borde se aplican igual).
- Si otra pantalla PWA paginada quiere el mismo look, replicar la `className` (o
  decidir entonces una variante en el kit — hoy solo hay 1 caso, no justifica).
