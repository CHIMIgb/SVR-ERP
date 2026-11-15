# Build del web en Railway: Webpack en vez de Turbopack (techo 1 GB del plan gratis)

**Fecha:** 2026-11-15
**Autor:** Agente (autorizado por el usuario: aplicar + pushear)

## Contexto

El servicio Web en Railway muere en build: `next build` con Turbopack (default de Next 16)
consume más memoria que el techo de **1 GB** del plan gratuito — el proceso es matado por el
kernel sin imprimir error (exit 1 silencioso justo tras "Creating an optimized production
build"). Node 24→26 ya corregido con `RAILPACK_NODE_VERSION=26` (variable del dashboard), y la
memoria no se puede subir (límite del plan).

## Cambio

`apps/web/package.json`: `"build": "next build"` → `"build": "next build --webpack"` — el flag
oficial de Next 16 para optar por Webpack en build. `dev` sigue con Turbopack; el Start
Command y el Build Command de Railway no cambian (usan este script). One-line diff.

## Verificación (prueba de memoria simulada en local)

- `NODE_OPTIONS=--max-old-space-size=768 npx next build --webpack` → **EXIT=0**, 82s, las
  30+ rutas prerenderizadas ✓ (equivale al presupuesto del contenedor de 1 GB).
- El mismo build Turbopack (sin cap) también pasa local — la diferencia es solo memoria.

## Pendientes / riesgos

- **No se midió el pico de RSS total** (solo el heap de JS, capado a 768 MB). Webpack es
  casi todo JS: ~768 MB heap + ~150-200 MB overhead debería caber en 1 GB, margen apretado.
  En Railway se fija el heap con la variable `NODE_OPTIONS=--max-old-space-size=768`
  (dashboard del servicio Web — Node en contenedor auto-dimensiona a ~512 MB por defecto,
  probablemente insuficiente).
- Si Railway volviera a matar el build, la palanca siguiente es bajar el heap (700/650 MB).
- `dev` no cambia (Turbopack) — el gotcha de Turbopack en navegación sigue igual en dev.
