# Fase 4 (bloque 2): arreglos reales de los 10 errores locales de lint

**Fecha:** 2026-11-18
**Autor:** Agente (Fase 4 autorizada con "excepción acotada + arreglos reales")

## Contexto

Tras la infra de tests (bloque 1), el lint del web daba 21 errores. Este bloque
corrige los 10 que no son carga inicial de datos, con tests que cubren los
refactors. Los 11 restantes (`set-state-in-effect` por fetch al montar) se
tratan en el bloque 3.

## Cambios realizados

- `Portal.tsx`: se eliminó el `useState(false)` + `useEffect(setMounted)`;
  ahora usa `useSyncExternalStore` con snapshot de servidor `false` y de
  cliente `true` (mismo patrón que `ThemeProvider`). Evita el render
  intermitente y la hidratación divergente sin llamar a `setState` en un
  effect.
- `Toast.tsx`: `startTime` pasa de `useRef(Date.now())` (llamada impura en
  render) a `useRef(0)`; el bucle `requestAnimationFrame` y la fecha inicial
  se movieron de un `useState(() => ...)` —que guardaba el cleanup como
  estado y nunca lo ejecutaba— a un `useEffect` con cleanup real. El bucle se
  guarda en `tickRef` para no autocapturar la callback declarada con
  `useCallback`.
- `Tooltip.tsx`: el id del tooltip pasa de `useRef(Math.random())` a
  `useId()` (puro y estable entre servidor y cliente); se quitaron los dos
  accesos a `.current` durante el render.
- `CorteCaja.tsx`: el estado `cierreHoyData` se declaró antes del `useEffect`
  que lo usa; antes estaba 44 líneas más abajo.
- `configuración/page.tsx`: se escaparon las comillas de "Fuera de horario"
  con `&quot;` (2 errores de `react/no-unescaped-entities`).
- Tests nuevos: `Toast.test.tsx` (muestra el mensaje y lo cierra) y
  `Tooltip.test.tsx` (asociación `aria-describedby` e ids únicos entre dos
  tooltips, y ocultamiento al salir). El test de `Portal` del bloque 1 sigue
  pasando y cubre su refactor.

## Cosas nuevas

- 2 suites de test frontend (total del repo: 3 suites, 4 tests).

## Archivos tocados

- `apps/web/src/components/ui/Portal/Portal.tsx` (modificado)
- `apps/web/src/components/layout/Toast.tsx` (modificado)
- `apps/web/src/components/layout/Toast.test.tsx` (creado)
- `apps/web/src/components/ui/Tooltip/Tooltip.tsx` (modificado)
- `apps/web/src/components/ui/Tooltip/Tooltip.test.tsx` (creado)
- `apps/web/src/components/pos/CorteCaja.tsx` (modificado)
- `apps/web/src/app/(dashboard)/configuracion/page.tsx` (modificado)
- `historial-cambios/2026-11-18-fase4-arreglos-locales.md` (creado)

## Pruebas / verificación

- `npm test -- --runInBand` en `apps/web`: **3 suites, 4 tests**, exit 0.
- `npx tsc --noEmit` en `apps/web`: exit 0.
- `npm run lint` en `apps/web`: **11 errores** (antes 21); los 11 son
  `react-hooks/set-state-in-effect` en las páginas listadas para el bloque 3.
  Quedan 37 warnings preexistentes (no bloquean `eslint`).

## Pendientes y riesgos

- Bloque 3: override acotado de la regla en esas 11 páginas, activar `lint`
  en el job `web` de `ci.yml` y actualizar documentación.
- El cambio de `Toast` corrige además un bug real: el cleanup del progreso
  nunca se ejecutaba porque vivía en el valor de un `useState`.
- No se hicieron pruebas visuales de la barra de progreso ni del tooltip en
  el navegador; la verificación es jsdom + tipos + lint.
