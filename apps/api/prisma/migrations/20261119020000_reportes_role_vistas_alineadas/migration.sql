-- Alinea role_vistas de /reportes con los permisos reales del API
-- (role_permissions). El escritorio y la PWA gateaban botones por la VISTA,
-- pero el server los rechaza: Cobrador y Trabajador no tienen permiso
-- 'editar' (ni siquiera de los suyos), y la eliminación es SOLO del
-- Administrador (decisión del SVR, ya gateada por permiso en el escritorio).
-- Idempotente: UPDATE puro, se puede re-ejecutar.

UPDATE role_vistas rv SET puede_editar = false
FROM vistas v, roles r
WHERE rv.vista_id = v.id AND rv.rol_id = r.id
  AND v.ruta = '/reportes'
  AND r.nombre IN ('Cobrador', 'Trabajador')
  AND rv.puede_editar = true;

UPDATE role_vistas rv SET puede_eliminar = false
FROM vistas v, roles r
WHERE rv.vista_id = v.id AND rv.rol_id = r.id
  AND v.ruta = '/reportes'
  AND r.nombre IN ('Tecnico', 'Tecnico Mecanico', 'Tecnico Soldador', 'Tecnico Diesel', 'Tecnico Mantenimiento')
  AND rv.puede_eliminar = true;
