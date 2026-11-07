# Modo oscuro Ops/Comercial — FASE 6 (barrido final de soft-colors)

**Fecha:** 2026-11-05
**Autor:** agente OpenCode

## Cambios realizados
- **13 pares `dark:` añadidos** en soft-colors residuales del alcance con
  `scripts/oscuro-fase6.cjs`:
  - cotizaciones (1) — caja roja de alerta en el modal.
  - cobranza (4) — tarjetas green/red del balance, hover rojo, banda ámbar.
  - ventas (2) — banner + caja rosada de método en el POS.
  - pos components (5) — hover de carrito, alerts de CorteCaja (ámba/blue/red
    ×2) y pos.styles (approvalBox óptimas).
- **Verificación de lanzamiento (sin dejar partes sin cubrir):**
  - `scan-soft50.cjs` (nuevo, reproducible): define el alcance y al final
    confirma `bg-*-50 SIN dark: = 0` en las 13 carpetas del alcance ✔.
  - Coherencia con el resto del PR #13 (tokens, `ui-*`, componentes ya
    adaptados).
- El rect `fill="#111827"` de `TicketPreview` se CONSERVA: es el ticket
  impreso 58mm que queda SIEMPRE blanco (regla del plan).

## Archivos tocados
- cotizaciones/cobranza/ventas page.tsx + pos (Cart/Corte/pos.styles) + scripts.

## Pruebas / verificación
- node scan: cualquier archivo del alcance que quede sin pares dark ahora
  marca 0 ✔
- `npx tsc --noEmit` web: 0 errores ✔.

## Pendientes y riesgos
- Revisión visual del usuario con capturas refrescadas — si algo quedó suelto,
  lo re-capturamos y se atene en un release extra (siempre con contraparte dark).
- Los otros módulos (RRHH y Maquinaria, Sistema) NO son del alcance en este
  plan (quedaron con PR13) — si se quiere saturarlos también, nuevo plan.
