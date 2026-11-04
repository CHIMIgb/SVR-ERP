-- Drop de la tabla fantasma `permisos` (solicitudes de vacaciones/RRHH sin uso)
-- Verificado 2026-11-04: 0 filas, 0 FKs que la referencien, 0 vistas/dependencias,
-- 0 referencias en código (apps/api y apps/web). La RBAC real vive en `permissions`.
DROP TABLE IF EXISTS "permisos";
DROP TYPE IF EXISTS "TipoPermiso";
