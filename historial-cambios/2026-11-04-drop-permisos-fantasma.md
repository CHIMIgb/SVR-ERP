# Drop tabla fantasma `permisos` + respuesta: dónde viven los vínculos de vistas

**Fecha:** 2026-11-04
**Autor:** agente OpenCode (a petición del usuario)

## Cambios realizados
- **DROP** de la tabla `permisos` y su enum `TipoPermiso` (migración
  `20261104002000_drop_permisos_fantasma`, aplicada por psql + `migrate resolve`).
- **IMPORTANTE — análisis antes del drop (a petición del usuario):** la tabla
  `permisos` NO era el sistema RBAC — era la tabla diseñada para **solicitudes de
  vacaciones/permisos/incapacidad de trabajadores** (TipoPermiso, aprobador_id,
  dias_solicitados). ESTATUS: 0 filas, 0 FKs de otras tablas, 0 vistasdependencias,
  0 referencias en código (apps/api + apps/web) — fantasma confirmada.
- Modelo `permisos`, su enum y TODAS las relaciones inversas (trabajadores, users ×3)
  eliminados del `schema.prisma`; cliente regenerado.
- Corrección de drift: el FK `reportes_campo_asignado_a_id_fkey` se recreó con
  `ON DELETE SET NULL ON UPDATE CASCADE` (como espera el schema) — `migrate diff`
  live-DB vs schema = **vacío**.

## Respuesta (pregunta del usuario: ¿dónde se registran los enlaces de las vistas?)
- **`vistas`** → catálogo del menú: `nombre`, **`ruta` (el enlace)**, `icono`, `orden`.
- **`role_vistas`** → vínculos rol ↔ vista con `puede_ver/crear/editar/eliminar/exportar`.
- Y el par RBAC hermano: `permissions` (módulo, recurso, acción) + `role_permissions`
  (rol ↔ permiso). Nombres trampa: la RBAC real es `permissions` (EN); la tabla
  `permisos` (ES) era otra cosa (vacaciones), ya dropiada.

## Archivos tocados
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20261104002000_drop_permisos_fantasma/migration.sql`
- BD svr_erp: DROP TABLE/TIPO + corrección FK

## Pruebas / verificación
- `prisma validate` ✔; `prisma generate` ✔; drift ✔ (diff vacío).
- `npm run test` (api): 958/960 — mismas 2 fallas preexistentes de cobranza (CSV).

## Pendientes y riesgos
- Si algún día se implementa "solicitar vacaciones" en RRHH, la tabla se recra con
  un migrate nuevo (el diseño está en el git history, commit previo).
- Restore desde el dump 8-sep reintroduciría la tabla — repetir el DROP.
