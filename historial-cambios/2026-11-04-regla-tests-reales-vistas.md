# Regla: tests reales obligatorios en vistas/edges de datos

**Fecha:** 2026-11-04
**Autor:** agente OpenCode (a petición del usuario)

## Cambios realizados
- Nueva regla dura en `AGENTS.md` y en `.opencode/agent/svr-erp.md`: toda vista
  nueva o modificación debe llevar además de los unitarios:
  1. Pruebas de unicidad — índices únicos rechazan duplicados y la carrera real no
     los crea (lógica en transacción).
  2. Pruebas de integración contra la BD real (PostgreSQL) insertando registros
     reales (NO mocks) — vía `npm run test:integration`.
  3. Tests específicos de `registro_auditoria`: inserción real de SUCCESS y FAIL
     (con `error_code`) en cada mutación del módulo, y verificación de que un
     DELETE contra `registro_auditoria` es rechazado por el trigger (inmutable).

## Archivos tocados
- `AGENTS.md` (modificado)
- `.opencode/agent/svr-erp.md` (modificado)

## Pruebas / verificación
- N/A (solo documentación).

## Pendientes y riesgos
- Ninguno.
