# PWA base — paso 2: ciclo completo de PIN (endpoints + validador + tests)

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base` (paso 2 del §8.6)

## Cambios realizados

Nueva sub-carpeta `apps/api/src/auth/pin/` con el ciclo completo del PIN
(spec §6.4-6.8), reutilizando la maquinaria existente (regla 12 de AGENTS.md):
solo lo que no existe se construyó.

### 1. `pin.validator.ts` (puro, testado)
- `normalizarPin()` — trim + MAYÚSCULAS (case-insensitive por spec; se
  normaliza ANTES de evaluar y hashear).
- `validarPinNuevo()` — todas las reglas §8.3: 8 alfanuméricos (`PIN_FORMATO`),
  ≥1 letra y 1 número (`PIN_DEBIL`), sin 3+ repetidos (`PIN_SECUENCIA`), sin
  secuencias asc/desc (`PIN_SECUENCIA`), sin contener el número de empleado
  (`PIN_CONTIENE_EMPLEADO`), distinto de los últimos 3 vía bcrypt
  (`PIN_REPETIDO`).
- `generarPinTemporal()` — 24 h, sin caracteres confusos (0/O, 1/l/I),
  garantizando letra+número y sin repeticiones/secuencias.

### 2. `pin.service.ts` — los 5 operaciones con auditoría real
- **`loginPin`** — número+PIN → sesión + tokens vía **`crearSesionYTokens`**
  (método EXTRAÍDO de AuthService.login para que email-login y pin-login usen
  UNA sola copia de la lógica crítica — regla 12). Bloqueo por CUENTA a los
  5 intentos (`intentos_pin`/`cuenta_bloqueada_en`), temporal expirado →
  `PIN_TEMPORAL_EXPIRADO`, usuario inexistente → `CREDENCIALES_INVALIDAS`
  (mismo mensaje que PIN incorrecto, anti-enumeración). Devuelve `pinEstado`
  (aviso 25 días / obligar cambio).
- **`cambiarPin`** — reautentica con el actual, valida el nuevo, guarda el
  hash viejo en `pin_historial` (últimos 3), reinicia 30 días y **cierra las
  OTRAS sesiones** (revocando refresh_tokens en transacción — maquinaria
  sessions/refresh_tokens existente).
- **`reiniciarPin`** (mesa de ayuda) — temporal 24 h entregado UNA VEZ al
  ejecutante; cierra TODAS las sesiones del usuario; desbloquea.
- **`desbloquear`** (mesa de ayuda) — limpia bloqueo + intentos.
- **`estado`** — aviso 25 días, vencido, bloqueada, requiereCambio.
- Todos los FAILs van con `auditService.logFailure` (maneja el placeholder
  de entityId — bug evitado: el `log` directo crashea con entityId '' en
  PG por tipo uuid).

### 3. `pin.controller.ts` — las 5 rutas
- `POST /auth/login-pin` (skipAuth + Throttle 5/15min por IP)
- `POST /auth/pin/cambio` (JWT propio)
- `POST /auth/pin/reinicio` + `POST /auth/pin/desbloqueo` (JWT +
  `@RequirePermission('sistema','usuarios','editar')` — viven en el
  escritorio, la mesa de ayuda no tiene vista móvil)
- `GET /auth/pin/estado` (JWT propio)

### 4. Migración `20261111140000_pwa_pin_audit_actions`
3 acciones nuevas en el enum `AuditAction` (idempotente con FOREACH +
`pg_enum`): `PIN_CAMBIADO`, `PIN_REINICIADO`, `CUENTA_DESBLOQUEADA` (+ sus
severidades en `audit.constants.ts`).

### 5. Tests
- **Unit (25):** validator (cada regla + normalización + temporal) y service
  (éxito, cada FAIL auditado con su error_code, bloqueo, temporal, historial,
  cierre de sesiones).
- **Integration real (5):** login-pin exitoso con LOGIN_EXITOSO real;
  bloqueo por cuenta a los 5 con FAIL real + desbloqueo SUCCESS real;
  cambio que mata la sesión ajena y vive la propia; PIN repetido → FAIL
  real `PIN_REPETIDO`; reinicio con temporal 24h verificable (compare contra
  pin_hash) + todas las sesiones muertas.
- Fix de refactor seguro: `crearSesionYTokens` extraído de `login` — el
  login de email sigue pasando sus 21 tests sin cambios de comportamiento.

## Archivos tocados

- `apps/api/src/auth/pin/*` (nuevos: validator, service, controller, dto, specs)
- `apps/api/src/auth/auth.module.ts` (wiring)
- `apps/api/src/auth/auth.service.ts` (extracción `crearSesionYTokens`)
- `apps/api/src/audit/audit.constants.ts` (severidades)
- `apps/api/prisma/schema.prisma` + migración `20261111140000_pwa_pin_audit_actions`

## Pruebas / verificación

- Unit: pin **25/25** (validator 11 + service 14) · auth.service **21/21**
  (refactor sin regresión) · **tsc OK**.
- Integration: **5/5** contra BD real (con inserciones reales y
  registro_auditoria verificado SUCCESS/FAIL con error_code).

## Pendientes y riesgos

- Sin push (orden del usuario).
- Paso 3 (§8.6-3): login dual en la web (número+PIN vs email+password) +
  pantallas de cambio/aviso; y el alta de Trabajadores ampliada (número +
  PIN temporal + `wa.me`).
- El PIN temporal se entrega al ejecutante del reinicio (única vez en la
  respuesta) — el spec dice "nadie ve PINs existentes"; el temporal NUEVO
  sí se muestra una vez (equivale al del alta que se manda por WhatsApp).
