# Ajuste — spinners de /criba en color único global (text-primary)

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Cambios realizados
En /criba (cards de material Criba fina / Criba gruesa / Arena lavada), los
spinners de carga estaban coloreados con el color del dato (Producido naranja,
Al banco verde, Merma amarillo; badge Efic. gris) — violaba la regla 2b. Ahora
TODOS van `Loader2 ... text-primary animate-spin` (naranja global); el color
propio solo aplica al valor ya cargado (doc AGENTS.md regla 2b).

## Verificación
- `npx tsc --noEmit`: 0 errores; ESLint: sin avisos nuevos (queda el
  setState-in-effect preexistente como deuda general).
