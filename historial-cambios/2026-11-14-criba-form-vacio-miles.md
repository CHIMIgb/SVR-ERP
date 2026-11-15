# 2026-11-14 — /criba: alta y edición con selects vacíos, sin fecha y números con comas

## Qué se hizo (aplicado a AMBOS modales, crear y editar)

- **El input Fecha se elimina**: la fecha se registra sola — `hoy` al crear
  (`fechaLocalHoy()`); en edición conserva la original sin poder cambiarla
  (mismo criterio que cotizaciones).
- **Turno y Operador comparten una fila** de 2 columnas (Operador pierde su
  ancho completo).
- **Selects que cargan vacíos**: Turno abre en "Seleccionar turno..." (ya no
  precarga Matutino) y Material en "Seleccionar material..." (ya no precarga
  "Criba fina"). La validación los exige al guardar.
- **Horas trabajadas / Material producido / Material al banco** pasan a
  `type="text"` con separador de miles automático (`formatearMiles`).
- **Validación nueva en `lib/formatters.ts`**: `esDecimalValido(valor, min,
  max?)` — parsea con `parsearMiles` (acepta comas) y valida rango. El
  formulario la usa: horas 0.1–24, producido ≥ 0.01, al banco ≥ 0 y
  ≤ producido. Turno y material también exigidos.

## Verificación

- `npx tsc --noEmit` (web): limpio.
- Verificación por conteo: 0 inputs Fecha, 2 selects con opción vacía (turno
  y material en ambos modales), 0 `type="number"`, 7 usos de `formatearMiles`.
- `npx eslint` del archivo: solo el error preexistente de
  `set-state-in-effect`.

## Pendientes / riesgos

- Smoke visual pendiente (sin navegador).
- Los selects vacíos cambian el alta: ahora exige elegir turno y material
  explícitamente (antes venían precargados por accidente).
