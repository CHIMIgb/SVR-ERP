-- Reasignacion quirurgica: rol generico "Técnico" (acento) -> roles descriptivos
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
  AND NOT EXISTS (SELECT 1 FROM users_roles dup WHERE dup.user_id = u.id AND dup.rol_id = nr.id);

DELETE FROM users_roles ur
USING roles r, users u
WHERE r.id = ur.rol_id AND u.id = ur.user_id
  AND r.nombre = 'Técnico' AND u.torre IS NOT NULL;

DELETE FROM role_permissions rp
USING roles r
WHERE r.id = rp.rol_id AND r.nombre = 'Técnico'
  AND NOT EXISTS (SELECT 1 FROM users_roles ur WHERE ur.rol_id = r.id);

DELETE FROM role_vistas rv
USING roles r
WHERE r.id = rv.rol_id AND r.nombre = 'Técnico'
  AND NOT EXISTS (SELECT 1 FROM users_roles ur WHERE ur.rol_id = r.id);

DELETE FROM roles r
WHERE r.nombre = 'Técnico'
  AND NOT EXISTS (SELECT 1 FROM users_roles ur WHERE ur.rol_id = r.id);

SELECT u.email, r.nombre AS rol, text(r.torre) AS torre
FROM users u JOIN users_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.rol_id
WHERE u.email LIKE '%@svr-constructora.com' AND r.nombre LIKE 'Tecnico%';
