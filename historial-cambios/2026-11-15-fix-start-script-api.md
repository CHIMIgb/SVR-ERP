# Fix del script de arranque de la API (dist/src/main.js)

**Fecha:** 2026-11-15
**Autor:** Agente (autorizado por el usuario; segunda de las 2 líneas bloqueantes para el despliegue en Railway)

## Cambio

`apps/api/package.json`: `"start"` y `"start:prod"` apuntaban a `node dist/main`, pero el
output real de `nest build` (verificado en el dist local) es **`dist/src/main.js`** — el
arranque en producción fallaría con "Cannot find module". Ahora ambos scripts usan
`node dist/src/main.js`.

## Verificación

- Smoke de arranque real con el script corregido: `node dist/src/main.js` (PORT=3101) →
  boot completo de Nest ✓ (proceso detenido después del smoke).
- `npm run build` ✓ · `npx tsc --noEmit` ✓ · unitarias 1415/1417 (2 fallas preexistentes
  de cobranza, sin relación).
- Nota: gotcha ya documentado del repo ("ojo: dist/, no dist/main.js") — el script era el
  último rastro del layout equivocado.

## Pendientes / riesgos

- Ninguno conocido: es la ruta que el build lleva generando realmente. En Railway el Start
  Command puede quedar como `npm run start` ahora sí, o `node dist/src/main.js` directo.
