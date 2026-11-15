# 2026-11-13 — Helper compartido fechaEsPasada y su uso en el vencimiento de OCs

## Qué se hizo

- **`apps/web/src/lib/formatters.ts`** — helper compartido nuevo
  `fechaEsPasada(fecha)`: ¿la fecha (YYYY-MM-DD) es anterior a HOY en horario
  local? (usa `fechaLocalHoy`, evitando el desfase UTC de
  `toISOString().split('T')`).
- **`apps/web/src/app/(dashboard)/proveedores/page.tsx`** — los 4 puntos que
  comparaban con `new Date().toISOString()` ahora usan el helper:
  validación en "Nueva Orden", validación en la acción "Vencimiento", y el
  rojo de "vencida con saldo" en la tabla de órdenes y en el ledger.

## Verificación

- `npx tsc --noEmit` (web): limpio.
- `npx eslint` de los 2 archivos: sin hallazgos.

## Pendientes / riesgos

- Otros módulos que comparan fechas con `toISOString()` (p. ej. horarios del
  POS) no se tocaron: solo proveedores, que es donde se pidió.
