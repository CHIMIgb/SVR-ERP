# Fase 4 (bloque 3): `lint` como gate en CI

**Fecha:** 2026-11-18
**Autor:** Agente (Fase 4 autorizada por el usuario, opción "excepción acotada
+ arreglos reales")

## Contexto

Tras arreglar los 10 errores locales (bloque 2) quedaban 11 errores
`react-hooks/set-state-in-effect`, todos en páginas del dashboard que cargan
datos con `useEffect` al montar. El usuario eligió una excepción acotada en vez
de migrar esas páginas a una librería de caché de datos.

## Cambios realizados

- `apps/web/eslint.config.mjs`: nuevo bloque de configuración que desactiva
  `react-hooks/set-state-in-effect` **únicamente** en 11 archivos listados uno
  por uno (clientes, configuración, cotizaciones, criba, equipos, inventario,
  operaciones, proyectos, roles, usuarios y ventas/cierres). El resto del
  proyecto conserva la regla.
- `.github/workflows/ci.yml`: el job `web` pasa a correr `npm run lint` y
  `npm test -- --runInBand` además de `npx tsc --noEmit`. Se actualizó el
  comment de cabecera (ya no dice que lint está fuera). El paso de tests es una
  adición pequeña para que los 4 tests nuevos no queden como código muerto.
- Documentación de estado actualizada (no registros históricos): `AGENTS.md`,
  `.opencode/agent/svr-erp.md` y el plan
  `docs-planes/PLAN-CI-CD-ENDURECIMIENTO.md` con Fase 4 ejecutada, brechas B5/B6
  cerradas y la desviación deliberada del plan explicada.

## Cosas nuevas

- Gate de lint en PR: un error de ESLint en cualquier archivo fuera de la
  excepción falla el check `web`.
- Los tests frontend corren en CI.

## Archivos tocados

- `apps/web/eslint.config.mjs` (modificado)
- `.github/workflows/ci.yml` (modificado)
- `AGENTS.md` (modificado)
- `.opencode/agent/svr-erp.md` (modificado)
- `docs-planes/PLAN-CI-CD-ENDURECIMIENTO.md` (modificado)
- `historial-cambios/2026-11-18-fase4-lint-gate.md` (creado)

## Pruebas / verificación

- `npm run lint` en `apps/web`: **0 errores, 37 warnings** preexistentes, exit 0
  (antes: 21 errores).
- Comprobación negativa: un archivo temporal fuera de la lista con
  `useEffect(() => setX(1), [])` dio 1 error de `set-state-in-effect`; se borró
  el archivo después. La excepción no es global.
- `npm test -- --runInBand` en `apps/web`: 3 suites, 4 tests, exit 0.
- `npx tsc --noEmit`: exit 0.
- `git diff --check`: exit 0.

## Pendientes y riesgos

- No se corrió el job `web` en GitHub: el cambio está local y no hay push
  autorizado. Falta confirmar en remoto que `lint` y `test` pasan con `npm ci`
  limpio (en local se instaló con `--ignore-scripts` por un fallo interno de
  Arborist).
- La excepción es deuda explícita: las 11 páginas siguen cargando en un effect.
  Quitarla exige migrarlas a caché de datos (TanStack Query/SWR), no es gratis.
- Los 37 warnings no bloquean porque no se usa `--max-warnings=0`.
- No se hizo push ni PR (no ordenados).
