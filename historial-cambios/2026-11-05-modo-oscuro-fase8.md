# Modo oscuro Ops/Comercial — FASE 8 (causa raíz: pos.styles.ts)

**Fecha:** 2026-11-05
**Autor:** agente OpenCode

## Análisis (lo pedido antes del fix)
Las capturas #3/#7/#8/#9 (POS, retiros, corte/arqueo) seguían blancas porque
los 5 archivos stakeholders (page + components pos/*.tsx) SÍ habían sido
migrados etapas antes, PERO todos leen sus clases del mapa compartido
**`components/pos/pos.styles.ts`** (`posClasses.card/chipInactive/denomInput/
summaryCard/...`) — ese `.styles.ts` no estaba en ninguna lista de fases
anterior (los scripts apuntaban a `.tsx`; el PR #13 migró `components/ui/*`
cuando este archivo todavía no existía). La tabla y botones de otros puntos
(#1/#2/#4) ya estaban resueltos por fase 7 en las páginas.

## Cambios realizados
- `pos.styles.ts` migrado a tokens por la regla de `globals.css`
  (`bg-white→bg-surface`, `slate-N→ui-N`) en: card, muted, hint, cartRow/
  stepBtn/qtyText, cartTotalLabel, fieldLabel, chipInactive, billBtn,
  billGroupLabel, terminal*, totalRow/totalLabel, history*, denomEntry/
  denomLabel/denomInput, result*, summaryCard/Value/Label + approvalText con
  dark (approvalBox ya en fase 6).
- **ticketPaper y todo el bloque ticket** permanece intacto — papel térmico
  58mm impreso SIEMPRE blanco (regla del plan).

## Pruebas / verificación
- `npx tsc --noEmit` web 0 errores ✔
- Conteo de restos en pos.styles.ts solo del bloque ticket (intencional) ✔

## Pendientes y riesgos
- Revisión visual del usuario del POS/retiros/corte después de recargar.
