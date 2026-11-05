# Registro complementario de GPS y responsividad + ajustes de la revisión del PR #13

**Fecha:** 2026-11-05
**Autor:** P4chec0php

## Cambios realizados

### Registro de commits anteriores a la regla de `historial-cambios/` (sin reescribir historia)
- `7235b7c` — **feat(gps): módulo completo de rastreo GPS con geocercas reales** (2026-09-13).
  - API (`apps/api/src/gps/`): CRUD de geocercas validado contra el CHECK de tipo de la tabla
    (OBRA/PATIO/ESTACION/RUTA/PROHIBIDA), nombre único y soft-delete que limpia los cruces; rastreo en vivo
    (última posición por máquina en un solo query, estado derivado del ping y geocercas en las que está);
    historial del día (recorrido + entradas/salidas de geocerca); simulación de posiciones mientras no haya
    API del proveedor (cuando llegue, su feed se conecta a `procesarGeocercas()`).
  - RBAC: lecturas con `maquinaria.gps.ver`, mutaciones con `maquinaria.gps.editar`; auditoría de éxitos y
    de fallos de negocio con `error_code`.
  - Migración `20260925000000_gps_geocercas_auditoria`: 6 valores nuevos de `AuditAction` y la columna
    nullable `rastreo_gps.temperatura_motor`.
  - Web: la vista `/gps` dejó de ser mock y usa los componentes `GpsTracking` con datos reales.
- `3abc3cb` — **fix(gps): responsividad de la vista de rastreo** (2026-09-23): los botones del encabezado
  envuelven en pantalla chica y el mapa deja de tener alto fijo.
- `042a75c` — **fix(web): responsividad en celular de las vistas de flota y RRHH** (2026-09-23).

### Ajustes de la revisión del PR #13 (sugerencias no bloqueantes)
- `GpsService.findHistorialMaquina`: la consulta de cruces de geocerca ahora tiene tope (`take: 200`, orden
  estable por geocerca), igual que el resto de los listados.
- `gps.integration.spec.ts`: prueba nueva de que el trigger de `registro_auditoria` rechaza el DELETE y el
  UPDATE, y que el registro queda intacto.

## Cosas nuevas
- Constante `LIMITE_CRUCES_HISTORIAL` en `gps.service.ts`.

## Archivos tocados
- `apps/api/src/gps/gps.service.ts` (modificado)
- `apps/api/src/gps/gps.integration.spec.ts` (modificado)

## Pruebas / verificación
- `npx tsc --noEmit` en `apps/api`: sin errores.
- `npx jest src/gps`: 54 de 54.
- `npm run test:integration -- --testPathPattern="gps"`: 12 de 12 (incluye la del trigger inmutable).

## Pendientes y riesgos
- Ninguno nuevo.
