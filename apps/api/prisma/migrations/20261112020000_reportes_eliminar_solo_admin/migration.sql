-- Alineación role_vistas con la decisión "reportes_campo.eliminar = solo
-- Administrador" (el permiso ya se retiró por SQL; las vistas del rol
-- Administrativo seguían con puede_eliminar=true y el front mostraba el botón).
-- IDEMPOTENTE.

UPDATE "role_vistas" rv
SET "puede_eliminar" = false
FROM "vistas" v, "roles" r
WHERE rv."vista_id" = v."id"
  AND rv."rol_id" = r."id"
  AND v."ruta" = '/reportes'
  AND r."nombre" = 'Administrativo'
  AND rv."puede_eliminar" = true;

-- DOWN (best-effort): restaurar el flag si se revierte la decisión.
-- UPDATE role_vistas rv SET puede_eliminar = true
-- FROM vistas v, roles r
-- WHERE rv.vista_id = v.id AND rv.rol_id = r.id
--   AND v.ruta = '/reportes' AND r.nombre = 'Administrativo';
