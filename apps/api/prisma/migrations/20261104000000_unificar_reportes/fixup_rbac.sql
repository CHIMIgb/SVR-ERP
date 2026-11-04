-- Fix RBAC de la unificación (encoding de consola + tipos)
UPDATE "vistas"
   SET ruta = '/reportes-operaciones', nombre = 'Reportes de Operación', icono = 'AlertTriangle'
 WHERE ruta = '/reportes-campo';

INSERT INTO role_vistas (id, rol_id, vista_id, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar, asignado_en)
SELECT gen_random_uuid(), r.id, v.id, true, true, true, true, true, now()
FROM roles r CROSS JOIN vistas v
WHERE v.ruta = '/reportes-operaciones' AND r.es_sistema = true
  AND NOT EXISTS (
    SELECT 1 FROM role_vistas rv WHERE rv.rol_id = r.id AND rv.vista_id = v.id
  );

SELECT nombre, ruta, icono FROM vistas WHERE ruta LIKE '/reportes%' ORDER BY ruta;
SELECT v.nombre, v.ruta, rv.puede_crear FROM role_vistas rv JOIN vistas v ON v.id = rv.vista_id WHERE v.ruta = '/reportes-operaciones';
