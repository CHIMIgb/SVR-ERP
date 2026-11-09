# RRHH: tope en las consultas de catálogo (regla de paginación de AGENTS.md)

**Fecha:** 2026-11-06
**Autor:** P4chec0php

## Cambios realizados
Se revisaron una por una las consultas de Asistencia, Nómina y Trabajadores que marca `audit-pagination.cjs`,
con las exenciones de la regla de `AGENTS.md` (catálogos para selects, consultas hijas acotadas al registro
padre y operaciones de negocio).

**Con tope nuevo:**
- **Asistencia, `marcarCuadrilla`:**
  - Los trabajadores pedidos llevan `take` exacto (uno por id; el DTO ya limita la cuadrilla a 200).
  - Los registros del día llevan un tope holgado (1000). Mientras no exista el índice único (trabajador,
    fecha) puede haber duplicados, y un tope exacto dejaría fuera a alguien que sí checó.
- **Trabajadores:** las máquinas de la página y los catálogos de máquinas y proyectos para los selects
  llevan tope de 500, igual que el catálogo de Flota.

**Exentas (se quedan sin tope, a propósito):**

| Consulta | Por qué |
|---|---|
| Percepciones y deducciones de **una** nómina | Hijas acotadas al registro padre (exención de la regla). |
| Generar y listar las nóminas de **un** periodo | Una por trabajador del periodo; generar es una operación de negocio. Un tope cortaría la nómina sin aviso. |
| Resumen semanal de Asistencia | Toda la plantilla de una semana; la vista y la sincronización de nómina necesitan el total. Paginarlo cambia el contrato de `GET /asistencia/semanal`. |

## Archivos tocados
- `apps/api/src/asistencia/asistencia.service.ts`
- `apps/api/src/trabajadores/trabajadores.service.ts`

## Verificación
- `npx tsc --noEmit` en `apps/api`: sin errores.
- Unitarias de Asistencia, Trabajadores y Nómina: 191 de 191.
- Integración de Asistencia y Trabajadores contra Postgres real: 22 de 22.
- `audit-pagination.cjs`: en RRHH solo quedan las consultas exentas de la tabla.

## Pendientes
- Si se decide paginar el resumen semanal o las nóminas del periodo, hay que mover los totales al servidor
  y cambiar el contrato con la vista.
