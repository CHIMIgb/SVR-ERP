-- Demo: dos trabajadores mas a cargo del Residente (para evidenciar el scope
-- "reportes de mis trabajadores" con varios subordinados), + reportes de ejemplo
-- creados por cada uno (se agregan por HTTP/seed aparte para pasar por auditoria).

INSERT INTO personas (id, nombre, apellido_paterno, apellido_materno, correo, telefono, activo, creado_en, actualizado_en)
SELECT v.id::uuid, v.nombre_p, v.ap1, v.ap2, NULL, v.tel, true, NOW(), NOW()
FROM (VALUES
  ('e1000000-0000-0000-0000-0000000000c1', 'Pedro', 'Chofer', 'de Obra', '55 1234 0021'),
  ('e1000000-0000-0000-0000-0000000000c2', 'Luis', 'Operador', 'de Patio', '55 1234 0022')
) AS v(id, nombre_p, ap1, ap2, tel)
WHERE NOT EXISTS (SELECT 1 FROM personas p WHERE p.id = v.id::uuid);

-- password: trabajador123
INSERT INTO users (id, persona_id, email, password_hash, email_verificado, activo, jefe_user_id, preferencias, creado_en, actualizado_en)
SELECT v.id::uuid, v.persona_id::uuid, v.email, '$2b$10$Se6q8ljVOkd4AyIv9pQSNeoJVyA5bhv9aROJbYBmF/vSH1IQp8FD6', true, true,
  (SELECT id FROM users WHERE email = 'residente@svr-constructora.com'), '{}', NOW(), NOW()
FROM (VALUES
  ('e2000000-0000-0000-0000-0000000000c1', 'e1000000-0000-0000-0000-0000000000c1', 'pedro.chofer@svr-constructora.com'),
  ('e2000000-0000-0000-0000-0000000000c2', 'e1000000-0000-0000-0000-0000000000c2', 'luis.operador@svr-constructora.com')
) AS v(id, persona_id, email)
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = v.email);

INSERT INTO users_roles (id, user_id, rol_id, es_principal, activo, asignado_en)
SELECT gen_random_uuid(), u.id, r.id, true, true, NOW()
FROM users u
JOIN (VALUES
  ('pedro.chofer@svr-constructora.com'),
  ('luis.operador@svr-constructora.com')
) AS v(email) ON u.email = v.email
JOIN roles r ON r.nombre = 'Trabajador'
WHERE NOT EXISTS (
  SELECT 1 FROM users_roles ur WHERE ur.user_id = u.id AND ur.rol_id = r.id
);
