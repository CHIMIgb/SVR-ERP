# 2026-11-11 — Mediano review PR #18: crypto.randomInt en generarPinTemporal

## Problema (review del PR #18, mediano)

`generarPinTemporal` (pin.validator.ts) usaba `Math.random()` — no
criptográficamente seguro — para fabricar el PIN temporal de 24 h que da
acceso a la cuenta.

## Cambios

- `pin.validator.ts` — `randomInt(0, alfabeto.length)` de `node:crypto`
  en lugar de `Math.floor(Math.random() * ...)`. Import de `node:crypto`.

## Verificación / pruebas

- `npx jest src/auth/pin/pin.validator.spec.ts` → 11/11 (formato, sin
  confusos, letra+número, sin repeticiones ni secuencias — las reglas ya
  probadas pasan con el nuevo generador).

## Pendientes / riesgos

- Ninguno funcional: mismo alfabeto y mismas reglas; solo cambia la fuente
  de aleatoriedad.

## Nota de análisis — `logFailure` vs `fallir()` (otro mediano, SIN cambio)

Verificado contra `audit.service.ts:127`: `logFailure()` es un shortcut
OFICIAL del propio `AuditService` que delega en `this.log()` con
`result: 'FAIL'` + severity — produce el mismo registro inmutable con
`error_code`. Los helpers de `pin.service` (`fallirLogin`, `fallirCambio`,
`fallirAdmin`, `fallirJerarquia`) son el patrón `fallir()` del repo usando
ese shortcut: auditan FAIL + errorCode ANTES de lanzar. Se da por cumplido
sin churn cosmético.
