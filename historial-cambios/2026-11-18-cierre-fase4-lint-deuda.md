# Cierre de la Fase 4: lint queda como deuda

**Fecha:** 2026-11-18
**Autor:** Agente (decisión del usuario)

## Contexto

El plan original describía los 21 errores de lint como "`react-hooks/refs` en
componentes del web". El diagnóstico real con `npx eslint . --format json` fue
distinto y más caro de arreglar:

- 12 × `react-hooks/set-state-in-effect` en 12 páginas del dashboard y
  `components/ui/Portal/Portal.tsx`.
- 3 × `react-hooks/refs` y 2 × `react-hooks/purity` en `layout/Toast.tsx` y
  `ui/Tooltip/Tooltip.tsx`.
- 2 × `react-hooks/immutability` en `layout/Toast.tsx` y `pos/CorteCaja.tsx`.
- 2 × `react/no-unescaped-entities` en `(dashboard)/configuracion/page.tsx`.

Son 15 archivos, varios de ellos componentes compartidos, y hoy no hay runner
de tests frontend. El usuario decidió dejarlo como deuda en vez de refactorizar
a ciegas.

## Cambios realizados

- Solo documentación: `AGENTS.md` y `.opencode/agent/svr-erp.md` indican ahora
  el diagnóstico real y advierten no activar lint como gate sin tests frontend.
- Registros de Fase 1/2 y de actions actualizados para reflejar el cierre.

## Archivos tocados

- `AGENTS.md` (modificado)
- `.opencode/agent/svr-erp.md` (modificado)
- `historial-cambios/2026-11-18-ci-integracion-y-smoke.md` (modificado)
- `historial-cambios/2026-11-18-actions-versiones.md` (modificado)
- `historial-cambios/2026-11-18-cierre-fase4-lint-deuda.md` (creado)

## Pruebas / verificación

- `git diff --check`: limpio.
- No se corrió lint de nuevo: sigue con 21 errores por decisión.

## Pendientes y riesgos

- Cuando se configure jest + RTL en el web, refactorizar los 12
  `set-state-in-effect` y los componentes compartidos, y recién entonces agregar
  `npm run lint` como gate en `ci.yml`.
- Mientras tanto, los errores puede que aumenten con código nuevo; el CI no lo
  detecta.
