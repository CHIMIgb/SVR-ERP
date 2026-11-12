# 2026-11-11 — Mediano review PR #18: cambiarPin cuenta los fallos del PIN actual

## Problema (review del PR #18, mediano)

`cambiarPin` no contaba los fallos de `pinActual`: el endpoint autenticado
quedaba como vía de fuerza bruta sin límite del PIN vigente.

## Cambios

- `pin.service.ts` / `cambiarPin`:
  - fallo de `pinActual` → **incremento atómico** de `intentos_pin`
    (update condicional `lt 5` + `increment`, mismo patrón del login-pin);
    al llegar a 5 → bloqueo **temporal** (15 min, `PIN_BLOQUEO_MINUTOS`).
  - cuenta bloqueada activa → rechaza el cambio ANTES de validar
    (`CUENTA_BLOQUEADA` audita FAIL). Si no, pin/cambio quedaba como vía de
    fuerza bruta incluso con la cuenta bloqueada.
  - éxito del cambio → limpia `cuenta_bloqueada_en` (ya lo hacía) — el
    bloqueo vencido o el cambio liberan.
  - mensajes: `'El PIN actual es incorrecto'` (+ aviso de bloqueo cuando
    aplica) — el test existente de substring sigue pasando.

## Verificación / pruebas

- `npx jest src/auth` → 106/106 — 2 tests nuevos: el fallo incrementa
  atómicamente (update condicional + increment) y el 5º bloquea con
  `cuenta_bloqueada_en`; cuenta bloqueada activa rechaza el cambio y audita
  `CUENTA_BLOQUEADA`.
- `npx tsc --noEmit` limpio.

## Pendientes / riesgos

- Integración no extendida para este caso (el mecanismo de bloqueo ya está
  cubierto en `pin.integration.spec` por login-pin); el conteo del cambio
  comparte la misma columna y el mismo guard de bloqueo temporal.
- El usuario bloqueado que debía cambiar su PIN espera la ventana (15 min)
  o mesa de ayuda — coherente con la regla del login.
