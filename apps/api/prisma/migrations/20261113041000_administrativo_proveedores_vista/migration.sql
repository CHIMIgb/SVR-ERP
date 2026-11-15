-- B5.7 (decisión RBAC del cliente): el rol Administrativo accede a /proveedores
-- para que las notificaciones de órdenes aprobadas y abonos tengan receptor.
-- Idempotente por la única [rol_id, vista_id].
INSERT INTO role_vistas (id, rol_id, vista_id, puede_ver, asignado_en)
SELECT
  'bb000005-0000-0000-0000-000000000101',
  'e0000000-0000-0000-0000-0000000000a1',           -- rol Administrativo
  v.id,                                              -- vista /proveedores
  true,
  NOW()
FROM vistas v
WHERE v.ruta = '/proveedores'
  AND NOT EXISTS (
    SELECT 1 FROM role_vistas rv
    WHERE rv.rol_id = 'e0000000-0000-0000-0000-0000000000a1'
      AND rv.vista_id = v.id
  );
