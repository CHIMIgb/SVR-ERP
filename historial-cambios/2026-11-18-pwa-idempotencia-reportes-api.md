# Idempotencia de la cola PWA en reportes_campo (API)

**Fecha:** 2026-11-18
**Autor:** agente

## Cambios realizados
- Se agregó `idempotencia_key String? @unique` al modelo `reportes_campo` con su migración `20261118020000_reportes_campo_idempotencia_key` (ALTER + CREATE UNIQUE INDEX), copiando el patrón ya usado por `ventas`.
- `CreateReporteCampoDto` acepta `idempotenciaKey?: string` validado como UUID opcional; el `ValidationPipe` con whitelist lo admite en el body.
- `ReportesCampoService.create`: si la key ya existe devuelve el reporte serializado sin generar folio, sin auditar un segundo SUCCESS y sin emitir otra notificación. La key se persiste en el `create`. Ante P2002 por carrera de dos reenvíos simultáneos, se busca al ganador por key y se devuelve; el reintento por colisión de folio `INC####` sigue como antes.
- Tests unitarios: DTO (acepta UUID / rechaza inválido), service (reenvío no crea ni cuenta folio, key persistida, P2002 por key devuelve al ganador).
- Tests de integración contra BD real: doble envío con la misma key → una sola fila y un solo `REPORTE_CREADO/SUCCESS`; inserción directa duplicada rechazada por el índice único. Limpieza FK-safe existente; `registro_auditoria` queda intacto.

## Cosas nuevas
- Columna e índice único `reportes_campo.idempotencia_key`.
- Contrato `idempotenciaKey` en el DTO de creación de reportes de campo.

## Archivos tocados
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20261118020000_reportes_campo_idempotencia_key/migration.sql`
- `apps/api/src/reportes-campo/dto/create-reporte-campo.dto.ts`
- `apps/api/src/reportes-campo/dto/create-reporte-campo.dto.spec.ts`
- `apps/api/src/reportes-campo/reportes-campo.service.ts`
- `apps/api/src/reportes-campo/reportes-campo.service.spec.ts`
- `apps/api/src/reportes-campo/reportes-campo.integration.spec.ts`
- `historial-cambios/2026-11-18-pwa-idempotencia-reportes-api.md` (creado)

## Verificación / pruebas
- `npx prisma migrate diff --from-config-datasource --to-schema=prisma/schema.prisma --script`: solo ALTER + CREATE INDEX esperados.
- Migración aplicada con `psql` y registrada con `npx prisma migrate resolve --applied ...`; `npx prisma migrate status`: 102 migraciones, base al día.
- `npx prisma generate`: cliente regenerado (v7.9.1).
- `npx prisma validate`: OK. `npm run build`: OK.
- `npm run test -- --runInBand --testPathPattern="reportes-campo"`: 3 suites, 108 tests, 0 fallos.
- `npm run test:integration -- --testPathPattern="reportes-campo"`: 1 suite, 35 tests, 0 fallos (35 con BD real, incluidos los 2 nuevos).

## Pendientes y riesgos
- `migrate dev` no puede ejecutarse en este repo: el historial está baselined y la primera migración (`seed_rbac`) falla en la shadow DB. La migración se generó con `migrate diff`, se aplicó con `psql` y se marcó con `migrate resolve`. En otro entorno hay que aplicar el mismo procedimiento; el dump de integración `svr_erp_sin_postgis.sql` habrá que regenerarlo para que incluya la columna nueva (no se hizo en este commit).
- La idempotencia quedó implementada solo en `reportes_campo`, primer destino previsto de la cola. Otros endpoints consumidos desde la PWA deberán declarar su propia key antes de conectarse.
- No se probó el reenvío real desde un teléfono: hoy ninguna vista llama a `encolar()`.
