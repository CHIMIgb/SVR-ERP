-- RBAC de la PWA (plan §8.1-2 y §8.8): vistas móviles /m/* registradas en la
-- tabla vistas (es_menu=FALSE: no entran al sidebar del escritorio) y
-- concesiones por rol según la especificación del cliente.
-- Idempotente: vistas por ruta única + role_vistas por NOT EXISTS.

-- ══ 1. Vistas móviles ══
INSERT INTO "vistas" ("id", "nombre", "descripcion", "ruta", "icono", "orden", "es_menu", "es_visible", "activo", "creado_en", "actualizado_en")
SELECT v.id::uuid, v.nombre, v.descripcion, v.ruta, v.icono, v.orden, FALSE, TRUE, TRUE, NOW(), NOW()
FROM (VALUES
  ('90000000-0000-0000-0000-000000000001', 'Inicio (móvil)',        'Pantalla de inicio del rol',            '/m',              'Home',          900),
  ('90000000-0000-0000-0000-000000000002', 'Asistencia (móvil)',   'Marcaje con foto y GPS',                '/m/asistencia',   'ClipboardCheck',901),
  ('90000000-0000-0000-0000-000000000003', 'Reportes (móvil)',     'Reportes de campo del rol',             '/m/reportes',     'AlertTriangle', 902),
  ('90000000-0000-0000-0000-000000000004', 'Contactos (móvil)',    'Contactos y mesa de ayuda',             '/m/contactos',    'Phone',         903),
  ('90000000-0000-0000-0000-000000000005', 'Mi perfil (móvil)',    'Perfil y documentos personales',        '/m/perfil',       'User',          904),
  ('90000000-0000-0000-0000-000000000006', 'Obras (móvil)',        'Obras con ubicación',                   '/m/obras',        'Building2',     905),
  ('90000000-0000-0000-0000-000000000007', 'Flota y obras (móvil)','Flota y obras con ubicación',           '/m/flota-obras',  'Truck',         906),
  ('90000000-0000-0000-0000-000000000008', 'Inventario (móvil)',   'Inventario con tabs y stock',           '/m/inventario',   'Boxes',         907),
  ('90000000-0000-0000-0000-000000000009', 'Diésel (móvil)',       'Reparto y cargas de diésel',            '/m/diesel',       'Fuel',          908),
  ('90000000-0000-0000-0000-000000000010', 'Punto de venta (móvil)','POS de la criba',                      '/m/pos',          'CreditCard',    909),
  ('90000000-0000-0000-0000-000000000011', 'Corte del día (móvil)','Corte de caja del día',                 '/m/corte',        'Calculator',    910),
  ('90000000-0000-0000-0000-000000000012', 'Finanzas (móvil)',     'Flujo y movimientos',                   '/m/finanzas',     'Wallet',        911),
  ('90000000-0000-0000-0000-000000000013', 'Módulos (móvil)',      'Todos los módulos del sistema',         '/m/modulos',      'LayoutGrid',    912)
) AS v(id, nombre, descripcion, ruta, icono, orden)
WHERE NOT EXISTS (SELECT 1 FROM "vistas" x WHERE x.ruta = v.ruta);

-- ══ 2. Concesiones por rol (puede_ver; crear/editar/eliminar según el módulo de destino cuando arranque cada pantalla) ══
INSERT INTO "role_vistas" ("id", "rol_id", "vista_id", "puede_ver", "puede_crear", "puede_editar", "puede_eliminar", "puede_exportar", "activo", "asignado_en")
SELECT gen_random_uuid(), r.id, vv.id, TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, NOW()
FROM (VALUES
  -- asistencia UNIVERSAL (todos los roles de trabajadores)
  ('Trabajador',          '/m'),
  ('Trabajador',          '/m/asistencia'),
  ('Trabajador',          '/m/reportes'),
  ('Trabajador',          '/m/contactos'),
  ('Trabajador',          '/m/perfil'),
  ('Residente',           '/m'),
  ('Residente',           '/m/asistencia'),
  ('Residente',           '/m/reportes'),
  ('Residente',           '/m/obras'),
  ('Residente',           '/m/contactos'),
  ('Tecnico Mecanico',    '/m'),
  ('Tecnico Mecanico',    '/m/asistencia'),
  ('Tecnico Mecanico',    '/m/reportes'),
  ('Tecnico Mecanico',    '/m/flota-obras'),
  ('Tecnico Mecanico',    '/m/inventario'),
  ('Tecnico Soldador',    '/m'),
  ('Tecnico Soldador',    '/m/asistencia'),
  ('Tecnico Soldador',    '/m/reportes'),
  ('Tecnico Soldador',    '/m/flota-obras'),
  ('Tecnico Soldador',    '/m/inventario'),
  ('Tecnico Diesel',      '/m'),
  ('Tecnico Diesel',      '/m/asistencia'),
  ('Tecnico Diesel',      '/m/reportes'),
  ('Tecnico Diesel',      '/m/flota-obras'),
  ('Tecnico Diesel',      '/m/inventario'),
  ('Tecnico Diesel',      '/m/diesel'),
  ('Tecnico Mantenimiento','/m'),
  ('Tecnico Mantenimiento','/m/asistencia'),
  ('Tecnico Mantenimiento','/m/reportes'),
  ('Tecnico Mantenimiento','/m/flota-obras'),
  ('Tecnico Mantenimiento','/m/inventario'),
  ('Cobrador',            '/m'),
  ('Cobrador',            '/m/asistencia'),
  ('Cobrador',            '/m/pos'),
  ('Cobrador',            '/m/corte'),
  ('Administrador',       '/m'),
  ('Administrador',       '/m/reportes'),
  ('Administrador',       '/m/finanzas'),
  ('Administrador',       '/m/modulos')
) AS permisos(rol_nombre, ruta)
JOIN roles r ON r.nombre = permisos.rol_nombre
JOIN vistas vv ON vv.ruta = permisos.ruta
WHERE NOT EXISTS (
  SELECT 1 FROM "role_vistas" rv WHERE rv.rol_id = r.id AND rv.vista_id = vv.id
);
