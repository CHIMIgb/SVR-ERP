# Bloque 3 review PR#17: ámbito en accesos directos (6 métodos) + FAIL auditado

**Fecha:** 2026-11-10
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

El filtro por árbol de /reportes se aplicaba SOLO en listar y stats;
findOne/aceptar/cambiarEstado/comentar/adjuntar/remove aceptaban el id de
cualquier reporte (el frontend bloqueaba, el API no). Fuga confirmada en
review.

1. **Helper `enAmbito()`** (service, sección HELPERS): resuelve el mismo árbol
   del listado — admin (nivel≥100) pasa; dueño y asignado pasan; residente
   solo si es reporte de SU equipo (jefe_user_id); tiles la torre de quien
   consulta debe coincidir con la categoría; sin torre, solo dueño.
2. **Guards en los 6 métodos** con `fallir()` → `ForbiddenException` y
   FAIL auditado con `error_code: 'REPORTE_ACCESO_DENEGADO'` ANTES de lanzar:
   - findOne (ahora recibe userId — el controller le pasa el del token)
   - aceptar (antes de la checada de estado/residente)
   - cambiarEstado (antes de transiciones)
   - comentar (antes del bloqueo CERRADO)
   - adjuntar (después del guard residente que ya existía)
   - remove (antes del soft-delete)
3. **Nueva acción de auditoría** `REPORTE_ACCESO_DENEGADO` (severity WARNING en
   ACTION_SEVERITY_MAP):
   - schema.prisma (enum AuditAction)
   - migración `20261110120000_audit_acceso_denegado` — `ALTER TYPE ...
     ADD VALUE IF NOT EXISTS` (idempotente); aplicada con `migrate deploy`
     (migrate dev no va: shadow DB sin baseline, limitación conocida del repo).
   - se usa como action del FAIL en findOne (GET) y como errorCode en los 6.
4. **Tests unitarios** (service spec, describe 'ámbito de acceso directo'):
   por cada método el camino DENEGADO (otra torre → ForbiddenException +
   FAIL auditado con el action/ errorCode) y el camino de ADMIN que WAHRT
   la torre; specs de dueño, asignado, residente-jefatura (jefe_user_id) y
   trabajador-sin-torre. El helper de mock de usuario incluye persona para
   datosDelReportador. `mockAudit.log.mockClear()` añadido al beforeEach
   (las llamadas acumuladas entre tests hacía fallar aserciones de vecinos).
5. **Tests de integración** (real DB, registro_auditoria real): técnico de
   otra torre → Forbidden en aceptar/findOne/remove; FAIL real insertado con
   result FAIL + error_code; el reporte NO recibe responsable y NO se elimina;
   residente accede al reporte de su trabajador (jefe_user_id real);
   admin pasa; trigger rechaza DELETE contra registro_auditoria (inmutable).

## Archivos tocados

- `apps/api/src/reportes-campo/reportes-campo.service.ts` (helper + 6 guards)
- `apps/api/src/reportes-campo/reportes-campo.controller.ts` (findOne + userId)
- `apps/api/prisma/schema.prisma` (enum AuditAction)
- `apps/api/prisma/migrations/20261110120000_audit_acceso_denegado/migration.sql` (nuevo)
- `apps/api/src/audit/audit.constants.ts` (severity map)
- specs: reportes-campo (service / controller / integration)

## Pruebas / verificación

- Unit reportes-campo: **84/84** (incluye el describe nuevo del ámbito).
- Integración real: **31/31** (26 previos + 5 nuevos del ámbito).
- Suite completa de la API: **1249/1251** — las 2 fallas son las de Cobranza
  dependientes de fecha que la review ya reportó idénticas en main (pre-
  existentes, NO regresión de este bloque).
- `tsc --noEmit` API OK.

## Pendientes y riesgos

- **Sin push (orden del usuario)**: el commit queda local; el PR #17 se
  actualiza cuando el usuario lo ordene.
- update (PATCH :id) no entra en el review scope (6 métodos) — ya tenía su
  guard de creador/admin pre-existente.
- La acción enum nueva requiere `migrate deploy` en el servidor con el PR
  (ADD VALUE a la enum de la DB) — cubierto por las migraciones del PR.
