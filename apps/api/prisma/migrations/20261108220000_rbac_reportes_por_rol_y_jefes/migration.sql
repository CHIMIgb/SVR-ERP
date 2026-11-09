-- RBAC de /reportes alineado + vinculo Residente << trabajadores:
-- 1. Todos pueden CREAR excepto los Residentes (ver + seguimiento/edicion de los
--    reportes de sus trabajadores). Cobrador suma crear. Los flags de la vista se
--    repintan igual.
-- 2. users.jefe_user_id: el jefe/residente de cada trabajador -- el alcance del
--    residente = reportes levantados por sus trabajadores (+ los suyos). Demo:
--    el usuario Trabajador queda a cargo del usuario Residente.

-- 1. role_permissions / role_vistas
-- 1a. Residente: fuera reportes_campo.crear
DELETE
FROM role_permissions rp
USING roles r, permissions p
WHERE r.id = rp.rol_id
  AND p.id = rp.permiso_id
  AND r.nombre = 'Residente'
  AND p.modulo = 'operaciones'
  AND p.recurso = 'reportes_campo'
  AND p.accion = 'crear';

UPDATE role_vistas rv
SET puede_crear = false
FROM roles r, vistas v
WHERE r.id = rv.rol_id
  AND v.id = rv.vista_id
  AND r.nombre = 'Residente'
  AND v.ruta = '/reportes';

-- 1b. Cobrador: suma crear (permiso + flag de vista)
INSERT INTO role_permissions (rol_id, permiso_id, creado_en)
SELECT r.id, p.id, NOW()
FROM roles r
JOIN permissions p ON p.modulo = 'operaciones' AND p.recurso = 'reportes_campo' AND p.accion = 'crear'
WHERE r.nombre = 'Cobrador'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.rol_id = r.id AND rp.permiso_id = p.id
  );

UPDATE role_vistas rv
SET puede_crear = true
FROM roles r, vistas v
WHERE r.id = rv.rol_id
  AND v.id = rv.vista_id
  AND r.nombre = 'Cobrador'
  AND v.ruta = '/reportes';

-- 2. users.jefe_user_id (residente de cada trabajador)
ALTER TABLE "users" ADD COLUMN "jefe_user_id" UUID;
ALTER TABLE "users" ADD CONSTRAINT "users_jefe_user_id_fkey"
    FOREIGN KEY ("jefe_user_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "users_jefe_user_id_idx" ON "users"("jefe_user_id");

-- Demo: el usuario Trabajador queda a cargo del usuario Residente
UPDATE users t
SET jefe_user_id = r.id
FROM users r
WHERE t.email = 'trabajador@svr-constructora.com'
  AND r.email = 'residente@svr-constructora.com';
