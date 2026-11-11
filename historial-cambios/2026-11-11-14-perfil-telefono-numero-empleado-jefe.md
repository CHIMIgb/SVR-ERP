# Perfil PWA — teléfono, número de empleado y jefe directo

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base`

## Cambios realizados (autorizados)

La vista de perfil PWA ahora muestra más información del empleado, con
datos que YA existían en la BD (solo no se devolvían):

1. **API (`apps/api/src/auth/auth.service.ts`)** — `USER_INCLUDE` agrega
   la auto-relación `jefe` (email + persona del jefe) y
   `buildUserProfile` ahora devuelve `numeroEmpleado`
   (`users.numero_empleado`), `persona.telefono` y
   `jefe: { nombre, email, telefono } | null`.
2. **Tipos duplicados del API (`src/auth/types/auth.types.ts`)** —
   `AuthResponse.user` extendido con `numeroEmpleado`, `jefe` y
   `persona.telefono` (el API importa SU copia, no la de `packages/shared`).
3. **Shared (`packages/shared/src/types/auth.ts`)** — `PersonaAuth`
   gana `correo`/`telefono` opcionales; `UserAuth` gana
   `numeroEmpleado` y `jefe: JefeAuth | null` (aditivo, escritorio intacto).
4. **Web (`m/perfil/page.tsx`)** — la tarjeta de información muestra:
   correo, **teléfono** (tappable `tel:`), **número de empleado**, área,
   roles y **jefe directo** (nombre + teléfono tappable). Los campos
   vacíos se ocultan (nullable en BD).

## Tests

- **Unit** (`auth.service.spec.ts`): 2 tests nuevos — perfil con
  telefono/numeroEmpleado/jefe completo y sin jefe → null. **23/23 ✅**.
- **Integration** (`auth.integration.spec.ts`, BD real): bloque
  «Perfil del empleado» — crea usuario JEFE real, asigna jefe_user_id +
  numero_empleado + telefono, verifica `getProfile` completo y limpia
  FK-safe (suelta jefe_user_id antes del soft-delete). **1/1 ✅**.

## Archivos tocados

- `apps/api/src/auth/auth.service.ts`
- `apps/api/src/auth/types/auth.types.ts`
- `apps/api/src/auth/auth.service.spec.ts`
- `apps/api/src/auth/auth.integration.spec.ts`
- `packages/shared/src/types/auth.ts`
- `apps/web/src/app/(pwa)/m/perfil/page.tsx`

## Verificación

- `tsc` web/api/shared ✅; eslint ✅; jest unit 23/23 ✅;
  `test:integration` (perfil) 1/1 ✅.

## Pendientes y riesgos

- Sin push (orden del usuario).
- No se agregaron RFC/CURP/fecha de nacimiento (el usuario no los pidió
  explícitamente — están disponibles si se quieren después).
- El usuario admin de demo quizá no tenga jefe/numero_empleado — los
  campos se ocultan hasta que se asignen en BD.
- El endpoint es GET de perfil: sin mutación → no requiere audit FAIL.
