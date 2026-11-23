# Lupa con la prop nativa del kit Input (el icono tapado por el input)

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** «no se ve el icono de la lupa en la barra de búsquedas»

## Causa raíz
Mi envoltorio manual (`relative` + `Search` absoluto antes del `Input`) quedó
TAPADO por el fondo del propio input (el icono se renderizaba antes en el
DOM y el input opaco le ganaba). Y era innecesario: **el kit `Input` ya
soporta `icon` + `iconPosition`** con el posicionamiento y el padding
correctos (`iconLeft` + `pl-10`).

## Cambios realizados
- `(pwa)/m/reportes/page.tsx`: eliminado el envoltorio manual; el
  `Input` del buscador ahora usa la **prop nativa del kit**:
  `icon={<Search className="w-4 h-4" />}` (iconPosition left, default).

## Archivos tocados
- `apps/web/src/app/(pwa)/m/reportes/page.tsx`
- `historial-cambios/2026-11-20-lupa-kit-input.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 38 warnings preexistentes.
- `git diff --check`: sin errores.
- Smoke pendiente: la lupa visible a la izquierda del placeholder.

## Pendientes y riesgos
- Lección para el catálogo: el kit `Input` soporta íconos — verificar la
  doc del kit antes de construir envoltorios manuales.
- Sin push: el commit queda local.
