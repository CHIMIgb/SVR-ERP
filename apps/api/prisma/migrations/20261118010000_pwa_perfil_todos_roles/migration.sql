-- "Mi perfil (móvil)" (/m/perfil) debe llegar en user.vistas a todos los roles
-- activos. El shell de la PWA ya lo exenta del guard de RBAC, pero hoy solo
-- Trabajador tiene la concesión y Residente la tiene en false.
-- role_vistas no tiene UNIQUE en (rol_id, vista_id): el NOT EXISTS sostiene
-- la idempotencia (patrón seed de este repo).

INSERT INTO role_vistas (
  id, rol_id, vista_id, puede_ver, puede_crear, puede_editar,
  puede_eliminar, puede_exportar, activo
)
SELECT gen_random_uuid(), r.id, v.id, true, false, false, false, false, true
FROM roles r
CROSS JOIN vistas v
WHERE r.activo = true
  AND v.activo = true
  AND v.ruta = '/m/perfil'
  AND NOT EXISTS (
    SELECT 1 FROM role_vistas rv
    WHERE rv.rol_id = r.id AND rv.vista_id = v.id
  );

UPDATE role_vistas rv
SET puede_ver = true
FROM roles r, vistas v
WHERE rv.rol_id = r.id
  AND rv.vista_id = v.id
  AND r.activo = true
  AND v.activo = true
  AND v.ruta = '/m/perfil'
  AND rv.puede_ver = false;
