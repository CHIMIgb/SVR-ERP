# PINs de dev para la PWA creados vía API (número de empleado + PIN)

**Fecha:** 2026-11-19
**Autor:** agente

## Cambios realizados
- **Corrección de `credenciales-dev.md` (archivo local no versionado):** la
  sección PWA decía email+contraseña y estaba MAL — el login móvil es
  **número de empleado + PIN de 8 caracteres** (spec §6.4-6.5,
  `POST /auth/login-pin`). Ahora la tabla trae `ADM-01`/`RES-014`/`TEC-007`/
  `COB-003`/`TRA-0142` con su PIN dev y las pestañas `/m/*` de cada rol
  (verificadas en `role_vistas`).
- **PINs creados vía la API** (no SQL, según lo pedido), respetando el
  validador (`pin.validator.ts`: 8 alfanuméricos, sin caracteres repetidos,
  sin secuencias, sin contener el número de empleado):
  - `ADM-01` → `Admin26P` · `RES-014` → `Resi26Pz` · `TEC-007` → `Tecn26Pw`
  - `COB-003` → `Cobr26Px` · `TRA-0142` → `Trab26Pq`
- Flujo ejecutado por usuario contra `localhost:3001/api`:
  1. `POST /auth/login` con el admin (mesa de ayuda).
  2. `POST /auth/pin/reinicio {userId}` → PIN temporal 24 h.
  3. `POST /auth/login-pin {numeroEmpleado, pin: temporal}` → tokens (el
     presupuesto de login-pin: 5 llamadas = 5 usuarios, justo el límite).
  4. `POST /auth/pin/cambio {pinActual: temporal, pinNuevo: dev}` → permanente.
- **Verificado en BD:** los 5 tienen `pin_hash` presente y
  `pin_temporal_hasta` NULL (temporal anulado por el cambio). El script
  original está en `C:\Users\chimi\AppData\Local\Temp\opencode\crear-pines-dev.cjs`
  (temporal de esta máquina, no en el repo) — regenerable con el flujo
  descrito arriba.

## Verificación / pruebas
- Paso a paso por API: reinicio OK ×5, login-pin temporal OK ×5, cambio OK ×5.
- BD: 5/5 `pin_hash` con `pin_temporal_hasta` NULL.
- **Verificación end-to-end del login con los PINs finales corriendo en
  segundo plano** (el rate limit de `login-pin` es 5/15 min por IP: se
  reintentan 5 logins tras expirar la ventana); resultado se anota al llegar.

## Pendientes y riesgos
- Los técnicos de torre Soldador/Diesel/Mantenimiento (`TEC-008`–`TEC-010`)
  y `administrativo@` no tienen PIN dev (la PWA les queda vacía o no son
  login móvil prioritario); se crean igual si se necesitan.
- Si alguien prueba `login-pin` equivocándose 5 veces, la cuenta se bloquea
  (desbloqueo por mesa de ayuda en escritorio o `pin/desbloqueo`).
- Sin push: el commit (solo este registro) queda local.
