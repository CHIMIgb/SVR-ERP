-- PWA móvil, rebanada 1: asistencia propia y del equipo, separada de los permisos de RRHH.
-- rrhh.asistencia:* deja checar y ver a CUALQUIER trabajador (el id viaja en el body); estos permisos
-- nuevos solo abren los endpoints /asistencia/mia* (el trabajador sale del token) y /asistencia/equipo
-- (solo quienes tienen al usuario como jefe). Aditiva e idempotente.

INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en)
VALUES
  ('aa00001e-0000-0000-0000-000000000001', 'rrhh', 'mi_asistencia', 'ver', 'Ver la asistencia propia (PWA)', true, NOW(), NOW()),
  ('aa00001e-0000-0000-0000-000000000002', 'rrhh', 'mi_asistencia', 'crear', 'Checar entrada y salida propias (PWA)', true, NOW(), NOW()),
  ('aa00001e-0000-0000-0000-000000000003', 'rrhh', 'mi_equipo', 'ver', 'Ver la asistencia de su equipo (PWA)', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- La asistencia es universal (decisión del cliente): la propia va a todos los roles vivos.
INSERT INTO role_permissions (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.modulo = 'rrhh' AND p.recurso = 'mi_asistencia' AND p.accion IN ('ver', 'crear')
WHERE r.eliminado_en IS NULL
  AND r.activo = true
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.rol_id = r.id AND rp.permiso_id = p.id
  );

-- El equipo propio: residentes (jefes de cuadrilla en /equipos) y el administrador.
INSERT INTO role_permissions (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.modulo = 'rrhh' AND p.recurso = 'mi_equipo' AND p.accion = 'ver'
WHERE r.eliminado_en IS NULL
  AND r.activo = true
  AND r.nombre IN ('Residente', 'Administrador')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.rol_id = r.id AND rp.permiso_id = p.id
  );
