# Idempotencia del reporte: la key solo aplica a su dueño

**Fecha:** 2026-11-21
**Autor:** SVR-ERP Dev (agente)

## Cambios realizados
- Menor 6 de la segunda revisión del PR #23: `create()` de
  `reportes-campo` ahora compara `usuario_id` antes de devolver el
  original por `idempotenciaKey`. Si la key existe y pertenece a OTRO
  usuario, lanza `ConflictException` con error_code `IDEMPOTENCIA_AJENA`
  (audita FAIL con el patrón `fallir`) — antes devolvía el reporte ajeno,
  que filtra datos de otro usuario.
- Fix en los DOS puntos que devolvían el original: el pre-check
  (`findUnique` inicial) y la carrera P2002 (el que pierde busca al
  ganador — si el ganador es de otro usuario, también IDEMPOTENCIA_AJENA).

## Comportamiento de la cola PWA
Con 409 CONFLICT el item queda en estado `conflicto` (decisión humana en
EstadoCola), NO se reenvía solo. La key es un UUID v4 del teléfono, así
que el caso solo ocurre con keys contaminadas — defensa, no flujo normal.

## Archivos tocados
- apps/api/src/reportes-campo/reportes-campo.service.ts (modificado)
- apps/api/src/reportes-campo/reportes-campo.service.spec.ts (test viejo corregido + 2 nuevos)
- apps/api/src/reportes-campo/reportes-campo.integration.spec.ts (test nuevo BD real)

## Pruebas / verificación
- `npm run build` (apps/api): OK.
- `npx prisma validate`: schema válido (no tocó schema).
- `npm test -- --runInBand reportes-campo`: 3 suites, 117/117. El test
  viejo "reenvío con la misma idempotenciaKey" usaba user-2 con la key de
  user-1 esperando el original — codificaba el bug; ahora el reenvío del
  MISMO usuario devuelve el original y el de OTRO usuario lanza CONFLICT.
- `npm run test:integration -- --testPathPattern="reportes-campo"`:
  40/40, incluido el nuevo: key ajena → una sola fila (del dueño),
  ConflictException y FAIL real en `registro_auditoria` con
  `error_code: IDEMPOTENCIA_AJENA`.
- `git diff --check`: limpio.

## Pendientes y riesgos
- No se corrió la suite completa de la API (1417 tests) en local — solo
  el módulo tocado; CI la corre en PR.
- El reporte rechazado por key ajena queda en `conflicto` de la cola del
  teléfono que lo envió: el usuario ve "Conflicto" con Descartar/Reintentar.
