-- Permiso faltante: el seed RBAC solo creó ver/crear/editar/exportar para reportes_campo
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, actualizado_en)
VALUES (gen_random_uuid(), 'operaciones', 'reportes_campo', 'eliminar', 'Eliminar reportes de campo', true, NOW())
ON CONFLICT ("modulo", "recurso", "accion") DO NOTHING;

-- Vincular el permiso nuevo al rol Administrador
INSERT INTO role_permissions (rol_id, permiso_id)
SELECT 'a0000000-0000-0000-0000-000000000001', id
FROM permissions
WHERE modulo = 'operaciones' AND recurso = 'reportes_campo' AND accion = 'eliminar'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;
