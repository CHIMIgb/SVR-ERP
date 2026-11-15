# Tabs conservan el scroll interno en móvil — `w-fit max-w-full`

**Fecha:** 2026-11-14
**Autor:** Agente (fix 1 de la review del PR #20 · plan en `docs-planes/PLAN-FIXES-REVIEW-PR20-2026-11-14.md`)

## Cambios realizados
- Regresión del mismo día: `6441521a` ("tabs compactos por defecto") agregó `w-fit` a la lista de
  pestañas. Con triggers `shrink-0`, el **piso de min-content** de `width: fit-content` hace que la
  lista se dimensione a la suma completa de pestañas (ej. 5 × 120 px → 624 px): `overflow-x-auto` ya
  no scrollea nada (el contenedor es tan ancho como su contenido) y el desbordamiento sube al
  documento — en móvil se desplazaba la **página entera** en vez de la lista. Medido en la review a
  390 px: antes de `w-fit` la lista quedaba en 358 px con scroll interno; con `w-fit`, 624 px y
  página de 640 px.
- Fix: `w-fit max-w-full` — `max-width: 100%` recorta el ancho usado al del padre (los 12 usos de
  `<Tabs>` viven en flujo de bloque, padre de ancho viewport), así el scroll interno vuelve y en
  desktop la píldora sigue compacta. Una sola línea en `Tabs.styles.ts`.

## Archivos tocados
- `apps/web/src/components/ui/Tabs/Tabs.styles.ts`

## Verificación
- `npx tsc --noEmit` en `apps/web`: sin errores.
- `npx eslint src/components/ui/Tabs`: sin errores.
- ⚠️ **Smoke pendiente del usuario** (no hay infra de tests front): a 390 px en Chrome,
  `/maquinaria` (4 pestañas con contador) y `/asistencia` — la lista debe desplazarse internamente y
  la página no moverse; en desktop la píldora sigue `w-fit`. `/ui-showcase` sirve de segunda
  comprobación.

## Pendientes / riesgos
- Si en el futuro `<Tabs>` vive dentro de un flex row, ahí sí haría falta `min-w-0` en el ancestro
  flex (advertido en comentario del código).
- Los prefijos duplicados de migraciones y el resto del lote del PR #20 siguen el plan en
  `docs-planes/PLAN-FIXES-REVIEW-PR20-2026-11-14.md` (fases 2 y 3).
