# Clasificación de las vistas PWA por módulo Comercial / Operaciones

**Fecha:** 2026-11-18
**Autor:** agente

## Cambios realizados
- Se agregó al catálogo `docs-planes/docs-pwa/VISTAS-PWA.md` una sección «Clasificación por módulo (Comercial / Operaciones)» con la equivalencia vista PWA → ruta del escritorio, según el listado entregado por el usuario y confirmado contra `ROUTE_META` del sidebar.
- Operaciones: `/m/reportes` → `/reportes`, `/m/inventario` → `/inventario`, `/m/obras` → `/proyectos`.
- Comercial: `/m/pos` → `/ventas`, `/m/corte` → `/ventas/corte`, `/m/finanzas` → `/finanzas`.
- Quedan fuera de la clasificación, por decisión del usuario: `/m` (Inicio), `/m/asistencia`, `/m/contactos`, `/m/perfil`, `/m/flota-obras`, `/m/diesel` y `/m/modulos`. El catálogo completo de las 13 vistas se conserva sin cambios.

## Cosas nuevas
- Sección nueva en `docs-planes/docs-pwa/VISTAS-PWA.md`.

## Archivos tocados
- `docs-planes/docs-pwa/VISTAS-PWA.md` (editado)
- `historial-cambios/2026-11-18-vistas-pwa-clasificacion-modulos.md` (creado)

## Verificación / pruebas
- Solo documentación: no se corrió `tsc`, lint ni tests.
- Las rutas de los módulos se contrastaron con `ROUTE_META` en `apps/web/src/components/layout/Sidebar.tsx` (Comercial y Operaciones coinciden con el listado del usuario).

## Pendientes y riesgos
- `/m/obras` se mapea a `/proyectos` por equivalencia de dominio (obras = proyectos); no existe una ruta `/obras` en el escritorio.
- `/m/flota-obras` y `/m/diesel` quedan fuera aunque el primero toca proyectos y el segundo combustible: el usuario confirmó que no pertenecen a estos dos módulos.
