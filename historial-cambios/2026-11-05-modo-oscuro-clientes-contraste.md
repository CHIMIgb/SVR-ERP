# Modo oscuro — ajuste de contraste en /clientes (avatar y acciones)

**Fecha:** 2026-11-05
**Autor:** agente OpenCode (por capturas del usuario)

## Diagnóstico
- El avatar del cliente usaba `bg-ui-900` — en modo claro es casi negro, pero
  en oscuro se INVIERTE a un tono claro: la letra blanca se perdía (captura
  del usuario: "haz la letra negra").
- Los botones **Ver / Cuenta** usaban variante `outline` (transparente con
  borde): sin color propio, quedaban apagados en oscuro.

## Cambios realizados (SOLO variables globales, como pide el usuario)
- Avatar: `bg-ui-900` → **`bg-secondary dark:bg-ui-200`** — el mismo patrón
  del PR #13 en otros avatares (claro: slate oscuro con letra blanca;
  oscuro: `ui-200` con letra blanca, legible).
- Acciones: `Ver` → **variant="info"** (azul global) · `Cuenta` →
  **variant="primary"** (naranja global). Color sólido en ambos modos.

## Archivos tocados
- `apps/web/src/app/(dashboard)/clientes/page.tsx` (3 líneas).

## Pruebas / verificación
- `npx tsc --noEmit` web ✔ — visual pendiente del usuario.

## Pendientes y riesgos
- Si esta pareja de botones con color sólido se repite en otras vistas
  (proyectos ya usa info/primary/secondary), revisar coherencia en fase de
  barrido.
