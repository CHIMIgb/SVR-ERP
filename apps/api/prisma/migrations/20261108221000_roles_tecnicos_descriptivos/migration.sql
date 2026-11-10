-- Roles Tecnicos descriptivos (evitar confusion): un rol por area, con su torre.
-- Los usuarios del rol generico "Técnico" (asi nace en 20261108180000) se
-- reasignan segun su users.torre y el rol generico se elimina solo cuando
-- queda vacio — review PR #17: la busqueda sin acento no encontraba NADA.

INSERT INTO roles (id, nombre, descripcion, nivel, es_sistema, activo, torre, creado_en, actualizado_en)
SELECT v.id::uuid, v.nombre, v.descrip, 70, false, true, v.torre::"CategoriaReporte", NOW(), NOW()
FROM (VALUES
  ('e0000000-0000-0000-0000-0000000000b1', 'Tecnico Mecanico',     'Tecnico mecanico de flota', 'MECANICO'),
  ('e0000000-0000-0000-0000-0000000000b2', 'Tecnico Soldador',    'Tecnico soldador', 'SOLDADOR'),
  ('e0000000-0000-0000-0000-0000000000b3', 'Tecnico Diesel',      'Tecnico de diesel (suministro/reparto)', 'DIESEL'),
  ('e0000000-0000-0000-0000-0000000000b4', 'Tecnico Mantenimiento', 'Tecnico de mantenimiento general', 'MANTENIMIENTO')
) AS v(id, nombre, descrip, torre)
WHERE NOT EXISTS (SELECT 1 FROM roles r WHERE r.nombre = v.nombre);

INSERT INTO role_permissions (rol_id, permiso_id, creado_en)
SELECT r.id, p.id, NOW()
FROM roles r
JOIN permissions p ON
  (p.modulo = 'dashboard' AND p.accion = 'ver')
  OR (p.modulo = 'operaciones' AND p.recurso = 'reportes_campo' AND p.accion IN ('ver', 'crear', 'editar'))
WHERE r.nombre IN ('Tecnico Mecanico', 'Tecnico Soldador', 'Tecnico Diesel', 'Tecnico Mantenimiento')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.rol_id = r.id AND rp.permiso_id = p.id
  );

INSERT INTO role_vistas (id, rol_id, vista_id, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar, activo, asignado_en)
SELECT gen_random_uuid(), r.id, v.id, TRUE, TRUE, TRUE, FALSE, FALSE, TRUE, NOW()
FROM roles r
JOIN (VALUES ('/dashboard'), ('/reportes')) AS rutas(ruta) ON TRUE
JOIN vistas v ON v.ruta = rutas.ruta
WHERE r.nombre IN ('Tecnico Mecanico', 'Tecnico Soldador', 'Tecnico Diesel', 'Tecnico Mantenimiento')
  AND NOT EXISTS (
    SELECT 1 FROM role_vistas rv WHERE rv.rol_id = r.id AND rv.vista_id = v.id
  );

-- Reasignar los usuarios del rol generico segun su users.torre
INSERT INTO users_roles (id, user_id, rol_id, es_principal, activo, asignado_en)
SELECT gen_random_uuid(), u.id, nr.id, TRUE, TRUE, NOW()
FROM users u
JOIN users_roles ur ON ur.user_id = u.id
JOIN roles viejo ON viejo.id = ur.rol_id AND viejo.nombre = 'Técnico'
JOIN roles nr ON nr.nombre = CASE text(u.torre)
  WHEN 'MECANICO'      THEN 'Tecnico Mecanico'
  WHEN 'SOLDADOR'      THEN 'Tecnico Soldador'
  WHEN 'DIESEL'        THEN 'Tecnico Diesel'
  WHEN 'MANTENIMIENTO' THEN 'Tecnico Mantenimiento'
END
WHERE u.torre IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users_roles dup WHERE dup.user_id = u.id AND dup.rol_id = nr.id
  );

-- Quitar la asignacion al rol generico y eliminarlo (solo si quedo sin usuarios)
DELETE
FROM users_roles ur
USING roles r, users u
WHERE r.id = ur.rol_id
  AND u.id = ur.user_id
  AND r.nombre = 'Técnico'
  AND u.torre IS NOT NULL;

DELETE
FROM role_permissions rp
USING roles r
WHERE r.id = rp.rol_id
  AND r.nombre = 'Técnico'
  AND NOT EXISTS (SELECT 1 FROM users_roles ur WHERE ur.rol_id = r.id);

DELETE
FROM role_vistas rv
USING roles r
WHERE r.id = rv.rol_id
  AND r.nombre = 'Técnico'
  AND NOT EXISTS (SELECT 1 FROM users_roles ur WHERE ur.rol_id = r.id);

DELETE
FROM roles r
WHERE r.nombre = 'Técnico'
  AND NOT EXISTS (SELECT 1 FROM users_roles ur WHERE ur.rol_id = r.id);
