# Modo oscuro Ops/Comercial — FASE 2 (banners y alertas)

**Fecha:** 2026-11-05
**Autor:** agente OpenCode

## Cambios realizados
- Contrapartes `dark:` en los 4 banners/alertas del alcance (17 pares aplicados
  con `scripts/oscuro-fase2.cjs`, reproducible):
  - **inventario**: banner "Alerta de Stock Crítico" — fondo rojo claro→
    `dark:bg-red-500/10` + bordes/textos (`red-300/400`).
  - **reportes**: banner "Incidentes Críticos Activos" — igual patrón.
  - **ventas/corte**: alerta "Fuera de la ventana de cierre de caja".
  - **configuracion**: panel amarillo "Impacto en el sistema" +
    modal/bloque "Sin permiso" (círculo y textos).
- Los iconos de alerta con fondo `red-500` sólido se conservan (legibles en
  ambos modos).

## Archivos tocados
- `apps/web/src/app/(dashboard)/inventario/page.tsx`
- `apps/web/src/app/(dashboard)/reportes/page.tsx`
- `apps/web/src/app/(dashboard)/ventas/corte/page.tsx`
- `apps/web/src/app/(dashboard)/configuracion/page.tsx`
- `apps/api/scripts/oscuro-fase2.cjs`
- `docs-planes/PLAN-MODO-OSCURO-OPS-COMERCIAL.md` (fases 1 y 2 marcadas HECHAS)

## Pruebas / verificación
- `npx tsc --noEmit` web: 0 errores ✔
- Visual pendiente del usuario.

## Pendientes y riesgos
- Fase 3 siguiente: finanzas (movimientos/conciliación), form facturas,
  modales detalle de clientes y cotizaciones.
