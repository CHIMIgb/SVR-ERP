# Pendientes B2 commiteados + decisión de alcance del modo oscuro

**Fecha:** 2026-11-04
**Autor:** agente OpenCode

## Cambios realizados
- Commit `e7af5c21`: pendientes que quedaban sin commitear del trabajo de la
  unificación B2:
  - `audit.constants.ts`: severidad 'INFO' para la acción nueva `REPORTE_ASIGNADO`
    (faltaba en el mapa; tsc no pasaba sin ella).
  - `migration.sql` unificar_reportes: corregido al RBAC final que en realidad se
    aplicó (UPDATE→/reportes con choque de unique, después final a
    /reportes-operaciones, luego la vista repurposeada a /reportes).
  - `scripts/audit-ops-comercial.cjs`: script de auditoría por-método de la
    revisión de paginación de vistas Operaciones/Comercial.
- `CAMBIOS SVR.pdf` (raíz) quedó sin trackear a propósito — parece archivo
  personal del usuario; no se commitea sin su orden.

## Decisión registrada (futura implementación del modo oscuro)
- Alcance: **solo las vistas de Comercial y Operaciones** (no toda la app).
  Viable con clase `.dark` aplicada en un layout exclusivo para ese grupo de
  rutas (route group sin cambiar URLs) + `@custom-variant dark` de Tailwind v4.
- El toggle **ir en la barra superior, al lado del icono de notificaciones**.

## Pendientes y riesgos
- Implementación del modo oscuro pendiente de autorización (Fase 0 con el
  alcance de 2 grupos de vistas).
- **PSA (2026-11-04 posterior):** el usuario decide **DELEGAR la implementación
  del modo oscuro al otro desarrollador** — no se implementa desde aquí por
  ahora. El análisis, alcance (Comercial+Operaciones) y colocación del toggle
  (Topbar, junto a notificaciones) quedan documentados arriba para que el otro
  dev arranque sin re-analizar.
