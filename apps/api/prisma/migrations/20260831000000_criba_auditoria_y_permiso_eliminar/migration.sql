-- Acciones de auditoría para el CRUD de registros de criba
ALTER TYPE "AuditAction" ADD VALUE 'REGISTRO_CRIBA_CREADO';
ALTER TYPE "AuditAction" ADD VALUE 'REGISTRO_CRIBA_ACTUALIZADO';
ALTER TYPE "AuditAction" ADD VALUE 'REGISTRO_CRIBA_ELIMINADO';

-- Permiso faltante: el seed RBAC solo creó ver/crear/editar para criba
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, actualizado_en)
VALUES (gen_random_uuid(), 'operaciones', 'criba', 'eliminar', 'Eliminar registros de criba', true, NOW())
ON CONFLICT ("modulo", "recurso", "accion") DO NOTHING;

-- Vincular el permiso nuevo al rol Administrador
INSERT INTO role_permissions (rol_id, permiso_id)
SELECT 'a0000000-0000-0000-0000-000000000001', id
FROM permissions
WHERE modulo = 'operaciones' AND recurso = 'criba' AND accion = 'eliminar'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;
