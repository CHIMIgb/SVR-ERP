-- ============================================================
-- SVR-ERP: Usuario de ejemplo - Encargado de RRHH
-- Solo tiene acceso al módulo de Recursos Humanos
-- ============================================================

-- 1. ROL: Encargado de RRHH
INSERT INTO roles (id, nombre, descripcion, nivel, es_sistema, activo, creado_en, actualizado_en)
VALUES (
  'f0000000-0000-0000-0000-000000000001',
  'Encargado de RRHH',
  'Gestión de trabajadores, asistencia y nómina. Sin acceso a otros módulos.',
  30,
  false,
  true,
  NOW(),
  NOW()
);

-- 2. PERSONA
INSERT INTO personas (id, nombre, apellido_paterno, apellido_materno, correo, telefono, activo, creado_en, actualizado_en)
VALUES (
  'f0000000-0000-0000-0000-000000000010',
  'María',
  'López',
  'Hernández',
  'rrhh@svr-constructora.com',
  '8112345679',
  true,
  NOW(),
  NOW()
);

-- 3. USUARIO
INSERT INTO users (id, persona_id, email, password_hash, email_verificado, activo, creado_en, actualizado_en)
VALUES (
  'f0000000-0000-0000-0000-000000000020',
  'f0000000-0000-0000-0000-000000000010',
  'rrhh@svr-constructora.com',
  '$2b$10$d8E/iD6ikOg2YpKe6blDsenJhw19jJI6NFQJT5V03B.8tUQ5rN4Hy',
  true,
  true,
  NOW(),
  NOW()
);

-- 4. VINCULO users_roles
INSERT INTO users_roles (id, user_id, rol_id, es_principal, activo, asignado_en)
VALUES (
  'f0000000-0000-0000-0000-000000000030',
  'f0000000-0000-0000-0000-000000000020',
  'f0000000-0000-0000-0000-000000000001',
  true,
  true,
  NOW()
);

-- 5. PERMISOS DEL ROL (solo módulo RRHH: 14 permisos)
-- Dashboard (acceso básico al panel)
INSERT INTO role_permissions (rol_id, permiso_id, creado_en)
VALUES ('f0000000-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', NOW());

-- RRHH: Trabajadores (ver, crear, editar, eliminar, exportar)
INSERT INTO role_permissions (rol_id, permiso_id, creado_en)
VALUES
  ('f0000000-0000-0000-0000-000000000001', 'aa000002-0000-0000-0000-000000000001', NOW()),
  ('f0000000-0000-0000-0000-000000000001', 'aa000002-0000-0000-0000-000000000002', NOW()),
  ('f0000000-0000-0000-0000-000000000001', 'aa000002-0000-0000-0000-000000000003', NOW()),
  ('f0000000-0000-0000-0000-000000000001', 'aa000002-0000-0000-0000-000000000004', NOW()),
  ('f0000000-0000-0000-0000-000000000001', 'aa000002-0000-0000-0000-000000000005', NOW());

-- RRHH: Asistencia (ver, crear, editar, exportar)
INSERT INTO role_permissions (rol_id, permiso_id, creado_en)
VALUES
  ('f0000000-0000-0000-0000-000000000001', 'aa000003-0000-0000-0000-000000000001', NOW()),
  ('f0000000-0000-0000-0000-000000000001', 'aa000003-0000-0000-0000-000000000002', NOW()),
  ('f0000000-0000-0000-0000-000000000001', 'aa000003-0000-0000-0000-000000000003', NOW()),
  ('f0000000-0000-0000-0000-000000000001', 'aa000003-0000-0000-0000-000000000004', NOW());

-- RRHH: Nomina (ver, crear, editar, procesar, exportar)
INSERT INTO role_permissions (rol_id, permiso_id, creado_en)
VALUES
  ('f0000000-0000-0000-0000-000000000001', 'aa000004-0000-0000-0000-000000000001', NOW()),
  ('f0000000-0000-0000-0000-000000000001', 'aa000004-0000-0000-0000-000000000002', NOW()),
  ('f0000000-0000-0000-0000-000000000001', 'aa000004-0000-0000-0000-000000000003', NOW()),
  ('f0000000-0000-0000-0000-000000000001', 'aa000004-0000-0000-0000-000000000004', NOW()),
  ('f0000000-0000-0000-0000-000000000001', 'aa000004-0000-0000-0000-000000000005', NOW());

-- 6. VISTAS DEL ROL (solo Dashboard + 3 vistas RRHH)
-- Dashboard (básico para todos)
INSERT INTO role_vistas (id, rol_id, vista_id, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar, activo)
VALUES ('f0000000-0000-0000-0000-000000000040', 'f0000000-0000-0000-0000-000000000001', 'bb000001-0000-0000-0000-000000000001', true, false, false, false, false, true);

-- Trabajadores (CRUD completo)
INSERT INTO role_vistas (id, rol_id, vista_id, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar, activo)
VALUES ('f0000000-0000-0000-0000-000000000041', 'f0000000-0000-0000-0000-000000000001', 'bb000002-0000-0000-0000-000000000001', true, true, true, true, true, true);

-- Asistencia (ver, crear, editar, exportar)
INSERT INTO role_vistas (id, rol_id, vista_id, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar, activo)
VALUES ('f0000000-0000-0000-0000-000000000042', 'f0000000-0000-0000-0000-000000000001', 'bb000002-0000-0000-0000-000000000002', true, true, true, false, true, true);

-- Nomina (ver, crear, editar, exportar)
INSERT INTO role_vistas (id, rol_id, vista_id, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar, activo)
VALUES ('f0000000-0000-0000-0000-000000000043', 'f0000000-0000-0000-0000-000000000001', 'bb000002-0000-0000-0000-000000000003', true, true, true, false, true, true);
