# PLAN + Control — Modo oscuro para las vistas de Operaciones y Comercial

**Fecha:** 2026-11-05
**Origen:** revisión visual del usuario (16 capturas). Base de infra: PR #13
(tokens `ui-*`/`surface`, `@custom-variant dark`, componentes UI ya adaptados).
**Patrón a seguir (impuesto por el PR #13 / COMPONENTS.md):** solo contrapartes
`dark:` + tokens — nada de CSS nuevo, nada de colores crudos nuevos.
**Reglas fijas:** 1 commit + registro por fase; impresibles (ticket 58mm del POS,
recibos) permanecen EN BLANCO por diseño; nada backend.

---

## FASE 0 — control (este archivo) ✅

## FASE 1 — Componentes compartidos
| Lugar | Archivo(s) | Trabajo | Estado |
|---|---|---|---|
| Panel de filtros (Select compartido) | `components/ui/Select/Select.styles.ts` (+ .tsx) | opciones/placeholder visibles en oscuro | ✅ |
| EmptyState | `components/ui/EmptyState/*` | icono/texto con contraparte | ✅ |
| Modal legacy del layout (inputClass/selectClass… usados por modales viejos) | `components/layout/Modal.tsx` (imports de los views CRM) | clases con `dark:` | ✅ |
| Modal.styles del layout | `components/layout/Modal.styles.ts` | tokens | ✅ |

## FASE 2 — Banners/alertas (patrón `*-50` → `dark:*-500/10`)
| Lugar | Archivo | Estado |
|---|---|---|
| Banner críticos inventario | `inventario/page.tsx` | ✅ FASE 2 HECHA (5ddcc964) |
| Banner críticos reportes | `reportes/page.tsx` | ✅ FASE 2 HECHA |
| Alerta "Fuera de la ventana de cierre" | `ventas/corte/page.tsx` | ✅ FASE 2 HECHA |
| Panel amarillo "Impacto en el sistema" | `configuracion/page.tsx` | ✅ FASE 2 HECHA |

## FASE 3 — Finanzas / Facturas / Clientes / Cotizaciones
| Lugar | Archivo | Estado |
|---|---|---|
| Tab Movimientos — tabla flujo neto | `finanzas/page.tsx` | ✅ |
| Tab Conciliación | `finanzas/?` (components/finanzas/ConciliacaoBancaria) | ✅ |
| Form de conceptos de Nueva Factura | `facturas/page.tsx` | ✅ |
| Detalle de cliente (modal) | `clientes/page.tsx` | ✅ |
| Detalle de cotización (modal) | `cotizaciones/page.tsx` | ✅ |

## FASE 4 — Ventas (POS) / corte de caja
| Lugar | Archivo | Estado |
|---|---|---|
| POS (producto, pago, carrito, chips de billetes) | `ventas/page.tsx` + `components/pos/*` | ✅ |
| Corte de caja (tarjetas $, chips, arqueo) | `ventas/corte/page.tsx` + `components/pos/CorteCaja.tsx` | ✅ |
| Impresión de ticket 58mm | `components/pos/*` (parte de impresión) | 🔒 NA — permanece blanco |

## FASE 5 — Operaciones / Criba / Inventario / Configuración
| Lugar | Archivo | Estado |
|---|---|---|
| Tablas/labels de operaciones | `operaciones/page.tsx` | ✅ |
| Cards de criba (merma blanca) | `criba/page.tsx` | ✅ |
| Cards de configuración (apertura/cierre) | `configuracion/page.tsx` | ✅ |
| Inventario (resto general si hiciera falta) | `inventario/page.tsx` (predates) | ✅ |

## FASE 6 — Barrido final del alcance (fts)
- `grep -R "bg-white|bg-slate-50|text-slate-9(00)|border-slate-2|bg-(red|green|blue|orange|amber|yellow|pink|rose|emerald|teal|indigo|purple|violet|slate)-50\b"`en apps/web/src/app/(dashboard) y components — solo grupos Operaciones/Comercial (y los compartidos usados por ellos), lista de cumplimiento por archivo.
- `npx tsc --noEmit` web + revisión visual del usuario (capturas).

## pendiente global
- ✅ nada backend; registrado por fase en historial-cambios/;
- Nibles de impresión de POS NO cambian (se mantiene blanca en ambos modos).
