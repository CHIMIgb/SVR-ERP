# Modo oscuro Ops/Comercial — FASE 5 (operaciones, criba, configuración, inventario)

**Fecha:** 2026-11-05
**Autor:** agente OpenCode

## Cambios realizados
- **74 reemplazos** con `scripts/oscuro-fase5.cjs` (mismos pares base:
  `bg-white→bg-surface`, `bg-slate-*→bg-ui-*`, `text/border-slate-*→ui-*`):
  - `operaciones/page.tsx` (20) — tablas de bitácora y todas sus cajas
    (captura #1: texto bajo sobre fondo oscuro).
  - `criba/page.tsx` (26) — cards con "MERMA del material" en blanco y todo el
    layout de stats (captura #12).
  - `configuracion/page.tsx` (13) — cards de apertura/cierre y textos
    (fase 2 ya había hecho su banner amarillo).
  - `inventario/page.tsx` (15) — remanente general (fase 2 ya hizo su banner).
- `npx tsc --noEmit` web: 0 errores ✔

## Archivos tocados
- 4 `page.tsx` + `apps/api/scripts/oscuro-fase5.cjs`.

## Pruebas / verificación
- tsc web ✔ — visual pendiente del usuario.

## Pendientes y riesgos
- **Fase 6 (barrido final)**: soft-colors residuales (`bg-*-50`, `text-*-900`)
  del alcance + verificación de Charts (hex en props) si el usuario las pide.
