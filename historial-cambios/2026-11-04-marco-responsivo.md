# Marco responsivo en tablet + encabezado de página y tablas

**Fecha:** 2026-11-04
**Autor:** P4chec0php

## Cambios realizados
- **Menú lateral fijo desde 1024 px (antes 768 px).** En tablet el menú de 288 px dejaba ~480 px a la
  página: la barra superior se cortaba, el buscador quedaba en la lupa y los encabezados se aplastaban.
  Abajo de 1024 px se usa el cajón con hamburguesa que ya existía para celular.
  (`Sidebar.tsx`, `Topbar.tsx`, `app/(dashboard)/layout.tsx`: solo cambia el corte `md:` → `lg:`.)
- **`PageHeader`:** las acciones bajan de línea cuando no caben junto al título (antes el título se
  aplastaba hasta desaparecer y los botones se cortaban por `overflow-hidden`). Título y subtítulo hacen
  salto de línea en vez de truncarse. Mismas props.
- **`Tabs`:** los botones ahora son `type="button"` (dentro de un `<form>` enviaban el formulario) y
  exponen `aria-pressed`; relleno un poco menor en celular para que quepan 4 pestañas.
- **`DataTable`:** prop opcional `headerVariant` (`'brand'` por defecto = naranja alternado de siempre;
  `'neutral'` = encabezado gris claro, alineado como cada columna). Las tablas existentes no cambian.
- `layout/Modal.tsx` (modal legacy de Flota y Horómetro): su desplazamiento por el menú lateral ahora usa
  el mismo corte de 1024 px (con 768 px quedaba corrido 288 px en tablet).
- Accesibilidad con teclado: las filas clicables de `DataTable` y los `StatsCard` clicables ahora se
  enfocan con Tab y se activan con Enter / Espacio, con foco visible. `Tabs` acepta `ariaLabel` para
  nombrar el grupo.
- `COMPONENTS.md`: comportamiento responsivo de `PageHeader` y la prop nueva de `DataTable`.

## Cosas nuevas
- `headerVariant` en `DataTable` y su estilo `thNeutral`.

## Archivos tocados
- `apps/web/src/components/layout/Sidebar.tsx`, `Topbar.tsx`, `Modal.tsx` (modificados)
- `apps/web/src/components/ui/StatsCard/StatsCard.tsx`, `StatsCard.styles.ts` (modificados)
- `apps/web/src/app/(dashboard)/layout.tsx` (modificado)
- `apps/web/src/components/ui/PageHeader/PageHeader.tsx`, `PageHeader.styles.ts` (modificados)
- `apps/web/src/components/ui/Tabs/Tabs.tsx`, `Tabs.styles.ts` (modificados)
- `apps/web/src/components/ui/DataTable/DataTable.tsx`, `DataTable.styles.ts` (modificados)
- `COMPONENTS.md` (modificado)

## Pruebas / verificación
- `npx tsc --noEmit` y `npx eslint` sobre lo tocado: sin errores.
- `npm run build` de `apps/web`: correcto.
- Capturas reales en Chrome (login real, API local) a 390, 768, 1024 y 1440 px, claro y oscuro: con el
  corte en 1024 la barra superior y los encabezados ya no se cortan en tablet.

## Pendientes y riesgos
- Afecta el acomodo de **todas** las vistas entre 768 y 1023 px (ahora sin menú fijo): es intencional.
- `DataTable` oculta la barra de scroll horizontal (`scrollbar-none`); con mouse no se nota que hay más
  columnas. En las vistas nuevas se ocultan columnas secundarias en pantallas medianas para que la tabla
  quepa. No se cambió el componente.
