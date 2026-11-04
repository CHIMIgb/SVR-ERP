# B1 Unificación Reportes+Incidentes — migración y BD

**Fecha:** 2026-11-04
**Autor:** agente OpenCode (a petición del usuario)

## Cambios realizados
- `schema.prisma`: enum `TipoReporteCampo` + `ADMINISTRATIVO` (área nueva); el modelo
  `reportes_campo` gana `asignado_a_id FK trabajadores / asignado_en / asignado_nombre /
  resuelto_en` + índices `(tipo, estado)` y `(asignado_a_id)`; modelo `incidentes`,
  enum `EstadoIncidente` y TODAS sus relaciones inversas (maquinas, obras, trabajadores,
  users) eliminados del schema.
- Migración `20261104000000_unificar_reportes/migration.sql` (aplicada manualmente por
  psql y marcada con `prisma migrate resolve --applied` — el historial baselined no
  permite `migrate dev`, shadow sin tablas base):
  1. `ALTER TYPE ... ADD VALUE 'ADMINISTRATIVO'`.
  2. Columnas/índices/FK nuevos en reportes_campo.
  3. `INSERT … SELECT` de los 2 incidentes reales → `tipo=INCIDENTE`, estados
     mapeados (ABIERTO→PENDIENTE), titulo+descripción fusionados, `usuario` desde el
     email del reportador, hora desde el timestamp.
  4. `DROP TABLE incidentes` + `DROP TYPE EstadoIncidente` (tabla fantasma: verificado
     que nadie del sistema la referenciaba — solo su módulo propio).
  5. RBAC: eliminados los 5 permisos `operaciones.incidentes.*` (+ sus role_permissions)
     y las vistas `/incidentes`/`/reportes-campo`; la vista unificada queda como
     **`/reportes-operaciones` ("Reportes de Operación", icono AlertTriangle)** — ruta
     `/reportes` estaba tomada por la página "Reportes" del grupo Sistema.
  - `fixup_rbac.sql`: renombrado UTF-8 + re-inserción de `role_vistas` para el rol
    Administrador (todas las acciones true).
- Prisma client regenerado.

## Decisión de permisos (plenaria del usuario)
- El trabajador asignado a resolver usa los permisos EXISTENTES
  `operaciones.reportes_campo.{ver, editar}` — no se crean módulos nuevos.

## Archivos tocados
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20261104000000_unificar_reportes/*`
- BD local svr_erp (aplicación manual) y svr_shadow_erp (copia completa re-creada).

## Pruebas / verificación
- `prisma validate` ✔; `prisma generate` ✔; `migrate resolve` ✔.
- psql: 2 incidentes migrados INSERT 0 2; 26 vistas (−incidentes, −reportes-campo,
  +reportes-operaciones); role_vistas del admin para la nueva vista = 1 fila ✔.

## Pendientes y riesgos
- El shadow restaurado con copia completa NO permite `migrate dev` (Prisma la exige
  vacía) — el flujo manual de aquí en delante es: SQL manual + `migrate resolve`.
- `restore` desde dump 8-sep reintroduciría la vista/duplicados — anotado.
