# Regla de paginación obligatoria para todo listado (AGENTS.md + agente)

**Fecha:** 2026-11-04
**Autor:** agente OpenCode (a petición del usuario)

## Cambios realizados
- Nueva regla dura registrada en el proyecto (para los 2 desarrolladores, para que
  el estándar no dependa de quién toque el código):
  - `AGENTS.md` → regla crítica "**TODA consulta listado paginada**": ningún
    endpoint de listado puede `findMany` sin `take`/`skip`; patrón `?page=&limit=`,
    default 10 / techo 100, respuesta `{ items, pagination }`; exentos: catálogos
    de selects, sub-consultas hijas del padre, operaciones de negocio en transacción;
    los listados "del día" usan `take` + orden desc.
  - `.opencode/agent/svr-erp.md` → la misma regla en Estándares obligatorios,
    con la lista de deuda conocida (19 endpoints sin paginar detectados por la
    auditoría 2026-11-04) para corregirla conforme se toque cada módulo.
- El script auditor queda en el versión repo para ejecutar la revisona:
  `apps/api/scripts/audit-pagination.cjs` → `node scripts/audit-pagination.cjs`
  (desde apps/api) lista to review `findMany` sin `take`.

## Contexto
- Auditoría del mismo día: 85 `findMany` en los services; 56 sin límite, de los
  cuales **19 son endpoints de listado** que traen TODO (horometro, checklists,
  despachos, transacciones/finanzas, conciliación, cobranza global, nominas por
  periodo, estados de cuenta proveedores, máquinas/bitácoras/mantenimiento).
- Con la BD chica no satura HOY, pero horometro/checklists/despachos/transacciones
  crecen diariamente — la regla manda corregir conforme se toque cada módulo.

## Archivos tocados
- `AGENTS.md` (regla añadida)
- `.opencode/agent/svr-erp.md` (regla añadida)
- `apps/api/scripts/audit-pagination.cjs` (revisator je, dejado en el repo)

## Pruebas / verificación
- N/A (documentación + script de lectura).

## Pendientes y riesgos
- Los 19 endpoints siguen abiertos; la regla exige paginado para CORREOS NUEVOS
  y fixes ya tocados; el resto debe corregirlos conforme se toque cada módulo.
