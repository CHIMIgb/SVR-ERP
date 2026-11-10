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
-- 4. USUARIOS DEMO — RETIRADOS de la migración (review PR #17):
--    migrar era crear cuentas con contraseña conocida en producción.
--    Ahora viven en prisma/demo-seed.sql (ejecución manual en dev).
-- ════════════════════════════════════════════════
