# 2026-11-14 — B6.2: el backend de criba acepta máquina y proyecto

## Qué se hizo

- **DTOs** (`create`/`update`/`query` de registros criba): `maquinaId?` y
  `proyectoId?` (UUID opcionales); en query son filtros del listado.
- **`criba.service.ts`**:
  - `REGISTRO_INCLUDE` incluye `maquinas` y `proyectos` (nombre para la
    tabla/select).
  - `create`/`update` aceptan y persisten los FKs; en update `undefined` no
    toca y `null` limpia (mismo patrón que `operadorId`).
  - Validadores nuevos con audit FAIL antes de lanzar:
    `resolverMaquina` (`MAQUINA_NO_ENCONTRADA`) y `resolverProyecto`
    (`PROYECTO_NO_EN_PROCESO` — solo proyectos EN_PROCESO aceptan producción,
    mismo criterio que reportes/obras).
  - `findAll` filtra por `maquina_id`/`proyecto_id`.
  - `serialize` expone `maquinaId/maquina/proyectoId/proyecto`.

## Verificación

- `npx tsc --noEmit` (api): limpio.
- Unit `src/criba`: **39/39** (nuevos: FKs guardados y expuestos, máquina
  inexistente audit FAIL, proyecto no EN_PROCESO audit FAIL — el mock simula
  el WHERE de estado de la BD—, filtros en findAll).
- Integración criba (BD real): **6/6**.

## Pendientes / riesgos

- La UI (B6.3) todavía no los captura ni filtra.
