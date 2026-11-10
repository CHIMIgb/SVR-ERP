# Ajuste — KPIs de /criba con spinner en los números (cards de material)

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Cambios realizados
Las tarjetas "Criba fina / Criba gruesa / Arena lavada" de /criba son cards
custom inline (no StatsCard) y mostraban números reales sin estado de carga
("497", "440", "57", "Efic. 89%"). Con el estándar del usuario:
- Labels reales desde el primer render: nombre del material + "PRODUCIDO /
  AL BANCO / MERMA", mosaico "Merma del material".
- Spinner solo en los números: cada métrica infantil muestra
  `Loader2 w-5 animate-spin` (con el color del dato final) mientras
  `initialLoading`; el badge "Efic." muestra su giro neutrality.
- El strip de merma también con girador en su valor.
- Import de `Loader2` devuelto a la página (lo había quitado el pase F2).

## Verificación
- `npx tsc --noEmit`: 0 errores. Lint: solo el error preexistente de
  setState-in-effect (deuda general).
