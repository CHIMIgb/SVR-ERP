# Fase 4 (bloque 1): infra de tests frontend

**Fecha:** 2026-11-18
**Autor:** Agente (Fase 4 autorizada por el usuario; opción "excepción acotada
+ arreglos reales")

## Contexto

La Fase 4 del plan exige configurar Jest + React Testing Library antes de
refactorizar código existente: no hay tests frontend y los refactors de hooks
serían a ciegas. Este bloque solo crea la infra y un smoke, sin tocar
componentes de producción.

## Cambios realizados

- `apps/web/package.json`: nuevas devDependencies `jest`,
  `jest-environment-jsdom`, `@testing-library/react`, `@testing-library/dom`,
  `@testing-library/jest-dom`, `@types/jest` y `ts-node`; nuevo script
  `"test": "jest"`.
- `package-lock.json`: actualizado (instalación desde la raíz con `-w web`).
- `apps/web/jest.config.ts`: `nextJest({ dir: './' })` con
  `testEnvironment: 'jsdom'` y `setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']`
  (config recomendada por la doc de Next.js 16).
- `apps/web/jest.setup.ts`: importa `@testing-library/jest-dom`.
- `apps/web/src/components/ui/Portal/Portal.test.tsx`: smoke que comprueba que
  los hijos llegan al `document.body`. Servirá además para verificar el
  refactor de `Portal` en el bloque 2.

## Cosas nuevas

- Runner de tests frontend y sus matchers de DOM.
- Primer test `*.test.tsx` del repo.

## Archivos tocados

- `apps/web/package.json` (modificado)
- `package-lock.json` (modificado)
- `.gitattributes` (creado)
- `apps/web/jest.config.ts` (creado)
- `apps/web/jest.setup.ts` (creado)
- `apps/web/src/components/ui/Portal/Portal.test.tsx` (creado)
- `historial-cambios/2026-11-18-fase4-infra-tests-web.md` (creado)

## Pruebas / verificación

- `npm test -- --runInBand` en `apps/web`: **1 suite, 1 test**, exit 0.
- `npx tsc --noEmit` en `apps/web`: exit 0.
- `git diff --check`: **sin errores después de la corrección**. El primer
  commit marcó trailing whitespace en las líneas nuevas del lockfile: el
  archivo ya era CRLF en el repo (5298 líneas) y git cuenta el `\r` como
  whitespace final. Se añadió `.gitattributes` con
  `package-lock.json whitespace=cr-at-eol` (afirma el CRLF preexistente, no
  lo cambia); verificado con `git diff --check HEAD~1 HEAD`: exit 0. El
  crecimiento del lockfile (415→740 entradas, +325) es real: lo traen Jest,
  jsdom, RTL y sus transitivas.
- Nota: `npm install -D ... -w web` falló con un error interno de Arborist
  (`Cannot read properties of null (reading 'location')` en `diffTrees`). Se
  resolvió con `npm install ... --package-lock-only` y luego
  `npm install --ignore-scripts`; el lockfile quedó coherente.

## Pendientes y riesgos

- La instalación se hizo con `--ignore-scripts` en local; CI hará `npm ci`
  normal. Si algún paquete requiere script de instalación, se verá en el primer
  run del job `web`.
- Faltan los bloques 2 (arreglos + tests) y 3 (override acotado + gate).
