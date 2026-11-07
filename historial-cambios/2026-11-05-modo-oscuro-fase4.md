# Modo oscuro Ops/Comercial — FASE 4 (POS /ventas + corte de caja)

**Fecha:** 2026-11-05
**Autor:** agente OpenCode

## Cambios realizados
- **34 reemplazos** con `scripts/oscuro-fase4.cjs` (mismos pares:
  `bg-white→bg-surface`, `bg-slate-*→bg-ui-*`, `text/border-slate-*→ui-*`):
  - `ventas/page.tsx` (5) — carrito, items vendidos (captura #3).
  - `components/pos/CorteCaja.tsx` (22) — tarjeta Totales/desglose/billetes/
    bandas de moneda y contadores (capturas #8 y #9).
  - `components/pos/CartItemRow.tsx` (3) — carrito.
  - `components/pos/PaymentPanel.tsx` (3) — "Cambio:", cuenta SPEI.
  - `components/pos/ProductPicker.tsx` (1) — empty state.
- **TicketPreview.tsx NO se migró** por diseño: el ticket térmico 58mm que se
  imprime queda SIEMPRE en blanco (regla fija del plan).

## Archivos tocados
- Los 5 de arriba + `apps/api/scripts/oscuro-fase4.cjs`.

## Pruebas / verificación
- `npx tsc --noEmit` web: 0 errores ✔
- Visual pendiente del usuario.

## Pendientes y riesgos
- Fase 5 restante: operaciones (labes de tablas — captura #1), criba (cards
  merma — captura #12), integración general con configuración si quedara algo,
  y fase 6 (barrido final + soft-colors del resto).
