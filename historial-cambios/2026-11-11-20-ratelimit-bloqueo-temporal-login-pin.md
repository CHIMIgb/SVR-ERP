# 2026-11-11 — Fix review PR #18 #3: rate limit real, bloqueo temporal y contador atómico en login-pin

## Problema (review del PR #18, bloqueante 3 + 2 medianos del mismo bloque)

- El `@Throttle` de `login-pin` (y de `login`/`register`/`refresh` en
  `AuthController`) no hacía **nada**: no había `ThrottlerGuard` aplicado en
  ningún controller (el comentario de `app.module.ts` "solo en AuthController"
  era falso).
- `loginPin` no usaba el `BloqueoService` por IP del login normal.
- Tras 5 PINs malos la cuenta quedaba **bloqueada para siempre** (sin
  vencimiento): con números predecibles (`ADM-01`…) un atacante podía dejar
  sin acceso a toda la plantilla; el desbloqueo era manual.
- `intentos_pin` se leía, sumaba y escribía (no atómico): intentos paralelos
  podían saltarse el tope.
- "Cuenta bloqueada" y "Tu PIN temporal expiró" respondían antes de validar
  el PIN → enumeración de números existentes.

## Cambios

- **`pin.controller.ts`** — `@UseGuards(ThrottlerGuard)` en `login-pin`: el
  `@Throttle short 5/15min` ahora aplica de verdad (429 con
  `ThrottlerExceptionFilter`, ya registrado global).
- **`auth.controller.ts`** — mismo guard en las 3 rutas con `@Throttle` muerto:
  `login`, `register`, `refresh`.
- **`pin.service.ts`**:
  - inyecta `BloqueoService` + `IntentosLoginService` (ya estaban disponibles
    en `AuthModule`): IP bloqueada → rechazo igual que el login email;
    todo fallo registra en `intentos_login` y pasa por
    `registrarIntentoFallidoPorIP` (la maquinaria IP del login normal).
  - **bloqueo de cuenta TEMPORAL**: `PIN_BLOQUEO_MINUTOS` (default 15, env)
    — vencido se auto-desbloquea; el éxito limpia el bloqueo; `pin/desbloqueo`
    sigue adelantándolo a mano.
  - **contador atómico**: `users.update` con `where intentos_pin < 5` +
    `increment 1` (row lock de Postgres, devuelve el valor final; P2025 = ya
    al tope) — sin read-modify-write, el 5º intento bloquea de verdad.
  - **anti-enumeración**: inexistente/inactivo/sin PIN, cuenta bloqueada y
    temporal expirado responden el MISMO mensaje genérico; el detalle queda
    solo en los `errorCode` de auditoría (`CREDENCIALES_INVALIDAS`,
    `CUENTA_BLOQUEADA`, `PIN_TEMPORAL_EXPIRADO`, `IP_BLOCKED`).
  - `estado()`: `bloqueada` ahora respeta la ventana temporal.
- **`auth.controller.spec.ts`** — `ThrottlerModule.forRoot` importado en el
  TestingModule (el guard necesita resolución; en producción lo aporta
  AppModule y es `@Global()` en @nestjs/throttler 6.5.0).
- **`pin.service.spec.ts`** — mocks de Bloqueo/Intentos + assertions
  actualizadas al mensaje genérico + tests nuevos: bloqueo vencido permite
  entrar, IP bloqueada (IP_BLOCKED auditado), anti-enumeración (los 3 casos
  responden exactamente lo mismo), contador atómico (where lt 5 + increment).
- **`pin.integration.spec.ts`** — assertions al mensaje genérico + test nuevo
  "2b": bloqueo con `cuenta_bloqueada_en` vencido (16 min) → el PIN correcto
  vuelve a entrar y limpia el bloqueo (BD real).

## Verificación / pruebas

- Unit: `npx jest src/auth` → 94/94 (incluye pin.service.spec 17/17).
- Integración BD real: `npm run test:integration -- --testPathPattern="pin"` → 6/6.
- Suite completa: 1294/1296 — los 2 fallos son de `cobranza.service.spec.ts`
  y son **pre-existentes y decaimiento temporal** (fechas hardcodeadas del
  spec: vencimiento 2026-10-01, hoy 41 días de atraso → `ATRASO_GRAVE` en
  vez de `AL_CORRIENTE`); verificados con `git stash`: fallaban antes de
  este cambio. No tocados (módulo ajeno, fix aparte).
- **Smoke end-to-end del guard** (API en :3002 por `PORT`, el :3001 está
  ocupado por otro proceso): 5 requests a `login-pin` → 429 en el 6º y
  siguientes con `RATE_LIMIT_EXCEEDED` + `retryAfter` (el filtro global
  formatea). El guard está vivo.
- `npx tsc --noEmit` limpio.
- BD: sin efectos colaterales — los intentos del smoke no tocaron usuarios
  reales (número inexistente `ZZZZ-TEST`, nunca llegó al service);
  verificado que no hay bloqueos nuevos por IP/usuario (el bloqueo activo
  del admin es residuo del 4-nov, ventana ya vencida).

## Pendientes / riesgos

- `PORT=3002` se usó solo para el smoke: la API real sigue en 3001.
- Los intentos de humo dejaron filas de `intentos_login` de tests de
  integración (IPs falsas `10.98.x`) — inofensivas en dev.
- El rate limit por IP del Throttler es **por proceso** (memoria): si algún
  día hay varias instancias de API, cada una cuenta aparte (más generoso,
  no menos seguro — el bloqueo por IP de BD sí es compartido).
- `register` y `refresh` ahora tienen rate limit real: si en dev se hacen
  >5 logins/15 min desde la misma IP (los tests manuales del equipo), verán
  429 — subir el límite o esperar la ventana. No afecta a los specs (no
  montan el guard en e2e real).
- No verificado: flujo PWA completo tras un 429 (el front mostrará el error
  del contrato; el login normal no lo encuentra en producción normal).
