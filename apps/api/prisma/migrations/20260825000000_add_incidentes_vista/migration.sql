-- Agregar vista Incidentes al menú, sus permisos y asignarlos al rol Administrador

-- 1. Permisos del recurso incidentes
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa00001b-0000-0000-0000-000000000001', 'operaciones', 'incidentes', 'ver',      'Ver incidentes',      true, NOW(), NOW()),
('aa00001b-0000-0000-0000-000000000002', 'operaciones', 'incidentes', 'crear',    'Reportar incidente',  true, NOW(), NOW()),
('aa00001b-0000-0000-0000-000000000003', 'operaciones', 'incidentes', 'editar',   'Editar incidente',    true, NOW(), NOW()),
('aa00001b-0000-0000-0000-000000000004', 'operaciones', 'incidentes', 'eliminar', 'Eliminar incidente',  true, NOW(), NOW()),
('aa00001b-0000-0000-0000-000000000005', 'operaciones', 'incidentes', 'exportar', 'Exportar incidentes', true, NOW(), NOW())
ON CONFLICT (modulo, recurso, accion) DO NOTHING;

-- 2. Vincular permisos al rol Administrador
INSERT INTO role_permissions (rol_id, permiso_id, creado_en)
SELECT 'a0000000-0000-0000-0000-000000000001', id, NOW()
FROM permissions
WHERE modulo = 'operaciones' AND recurso = 'incidentes'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

-- 3. Vista del sidebar
INSERT INTO vistas (id, nombre, ruta, icono, orden, es_menu, es_visible, requiere_auth, activo, creado_en, actualizado_en) VALUES
('bb000004-0000-0000-0000-000000000006', 'Incidentes', '/incidentes', 'AlertTriangle', 35, true, true, true, true, NOW(), NOW())
ON CONFLICT (ruta) DO NOTHING;

-- 4. Vincular vista al rol Administrador
INSERT INTO role_vistas (id, rol_id, vista_id, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar, activo)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', id, true, true, true, true, true, true
FROM vistas
WHERE ruta = '/incidentes'
ON CONFLICT (rol_id, vista_id) DO NOTHING;
