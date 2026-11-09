-- Roles de plantilla (nueva-info) + torre asignada a cada rol + permisos/vistas
-- mínimos + un usuario de ejemplo por rol.
-- Idempotente por id NOT EXISTS y claves únicas (nombre de rol, email).

-- ════════════════════════════════════════════════
-- 1. TORRE por rol — conecta "misma área" con /reportes
-- ════════════════════════════════════════════════
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "torre" "CategoriaReporte";

UPDATE roles SET torre = 'ADMINISTRATIVO'
WHERE nombre IN ('Administrador', 'Encargado de RRHH') AND torre IS NULL;

INSERT INTO roles (id, nombre, descripcion, nivel, es_sistema, activo, torre, creado_en, actualizado_en)
SELECT v.id::uuid, v.nombre, v.descrip, v.nivel, false, true, v.torre::"CategoriaReporte", NOW(), NOW()
FROM (VALUES
  ('e0000000-0000-0000-0000-0000000000a1', 'Administrativo', 'Jefes y personas en oficina', 80, 'ADMINISTRATIVO'),
  ('e0000000-0000-0000-0000-0000000000a2', 'Residente',    'Ingenieros encargados de obra', 90, 'RESIDENTE'),
  ('e0000000-0000-0000-0000-0000000000a3', 'Técnico',      'Mecánico, soldador, diésel y mantenimiento', 70, 'MECANICO'),
  ('e0000000-0000-0000-0000-0000000000a4', 'Cobrador',     'Cobro de criba y punto de venta', 60, 'ADMINISTRATIVO'),
  ('e0000000-0000-0000-0000-0000000000a5', 'Trabajador',   'Operadores, choferes y demás personal de campo', 20, NULL)
) AS v(id, nombre, descrip, nivel, torre)
WHERE NOT EXISTS (SELECT 1 FROM roles r WHERE r.nombre = v.nombre);

-- ════════════════════════════════════════════════
-- 2. role_permissions — qué puede hacer cada rol
--    dashboards: dashboard.ver · reportes: operaciones.reportes_campo.*
-- ════════════════════════════════════════════════
-- matriz: tr = rol, acciones de reportes
DO $$
DECLARE
  target_roles RECORD;
  reportes_ver  uuid;
  reportes_crea uuid;
  reportes_edit uuid;
  reportes_elim uuid;
  reportes_expo uuid;
  dash_ver      uuid;
BEGIN
  SELECT id INTO dash_ver      FROM permissions WHERE modulo='dashboard' AND accion='ver' LIMIT 1;
  SELECT id INTO reportes_ver  FROM permissions WHERE modulo='operaciones' AND recurso='reportes_campo' AND accion='ver' LIMIT 1;
  SELECT id INTO reportes_crea FROM permissions WHERE modulo='operaciones' AND recurso='reportes_campo' AND accion='crear' LIMIT 1;
  SELECT id INTO reportes_edit FROM permissions WHERE modulo='operaciones' AND recurso='reportes_campo' AND accion='editar' LIMIT 1;
  SELECT id INTO reportes_elim FROM permissions WHERE modulo='operaciones' AND recurso='reportes_campo' AND accion='eliminar' LIMIT 1;
  SELECT id INTO reportes_expo FROM permissions WHERE modulo='operaciones' AND recurso='reportes_campo' AND accion='exportar' LIMIT 1;

  -- (rol nombre, ver, crear, editar, eliminar, exportar)
  FOR target_roles IN
    SELECT * FROM (VALUES
      ('Administrativo', true,  true,  true,  true,  true),
      ('Residente',      true,  true,  true,  false, false),
      ('Técnico',        true,  true,  true,  false, false),
      ('Cobrador',       true,  false, false, false, false),
      ('Trabajador',     true,  true,  false, false, false)
    ) AS t(n, tv, tc, te, td, tx)
  LOOP
    INSERT INTO role_permissions (rol_id, permiso_id, creado_en)
    SELECT r.id, dash_ver, NOW() FROM roles r WHERE r.nombre = target_roles.n
    ON CONFLICT DO NOTHING;
    INSERT INTO role_permissions (rol_id, permiso_id, creado_en)
    SELECT r.id, reportes_ver, NOW() FROM roles r WHERE r.nombre = target_roles.n
    ON CONFLICT DO NOTHING;
    IF target_roles.tc THEN
      INSERT INTO role_permissions (rol_id, permiso_id, creado_en)
      SELECT r.id, reportes_crea, NOW() FROM roles r WHERE r.nombre = target_roles.n
      ON CONFLICT DO NOTHING;
    END IF;
    IF target_roles.te THEN
      INSERT INTO role_permissions (rol_id, permiso_id, creado_en)
      SELECT r.id, reportes_edit, NOW() FROM roles r WHERE r.nombre = target_roles.n
      ON CONFLICT DO NOTHING;
    END IF;
    IF target_roles.td THEN
      INSERT INTO role_permissions (rol_id, permiso_id, creado_en)
      SELECT r.id, reportes_elim, NOW() FROM roles r WHERE r.nombre = target_roles.n
      ON CONFLICT DO NOTHING;
    END IF;
    IF target_roles.tx THEN
      INSERT INTO role_permissions (rol_id, permiso_id, creado_en)
      SELECT r.id, reportes_expo, NOW() FROM roles r WHERE r.nombre = target_roles.n
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════
-- 3. role_vistas — sidebar mínimo por rol (dashboard + reportes)
--    flags igual al role_permission correspondiente
-- ════════════════════════════════════════════════
DO $$
DECLARE
  target_roles RECORD;
  vista_dash_id uuid;
  vista_rep_id  uuid;
