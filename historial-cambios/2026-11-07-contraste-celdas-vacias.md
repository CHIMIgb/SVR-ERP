# Contraste del guion de celdas vacías en modo oscuro

**Fecha:** 2026-11-07
**Autor:** P4chec0php

## Cambios realizados
Revisión del modo oscuro de las 8 vistas propias (Trabajadores, Asistencia, Nómina, Flota, Horómetro,
Mantenimiento, Combustible y GPS) y de sus modales. Se usó un detector que mide en el navegador el color
calculado de cada elemento visible.

Resultado:
- **Fondos claros en modo oscuro:** ninguno, ni en las vistas ni en los modales. El recibo de nómina y la
  carta de finiquito siguen en blanco a propósito (documentos en papel).
- **Texto con bajo contraste:** el guion "—" de las celdas sin dato y el separador "–" entre la hora de
  entrada y la de salida usaban `text-ui-300`:
  - En oscuro (`#475569` sobre `#1e293b`) daba 1.93:1, casi invisible.
  - En claro daba cerca de 1.5:1.
  - Se pasó a `text-ui-500`: 5.7:1 en oscuro y 4.76:1 en claro (cumple WCAG AA en los dos).
  - Es el mismo gris que ya usa "En nómina" en la tabla de Asistencia.

No se tocaron los `text-ui-300` de los componentes compartidos. Son días deshabilitados del calendario,
el botón deshabilitado del paginador, íconos y el separador del selector de hora: elementos deshabilitados o
decorativos, que la WCAG exenta.

El texto blanco sobre el naranja primario (menú activo, botones principales y página activa del paginador)
da 2.67:1, igual en los dos temas. Es una decisión de marca, no del modo oscuro, y queda fuera de este cambio.

## Archivos tocados
- `apps/web/src/app/(dashboard)/trabajadores/page.tsx` (2)
- `apps/web/src/app/(dashboard)/asistencia/page.tsx` (5)
- `apps/web/src/app/(dashboard)/nomina/page.tsx` (3)
- `apps/web/src/app/(dashboard)/maquinaria/page.tsx` (1)

## Verificación
- `npx tsc --noEmit` y `npx eslint` de las 4 vistas: sin errores.
- Detector en modo oscuro sobre las 8 vistas a 1440 px y sobre sus 14 modales: 0 fondos claros, y el único
  texto bajo 3:1 que queda es el blanco sobre naranja de marca.
- Capturas de las 4 vistas tocadas a 390, 768, 1024 y 1440 px, en claro y oscuro (32 capturas): el guion se
  lee en los dos temas y el acomodo no cambió.

## Pendientes
- Contraste del blanco sobre el naranja primario: decisión de marca, se consulta aparte.
