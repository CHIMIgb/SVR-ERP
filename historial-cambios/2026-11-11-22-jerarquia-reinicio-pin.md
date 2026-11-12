# 2026-11-11 — Fix review PR #18 #5: jerarquía en reinicio y desbloqueo de PIN

## Problema (review del PR #18, bloqueante 5)

`pin/reinicio` y `pin/desbloqueo` solo pedían `sistema.usuarios.editar`, y
`reiniciarPin` devuelve el temporal **en claro**: un usuario con ese permiso
(RRHH, por ejemplo) reiniciaba el PIN del Administrador, recibía el temporal
y entraba con acceso total.

## Cambios

- **`apps/api/src/auth/pin/pin.service.ts`**:
  - helper `esAdministrador(userId)`: roles activos del usuario → rol
    `Administrador` (users_roles + roles por nombre).
  - helper `fallirJerarquia(action, targetId, actorId, ip, ua)`: audit
    **FAIL `JERARQUIA_INSUFICIENTE`** + `ForbiddenException` (403) "Solo otro
    Administrador puede reiniciar o desbloquear la cuenta de un
    Administrador".
  - `reiniciarPin` y `desbloquear`: tras validar que el objetivo existe/está
    activo y **antes** de tocar nada → si el objetivo es Administrador y el
    ejecutante no → rechazo auditado. El temporal nunca se genera.
- **Plan §0.2 (Vista B)**: línea documentando la regla de jerarquía junto al
  escenario del PIN vencido (commit anterior del plan).
- Sin cambios de front (`pinReinicio`/`pinDesbloqueo` aún no están expuestos
  en `authApi` — la vista P12 es el que los consumirá y verá el 403 con
  `mensajeErrorApi`).

## Verificación / pruebas

- Unit: 20/20 (`pin.service.spec.ts`) — 3 tests nuevos: no-admin →
  reinicio de admin rechazado 403 + FAIL sin mutar PIN ni sesiones;
  admin → reinicia a admin OK (SUCCESS); no-admin → desbloqueo de admin
  rechazado 403 + FAIL sin mutar.
- Integración BD real: 8/8 (`pin.integration.spec.ts`) — test nuevo "7":
  el user de prueba (sin rol) intenta reiniciar el PIN del admin seed →
  Forbidden + FAIL real en `registro_auditoria` con `error_code`
  `JERARQUIA_INSUFICIENTE` y `actor_user_id` correcto. El fallo no muta
  nada — el admin real queda intacto.
- `npx tsc --noEmit` limpio.

## Pendientes / riesgos

- La regla es binaria (Administrador vs resto) — la que pide la review. Si
  mañana se quieren más niveles (nivel del rol), se cambia en
  `esAdministrador`/el helper (un solo lugar).
- El mensaje 403 es distinto al de "usuario no encontrado": un atacante con
  el permiso puede confirmar que un userId existe si obtiene 403 de
  jerarquía — aceptable (ya está autenticado y con permiso de gestión).
- No verificado en UI: los endpoints aún no tienen vista que los consuma.