BEGIN
  SELECT id INTO vista_dash_id FROM vistas WHERE ruta='/dashboard' LIMIT 1;
  SELECT id INTO vista_rep_id  FROM vistas WHERE ruta='/reportes'  LIMIT 1;

  FOR target_roles IN
    SELECT * FROM (VALUES
      ('Administrativo', true,  true,  true,  true,  true),
      ('Residente',      true,  true,  true,  false, false),
      ('Técnico',        true,  true,  true,  false, false),
      ('Cobrador',       true,  false, false, false, false),
      ('Trabajador',     true,  true,  false, false, false)
    ) AS t(n, tv, tc, te, td, tx)
  LOOP
    INSERT INTO role_vistas (id, rol_id, vista_id, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar, activo, asignado_en)
    SELECT gen_random_uuid(), r.id, vista_dash_id, true, false, false, false, false, true, NOW()
    FROM roles r WHERE r.nombre = target_roles.n
    AND NOT EXISTS (
      SELECT 1 FROM role_vistas rv WHERE rv.rol_id = r.id AND rv.vista_id = vista_dash_id
    );

    INSERT INTO role_vistas (id, rol_id, vista_id, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar, activo, asignado_en)
    SELECT gen_random_uuid(), r.id, vista_rep_id, target_roles.tv, target_roles.tc, target_roles.te, target_roles.td, target_roles.tx, true, NOW()
    FROM roles r WHERE r.nombre = target_roles.n
    AND NOT EXISTS (
      SELECT 1 FROM role_vistas rv WHERE rv.rol_id = r.id AND rv.vista_id = vista_rep_id
    );
  END LOOP;
END $$;

-- ════════════════════════════════════════════════
-- 4. Un usuario por rol (persona + user + users_roles)
-- ════════════════════════════════════════════════
INSERT INTO personas (id, nombre, apellido_paterno, apellido_materno, correo, activo, creado_en, actualizado_en)
SELECT v.id::uuid, v.nombre_p, v.ap1, v.ap2, NULL, true, NOW(), NOW()
FROM (VALUES
  ('e1000000-0000-0000-0000-0000000000a1', 'Laura',  'Administrativo', 'Oficina'),
  ('e1000000-0000-0000-0000-0000000000a2', 'Óscar',  'Residente',      'de Obra'),
  ('e1000000-0000-0000-0000-0000000000a3', 'Rubén',  'Técnico',        'de Flota'),
  ('e1000000-0000-0000-0000-0000000000a4', 'Carla',  'Cobradora',      'de Criba'),
  ('e1000000-0000-0000-0000-0000000000a5', 'Juan',   'Trabajador',     'de Campo')
) AS v(id, nombre_p, ap1, ap2)
WHERE NOT EXISTS (SELECT 1 FROM personas p WHERE p.id = v.id::uuid);

INSERT INTO users (id, persona_id, email, password_hash, email_verificado, activo, preferencias, creado_en, actualizado_en)
SELECT v.id::uuid, v.persona_id::uuid, v.email, v.pass, true, true, '{}', NOW(), NOW()
FROM (VALUES
  ('e2000000-0000-0000-0000-0000000000a1', 'e1000000-0000-0000-0000-0000000000a1', 'administrativo@svr-constructora.com', '$2b$10$kTxPe.w2joWkNickhX9FZub0NCBHjTOim1FoyIWvjvz3eBH2MuFQy'),
  ('e2000000-0000-0000-0000-0000000000a2', 'e1000000-0000-0000-0000-0000000000a2', 'residente@svr-constructora.com',      '$2b$10$1EhoXDUUZhKSI/SD.7dT6e0fN6kRVsRScy2j6oZKTvjMgvnnrDrYe'),
  ('e2000000-0000-0000-0000-0000000000a3', 'e1000000-0000-0000-0000-0000000000a3', 'tecnico@svr-constructora.com',        '$2b$10$0hUObSVRKOf1q822D6sY1OeIkoHRqFFumRZdwQYFXRvKVxMTXfl16'),
  ('e2000000-0000-0000-0000-0000000000a4', 'e1000000-0000-0000-0000-0000000000a4', 'cobrador@svr-constructora.com',       '$2b$10$uP.snRJaeAyi0lt1PxYh9ugO79TGV2rJY2DIt25QETVRgwyqhuZjy'),
  ('e2000000-0000-0000-0000-0000000000a5', 'e1000000-0000-0000-0000-0000000000a5', 'trabajador@svr-constructora.com',     '$2b$10$Se6q8ljVOkd4AyIv9pQSNeoJVyA5bhv9aROJbYBmF/vSH1IQp8FD6')
) AS v(id, persona_id, email, pass)
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = v.email);

INSERT INTO users_roles (id, user_id, rol_id, es_principal, activo, asignado_en)
SELECT gen_random_uuid(), u.id, r.id, true, true, NOW()
FROM (VALUES
  ('administrativo@svr-constructora.com', 'Administrativo'),
  ('residente@svr-constructora.com',      'Residente'),
  ('tecnico@svr-constructora.com',        'Técnico'),
  ('cobrador@svr-constructora.com',       'Cobrador'),
  ('trabajador@svr-constructora.com',     'Trabajador')
) AS v(email, rol_nombre)
JOIN users u ON u.email = v.email
JOIN roles r ON r.nombre = v.rol_nombre
WHERE NOT EXISTS (
  SELECT 1 FROM users_roles ur WHERE ur.user_id = u.id AND ur.rol_id = r.id
);
