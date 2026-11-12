# 2026-11-11 — Fix review PR #18 #2: RRHH no puede dar de alta un Administrador

## Problema (review del PR #18, bloqueante 2)

`catalogos()` devolvía todos los roles activos (incluido Administrador) y el
alta solo validaba "existe y activo". Un usuario con solo
`rrhh.trabajadores.crear` podía mandar el `rolId` de Administrador, recibir
el `numero_empleado` y el **PIN temporal en claro** en la respuesta, y entrar
con acceso total.

## Cambios

- **`apps/api/src/trabajadores/trabajadores.service.ts`**
  - Constante nueva `ROLES_ASIGNABLES_WHERE`: roles activos, no eliminados y
    **sin permisos del módulo `sistema`** (`role_permissions: { none: {
    permissions: { modulo: 'sistema' } } }`). Data-driven: en la BD real hoy
    excluye exactamente a Administrador; si mañana se crea otro rol con
    permisos de sistema, también queda fuera. Sin nombres hardcodeados.
  - `catalogos()`: el listado de roles para el select del alta usa ese filtro.
  - `create()`: segunda validación tras la de rol válido — si el rol existe
    pero no es asignable → **403 `ForbiddenException`** con
    `fallir(TRABAJADOR_CREADO, 'ROL_NO_ASIGNABLE', FAIL + severity WARNING)`
    ANTES de crear nada. Import de `ForbiddenException`.
- **`trabajadores.service.spec.ts`** — 2 tests nuevos: rol con permisos de
  sistema rechazado con 403 (FAIL auditado, sin crear users/trabajador) y
  `catalogos` con el filtro asignable en el where de roles. Mock de
  `roles.findFirst` agregado (la validación nueva lo consume en cada alta).
- **`trabajadores.integration.spec.ts`** (BD real) — 2 tests nuevos: alta con
  el rol Administrador real → 403 + FAIL `ROL_NO_ASIGNABLE` en
  `registro_auditoria` + cero `users_roles` nuevos; y `catalogos` sin
  Administrador en `roles`.

## Verificación / pruebas

- Unit: `npx jest src/trabajadores/trabajadores.service.spec.ts` → 40/40.
- Integración (BD real): `npm run test:integration -- --testPathPattern="trabajadores"` → 17/17.
- `npx tsc --noEmit` limpio en `apps/api` y `apps/web`.

## Pendientes / riesgos

- La regla es conservadora: un rol futuro que pida permisos de `sistema`
  (p. ej. solo `documentos`) tampoco será asignable desde el alta — si eso
  pasa, se ajusta la regla en `ROLES_ASIGNABLES_WHERE` (un solo lugar).
- El front no cambió: el select del alta se llena con `catalogos.roles`
  (ya filtrado del servidor). Quien mande un `rolId` no asignable por la API
  ve el 403 con el mensaje "El rol seleccionado no puede asignarse desde el
  alta de trabajadores".
- No verificado: el flujo visual del modal en el navegador (smoke manual);
  el cambio es server-side y el catálogo ya venía consumiéndose igual.
