-- Agrega el permiso "eliminar" a mantenimiento y combustible (faltaba en el
-- seed original porque esos módulos solo tenían Create+Read en ese momento).
-- Se otorga de inmediato al rol Administrador, igual que el resto de permisos.

INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa000007-0000-0000-0000-000000000005', 'maquinaria', 'mantenimiento', 'eliminar', 'Eliminar registro de mantenimiento', true, NOW(), NOW()),
('aa000008-0000-0000-0000-000000000005', 'maquinaria', 'combustible', 'eliminar', 'Eliminar registro de combustible', true, NOW(), NOW());

INSERT INTO role_permissions (rol_id, permiso_id, creado_en)
SELECT 'a0000000-0000-0000-0000-000000000001', id, NOW()
FROM permissions
WHERE id IN (
  'aa000007-0000-0000-0000-000000000005',
  'aa000008-0000-0000-0000-000000000005'
);
