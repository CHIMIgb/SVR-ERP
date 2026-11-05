# Modo oscuro Ops/Comercial — FASE 1 (componentes de filtros)

**Fecha:** 2026-11-05
**Autor:** agente OpenCode (alcance definido por el usuario: solo Operaciones y Comercial)

## Cambios realizados
- **Plan de control creado**: `docs-planes/PLAN-MODO-OSCURO-OPS-COMERCIAL.md`
  (6 fases con archivo/lugar/estado por captura del usuario).
- **Fase 1 ejecutada**: paneles de filtros inline de las 11 vistas del alcance
  migrados a tokens del PR #13:
  - panel `bg-slate-50 border-slate-200` → `bg-ui-50 border-ui-200`
  - select del panel `bg-white border-slate-200` → `bg-surface border-ui-200 text-ui-900`
- Hallazgo: los componentes compartidos (Select/SearchBar/EmptyState/Modal del
  layout) **ya venían adaptados por el PR #13** — el quiebre era el panel
  escrito a mano en cada página (patrón repetido), no el componente.
- Vistas tocadas: reportes, operaciones, criba, inventario, proyectos,
  cotizaciones (×4), facturas, finanzas, cobranza, ventas/cierres (24 reemplazos
  con `scripts/oscuro-fase1.cjs`, reproducible).
- Ventas/page.tsx y ventas/corte sin cambios en esta fase (su panel va con la
  fase 4 del POS/corte para no trocearlos).

## Archivos tocados
- `docs-planes/PLAN-MODO-OSCURO-OPS-COMERCIAL.md` (nuevo)
- `apps/api/scripts/oscuro-fase1.cjs` (nuevo, script de fase)
- 10 `page.tsx` del alcance (modificados)

## Pruebas / verificación
- `npx tsc --noEmit` web: 0 errores ✔
- Visual pendiente del usuario (capturas #1×#16 del alcance).

## Pendientes y riesgos
- Label `text-slate-500` dentro de algunos paneles se revisa en fase 2/5 junto
  con el resto de la vista (no mezclado aquí para reducir el riesgo).
- El alcance del resto de fases: 2 banners/alertas, 3 finanzas+modales
  clientes/cotizaciones/facturas, 4 ventas/POS/corte, 5 operaciones/criba/
  configuración/inventario restante + 6 barrido final del alcance.
