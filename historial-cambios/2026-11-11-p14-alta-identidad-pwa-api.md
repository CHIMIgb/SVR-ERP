# P14 — Alta ampliada con identidad PWA (backend)

**Fecha:** 2026-11-11
**Autor:** agente SVR-ERP (GLM-5.3-Flash)

## Cambios realizados
- `POST /trabajadores` ahora SIEMPRE crea la identidad de acceso a la app (spec §6.6-1):
  dentro de la MISMA transacción del trabajador crea `personas` + `users` + `users_roles`
  con `numero_empleado` consecutivo por rol, PIN temporal de 24 h (bcrypt, reuso de
  `generarPinTemporal()` de `auth/pin/pin.validator.ts`) y `jefe_user_id` = encargado.
- Consecutivo `ADM/RES/TEC/COB/TRA-NNN` (prefijo por rol §6.4, fallback = 3 primeras letras
  sin acentos). Anti-carrera: `@@unique([numero_empleado])` + reintento transaccional (3
  intentos) ante P2002; si agota, `NUMERO_EMPLEADO_DUPLICADO` (409) auditado.
- Email técnico derivado del número (`tra-142@pwa.svr-constructora.com`) con
  `password_hash` placeholder inutilizable: el login es numero_empleado + PIN.
- Validaciones nuevas con `fallir()` (FAIL + errorCode): `ROL_INVALIDO`, `ENCARGADO_INVALIDO`.
- Respuesta del alta ampliada con `identidad: { numeroEmpleado, pinTemporal, temporalHasta }` —
  el PIN en claro se entrega UNA vez y NUNCA va a la auditoría (§8.9).
- `GET /trabajadores/catalogos` ahora también devuelve `residentes` (users con rol Residente)
  y `roles` activos para los selects del alta (con tope, como los demás catálogos).

## Cosas nuevas
- `IdentidadAltaResponse` (service export) / `rolId` + `encargadoId` en `CreateTrabajadorDto`.
- Helpers `prefijoDeRol()` y bloque de identidad en `create()`.

## Archivos tocados
- `apps/api/src/trabajadores/dto/create-trabajador.dto.ts` (modificado)
- `apps/api/src/trabajadores/trabajadores.service.ts` (modificado)
- `apps/api/src/trabajadores/trabajadores.service.spec.ts` (modificado: mocks + 4 tests P14)
- `apps/api/src/trabajadores/dto/trabajadores.dto.spec.ts` (modificado: rolId en base + test)
- `apps/api/src/trabajadores/trabajadores.integration.spec.ts` (modificado: rol/residente de
  prueba, 5 tests P14 contra BD real, limpieza FK-safe por prefijo ZZR-)

## Pruebas / verificación
- `npx tsc --noEmit` (apps/api) ✓
- `npm run test` → trabajadores: 84/84 ✓ (suite completa: 1288/1290; los 2 fallos de
  `cobranza.service.spec.ts` son preexistentes por fecha del fixture 2026-10-01 → hoy
  41 días de atraso; módulo de otro dev, sin tocar)
- `npm run test:integration -- --testPathPattern="trabajadores"` → 16/16 ✓
  (incluye: inserción real de persona+user+users_roles, PIN temporal ~24 h, carrera de
  dos altas en paralelo con números distintos, auditoría SUCCESS/FAIL con error_code,
  y que el newValue de auditoría NO contiene el PIN en claro)

## Pendientes y riesgos
- El mapeo rol→prefijo depende de los nombres reales de rol en `roles` (Residente,
  Técnico, Cobranza…); un rol con nombre imprevisto usa las 3 primeras letras.
- Trabajadores YA existentes no reciben identidad (decisión de alcance: P14 = solo alta).
- El listado de trabajadores aún no muestra el numero_empleado (no pedido en P14).
