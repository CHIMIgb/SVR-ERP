-- Usuarios demo para cubrir TODAS las areas (torres) en /reportes:
-- soldador/diesel/mantenimiento son del ROL Tecnico con users.torre explicita,
-- asi "misma area" resuelve directo al area del usuario (predece sobre el rol).

INSERT INTO personas (id, nombre, apellido_paterno, apellido_materno, correo, telefono, activo, creado_en, actualizado_en)
SELECT v.id::uuid, v.nombre_p, v.ap1, v.ap2, NULL, v.tel, true, NOW(), NOW()
FROM (VALUES
  ('e1000000-0000-0000-0000-0000000000b1', 'Carlos', 'Soldador', 'de Planta', '55 1234 0011'),
  ('e1000000-0000-0000-0000-0000000000b2', 'Denis', 'Repartidor', 'de Diesel', '55 1234 0012'),
  ('e1000000-0000-0000-0000-0000000000b3', 'Moises', 'Mantenimiento', 'General', '55 1234 0013')
) AS v(id, nombre_p, ap1, ap2, tel)
WHERE NOT EXISTS (SELECT 1 FROM personas p WHERE p.id = v.id::uuid);

-- mismos hashes: password 'tecnico123'
INSERT INTO users (id, persona_id, email, password_hash, email_verificado, activo, torre, preferencias, creado_en, actualizado_en)
SELECT v.id::uuid, v.persona_id::uuid, v.email, '$2b$10$0hUObSVRKOf1q822D6sY1OeIkoHRqFFumRZdwQYFXRvKVxMTXfl16', true, true, v.torre::"CategoriaReporte", '{}', NOW(), NOW()
FROM (VALUES
  ('e2000000-0000-0000-0000-0000000000b1', 'e1000000-0000-0000-0000-0000000000b1', 'soldador@svr-constructora.com', 'SOLDADOR'),
  ('e2000000-0000-0000-0000-0000000000b2', 'e1000000-0000-0000-0000-0000000000b2', 'diesel@svr-constructora.com', 'DIESEL'),
  ('e2000000-0000-0000-0000-0000000000b3', 'e1000000-0000-0000-0000-0000000000b3', 'mantenimiento@svr-constructora.com', 'MANTENIMIENTO')
) AS v(id, persona_id, email, torre)
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = v.email);

INSERT INTO users_roles (id, user_id, rol_id, es_principal, activo, asignado_en)
SELECT gen_random_uuid(), u.id, r.id, true, true, NOW()
FROM users u
JOIN (VALUES
  ('soldador@svr-constructora.com', 'Técnico'),
  ('diesel@svr-constructora.com', 'Técnico'),
  ('mantenimiento@svr-constructora.com', 'Técnico')
) AS v(email, rol_nombre) ON u.email = v.email
JOIN roles r ON r.nombre = v.rol_nombre
WHERE NOT EXISTS (
  SELECT 1 FROM users_roles ur WHERE ur.user_id = u.id AND ur.rol_id = r.id
);

-- El usuario tecnico@ base queda con su torre explicita tambien
UPDATE users SET torre = 'MECANICO' WHERE email = 'tecnico@svr-constructora.com' AND torre IS NULL;
