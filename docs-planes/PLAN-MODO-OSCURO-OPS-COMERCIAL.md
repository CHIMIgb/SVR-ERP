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

---
## ✅ ESTADO FINAL (2026-11-05): TODAS LAS FASES HECHAS
- Fase 1: 24 reemplazos (paneles de filtros, 10 vistas) — commit 239fa0e2.
- Fase 2: 17 pares dark (banners/alertas — inventario/reportes/corte/config) — 5ddcc964.
- Fase 3: 171 reemplazos (finanzas/conciliación/facturas/clientes/cotizaciones) — 40c26272.
- Fase 4: 34 reemplazos (POS/corte; ticket de impresión sigue blanco) — a2117a16.
- Fase 5: 74 reemplazos (operaciones/criba/config/inventario) — a75f0a41.
- Fase 6: 13 pares dark (soft-colors residuales) + verificación automática
  **cero** `bg-*-50` sin `dark:` en el alcance — 35ba4aed (scan: scan-soft50.cjs).
- Total: ~330 reemplazos/apuntes en ~20 archivos, tsc ✔,	script de fase reproducibles.
- Verificación visual final pendiente del usuario (por favor re-captura si
  queda algo con óptes no soportados por el scope — revisar siempre con
  Contrapartes dark al nuevo archivo)

## FASE 8 — pos.styles.ts (CAUSA RAÍZ de las capturas #3/#7/#8/#9) ✅
- `components/pos/pos.styles.ts` (mapa `posClasses` que pinta TODOS los paneles
  del POS y el corte) nunca había sido tocada: los scripts de fases apuntaban
  a `.tsx`; el PR #13 migró `components/ui/*` pero este archivo no existía aún.
- Migrado a tokens (commit ccfc0388): `card`, `chipInactive`, `billBtn`,
  `terminalBox`, `denomEntry/denomInput`, `summaryCard`, `history*`, `muted/sectionTitle/stepBtn/qtyText/cartTotal*...`
  → `bg-surface`/`border-ui-*`/`text-ui-*`.
- `approvalText` +輪 dark (fase 6 ya había incluido approvalBox).
- **Excepción intencional (intacta):** `ticketPaper`/`ticket*` (papel thermal
  imprime SIEMPRE en blanco).
- Verificadores: tsc web ✔; restos `slate/bg-white` en el archivo: SOLO
  del bloque ticket (intención).

## FASE 7 — barrido de REVISIÓN del usuario (2026-11-05) ✅

El usuario re-capturó (captura#1-/reportes con fila invisible, #2-/proyectos,
#3-botones grises, #4-#8 blancos). Diagnóstico: los scripts de fases anteriores
solo mapeaban algunos patrones, y las páginas troncales (reportes/proyectos/
cobranza/clientes/criba) conservaban clases `slate-*` y `bg-white` en columnas,
botones e items. Fix (commit 0b625f92, script `oscuro-fase7-sweep.cjs`):
- Aplicada la **regla de migración impresa en globals.css** por archivo:
  `bg-white → bg-surface` y `slate-N → ui-N` (light idéntico, dark se invierte
  solo por variables). Archivos: proyectos (25), reportes (31), cobranza (41),
  clientes (4), criba (1), DataTable.styles (0 — ya tokens del PR13).
- Verificación: **slate remanente = 0 en el alcance** (scan de 25 niveles),
  `tsc web` 0 errores ✔.
- Los botones "grises" en dark dejan de existir porque sus clases ya son
  ui-100/ui-200 (los botones de estilo del PR13 son de color sólido — ok).
