# Fix — efect TypeError: Invalid hook call en /ventas/corte

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Diagnóstico (error del usuario al entrar a /ventas/corte)
Mi insert del fetch de `ventasApi.hoy()` quedó **ANIDADO dentro del primer
useEffect** (el splicear del paso anterior colocó el nuevo blocke ANTES del
`}, []);` del effect de configuración) → React ve un `useEffect` dentro de un
callback → "Invalid hook call. Hooks can only be called inside of the body of
a function component" en `(50:12) @ useEffect`.

## Corrección
Reescrito el bloque de código: dos `useEffect` independientes al nivel del
componente (uno para config/ventana con su `setCargandoConfig(false)` en
finally, otro para la ventas del día con su `setCargandoVentas(false)` en
finally). No más estructura anidada.

## Verificación
- `npx tsc --noEmit`: 0 errores.
- ESLint /ventas/corte: 0 avisos nuevos (unused-imports etc. limpios).
