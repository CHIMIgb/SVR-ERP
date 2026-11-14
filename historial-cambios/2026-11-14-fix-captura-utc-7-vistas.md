# 2026-11-14 — Fix: captura de "hoy" por UTC en 7 vistas (bug del 12-nov 11 p.m.)

## Qué se hizo

Las **7 tomas de fecha por UTC** que quedaban en el web (el culpable del bug
reportado: registrando a las 11 p.m. del 12-nov se guardaba/mostraba el
13-nov) ahora usan `fechaLocalHoy()` (zona del .env):

- **`clientes/page.tsx`** — `emptyCotizacionForm.fecha` (cotización rápida).
- **`cotizaciones/page.tsx`** — `emptyForm.fecha`.
- **`cobranza/page.tsx`** — `hoyISO` (constante de módulo; vencimientos de hoy).
- **`ventas/page.tsx`** — `hoyIso` (los retiros del día dejaban de contarse
  a partir de las 6 p.m. UTC).
- **`components/pos/CorteCaja.tsx`** — `hoyIso` (el arqueo contaba lo mismo:
  a partir de las 6 p.m. el "hoy" del filtro cambiaba de día).
- **`apps/web/src/lib/api.ts`** — 3 nombres de archivo CSV
  (finanzas/cobranza/facturas) con fecha local.

`horometro` y `maquinaria` conservan su `sumarDias` (aritmética de fecha
pura sobre un string — correcta, no conversión de zona).

## Verificación

- `npx tsc --noEmit` (web): limpio.
- Grep restante de `toISOString().split` en el web: solo `horometro`/
  `maquinaria` (sumarDias, correcto) y el texto de la regla en formatters.
- `npx eslint` de los archivos tocados: solo el error preexistente de
  `set-state-in-effect` donde aplicaba.

## Pendientes / riesgos

- Reiniciar el dev server para que Next lea el nuevo `NEXT_PUBLIC_TZ`.
- Quedan zonas de fecha por revisar en el API (display de fechas guardadas
  con `toISOString`): con `TZ` correcto en el proceso muestran la fecha
  correcta; se revisan módulo por módulo cuando se toquen.
