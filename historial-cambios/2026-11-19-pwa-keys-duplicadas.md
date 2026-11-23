# Keys duplicadas en la lista de /m/reportes (carrera de «Cargar más»)

**Fecha:** 2026-11-19
**Autor:** agente
**Reporte:** consola del teléfono — «Encountered two children with the same key» al aceptar un reporte y al cargar más reportes.

## Cambios realizados
- **Causa raíz:** `recargar(pagina + 1, false)` podía ejecutarse dos veces
  con el mismo `pagina` stale. El botón se deshabilita con `refrescando`,
  pero el `finally` de CUALQUIER otra recarga (ej. aceptar un reporte
  dispara `recargar(1, true)`) re-habilitaba «Cargar más» mientras el
  primer append seguía en vuelo → la misma página se agregaba dos veces →
  `key={r.id}` duplicada.
- **Arreglo (en la causa, no el síntoma):** `recargar` ahora hace **dedupe
  por id al agregar** — los items que ya están en la lista no se vuelven a
  meter, sea cual sea la carrera. Un reemplazo (`reemplazar=true`) sigue
  pisando la lista completa.
- No se tocaron el botón ni el sincronizador: el dedupe cubre todas las
  carreras posibles (doble tap, online + load-more, encolar + load-more).

## Archivos tocados
- `apps/web/src/app/(pwa)/m/reportes/page.tsx` (dedupe en `recargar`)
- `historial-cambios/2026-11-19-pwa-keys-duplicadas.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores. `npm run lint`: 0 errores, 37 warnings preexistentes.
- `git diff --check`: sin errores.
- **Smoke pendiente en el teléfono:** aceptar un reporte y «Cargar más» sin el error de consola; la lista sin cards repetidas.

## Pendientes y riesgos
- Si dos páginas se cruzan de orden (append de pág. 3 llega antes que el replace de pág. 1), el replace borra lo appendado: el usuario re-tira la lista — no hay pérdida de datos, solo un refetch.
- Sin push: el commit queda local.
