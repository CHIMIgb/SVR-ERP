# Tarjeta roja del Inicio del residente con variante dark

**Fecha:** 2026-11-21
**Autor:** SVR-ERP Dev (agente)

## Cambios realizados
- Menor 7 de la segunda revisión del PR #23: la tarjeta "Requieren tu
  atención" del Inicio (`/m`) usa el patrón dark del repo
  (COMPONENTS.md 1.2): `dark:bg-red-500/10`, `dark:border-red-500/30`,
  `dark:text-red-300` (títulos/número) y `dark:text-red-400` (icono/dato
  menor), con hover/active dark (`dark:hover:bg-red-500/20`).
  Antes quedaba sobre fondo claro (`bg-red-50/text-red-700`) dentro del
  tema oscuro de la PWA.

## Archivos tocados
- apps/web/src/app/(pwa)/m/page.tsx (modificado)

## Pruebas / verificación
- `npx tsc --noEmit` en apps/web: limpio.
- `npm run lint`: 0 errores, 38 warnings preexistentes.
- `npm test -- --runInBand`: 6 suites, 20/20 tests.
- `git diff --check`: limpio.
- Smoke visual del tema oscuro: NO realizado (es cambio de clases que
  sigue el patrón ya en uso en /m/reportes y Toast).

## Pendientes y riesgos
- Ninguno funcional: solo clases. El smoke visual del modo oscuro en el
  teléfono queda pendiente para la ronda de smoke del PR.
