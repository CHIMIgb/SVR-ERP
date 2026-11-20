# PINs de DEV para los técnicos de torre (TEC-008/009/010) — vía API

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** pedido del usuario — «crear usuarios técnicos de cada torre para la PWA y agregarlos a credenciales-dev.md»

## Cambios realizados
- **PINs creados vía la API** (mismo flujo: `pin/reinicio` con admin →
  `login-pin` con temporal → `pin/cambio` al permanente) para los técnicos
  de las torres faltantes:
  - `TEC-008` (Soldador, `soldador@`) → `Sold26Pm`
  - `TEC-009` (Diesel, `diesel@`) → `Dies26Pt`
  - `TEC-010` (Mantenimiento, `mantenimiento@`) → `Mant26Ps`
  PINs validados contra las reglas de `pin.validator.ts` (8 alfanuméricos,
  sin repetidos, sin secuencias, sin contener el número de empleado).
- **Verificado en BD:** los 3 con `pin_hash` presente y
  `pin_temporal_hasta` NULL (permanentes). La verificación por login-pin
  dio 429 (rate limit 5/15 min — el alta gastó 3 de las 5); el estado de BD
  confirma el resultado.
- **`credenciales-dev.md` actualizado:** la tabla PWA ahora tiene las 8
  cuentas (una por rol + los 4 técnicos por torre), cada técnico con su
  torre anotada, y las notas corregidas (filtro por torre del server
  verificado por API; ya no dice «sin PIN dev» para los técnicos).

## Archivos tocados
- `credenciales-dev.md` (local, NO versionado — gitignored)
- `historial-cambios/2026-11-20-pines-tecnicos-torre.md` (creado)

## Verificación / pruebas
- Alta por API: 3/3 OK (reinicio → login temporal → cambio).
- BD: 3/3 `pin_hash` + `pin_temporal_hasta` NULL.
- La verificación por login-pin quedó en 429 por el rate limit — reintentar
  después de 15 min si se quiere el OK explícito (los PINs ya están fijados).

## Pendientes y riesgos
- El script del alta está en `C:\Users\chimi\AppData\Local\Temp\opencode\crear-pines-tecnicos.cjs`
  (temporal de esta máquina).
- Sin push: solo el registro queda commiteado (credenciales-dev.md es local).
