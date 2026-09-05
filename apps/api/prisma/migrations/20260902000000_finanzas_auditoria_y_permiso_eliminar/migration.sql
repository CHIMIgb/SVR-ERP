-- Acciones de auditoría para el CRUD de transacciones financieras
ALTER TYPE "AuditAction" ADD VALUE 'TRANSACCION_CREADA';
ALTER TYPE "AuditAction" ADD VALUE 'TRANSACCION_ACTUALIZADA';
ALTER TYPE "AuditAction" ADD VALUE 'TRANSACCION_ELIMINADA';

-- Permiso faltante: el seed RBAC solo creó ver/crear/editar/exportar para finanzas
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, actualizado_en)
VALUES (gen_random_uuid(), 'comercial', 'finanzas', 'eliminar', 'Eliminar transaccion financiera', true, NOW())
ON CONFLICT ("modulo", "recurso", "accion") DO NOTHING;

-- Vincular el permiso nuevo al rol Administrador
INSERT INTO role_permissions (rol_id, permiso_id)
SELECT 'a0000000-0000-0000-0000-000000000001', id
FROM permissions
WHERE modulo = 'comercial' AND recurso = 'finanzas' AND accion = 'eliminar'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;
