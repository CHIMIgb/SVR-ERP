-- SVR-ERP Seed RBAC - 2026-08-21

-- 1. ROL Administrador
INSERT INTO roles (id, nombre, descripcion, nivel, es_sistema, activo, creado_en, actualizado_en)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Administrador', 'Acceso total al sistema.', 100, true, true, NOW(), NOW());

-- 2. PERSONA + USUARIO Admin
INSERT INTO personas (id, nombre, apellido_paterno, correo, telefono, activo, creado_en, actualizado_en)
VALUES ('b0000000-0000-0000-0000-000000000001', 'Carlos', 'SVR', 'admin@svr-constructora.com', '8112345678', true, NOW(), NOW());

INSERT INTO users (id, persona_id, email, password_hash, email_verificado, activo, creado_en, actualizado_en)
VALUES ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'admin@svr-constructora.com', '$2b$10$placeholder_hash_reemplazar_en_produccion', true, true, NOW(), NOW());

INSERT INTO users_roles (id, user_id, rol_id, es_principal, activo, asignado_en)
VALUES ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', true, true, NOW());

-- 3. PERMISOS (96 total: CRUD + acciones especiales por modulo)
-- Dashboard
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa000001-0000-0000-0000-000000000001', 'dashboard', 'dashboard', 'ver', 'Ver panel principal', true, NOW(), NOW());

-- RRHH: Trabajadores
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa000002-0000-0000-0000-000000000001', 'rrhh', 'trabajadores', 'ver', 'Ver listado de trabajadores', true, NOW(), NOW()),
('aa000002-0000-0000-0000-000000000002', 'rrhh', 'trabajadores', 'crear', 'Crear trabajadores', true, NOW(), NOW()),
('aa000002-0000-0000-0000-000000000003', 'rrhh', 'trabajadores', 'editar', 'Editar trabajadores', true, NOW(), NOW()),
('aa000002-0000-0000-0000-000000000004', 'rrhh', 'trabajadores', 'eliminar', 'Eliminar trabajadores', true, NOW(), NOW()),
('aa000002-0000-0000-0000-000000000005', 'rrhh', 'trabajadores', 'exportar', 'Exportar listado de trabajadores', true, NOW(), NOW());

-- RRHH: Asistencia
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa000003-0000-0000-0000-000000000001', 'rrhh', 'asistencia', 'ver', 'Ver registros de asistencia', true, NOW(), NOW()),
('aa000003-0000-0000-0000-000000000002', 'rrhh', 'asistencia', 'crear', 'Registrar asistencia', true, NOW(), NOW()),
('aa000003-0000-0000-0000-000000000003', 'rrhh', 'asistencia', 'editar', 'Editar registros de asistencia', true, NOW(), NOW()),
('aa000003-0000-0000-0000-000000000004', 'rrhh', 'asistencia', 'exportar', 'Exportar reporte de asistencia', true, NOW(), NOW());

-- RRHH: Nomina
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa000004-0000-0000-0000-000000000001', 'rrhh', 'nomina', 'ver', 'Ver nomina', true, NOW(), NOW()),
('aa000004-0000-0000-0000-000000000002', 'rrhh', 'nomina', 'crear', 'Crear nomina', true, NOW(), NOW()),
('aa000004-0000-0000-0000-000000000003', 'rrhh', 'nomina', 'editar', 'Editar nomina', true, NOW(), NOW()),
('aa000004-0000-0000-0000-000000000004', 'rrhh', 'nomina', 'procesar', 'Procesar pagos de nomina', true, NOW(), NOW()),
('aa000004-0000-0000-0000-000000000005', 'rrhh', 'nomina', 'exportar', 'Exportar nomina', true, NOW(), NOW());

-- Maquinaria: Flota
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa000005-0000-0000-0000-000000000001', 'maquinaria', 'flota', 'ver', 'Ver flota de maquinaria', true, NOW(), NOW()),
('aa000005-0000-0000-0000-000000000002', 'maquinaria', 'flota', 'crear', 'Registrar maquinaria', true, NOW(), NOW()),
('aa000005-0000-0000-0000-000000000003', 'maquinaria', 'flota', 'editar', 'Editar maquinaria', true, NOW(), NOW()),
('aa000005-0000-0000-0000-000000000004', 'maquinaria', 'flota', 'eliminar', 'Eliminar maquinaria', true, NOW(), NOW());

-- Maquinaria: Horometro
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa000006-0000-0000-0000-000000000001', 'maquinaria', 'horometro', 'ver', 'Ver lecturas de horometro', true, NOW(), NOW()),
('aa000006-0000-0000-0000-000000000002', 'maquinaria', 'horometro', 'crear', 'Registrar lectura de horometro', true, NOW(), NOW()),
('aa000006-0000-0000-0000-000000000003', 'maquinaria', 'horometro', 'editar', 'Editar lectura de horometro', true, NOW(), NOW());

-- Maquinaria: Mantenimiento
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa000007-0000-0000-0000-000000000001', 'maquinaria', 'mantenimiento', 'ver', 'Ver registros de mantenimiento', true, NOW(), NOW()),
('aa000007-0000-0000-0000-000000000002', 'maquinaria', 'mantenimiento', 'crear', 'Crear mantenimiento', true, NOW(), NOW()),
('aa000007-0000-0000-0000-000000000003', 'maquinaria', 'mantenimiento', 'editar', 'Editar mantenimiento', true, NOW(), NOW()),
('aa000007-0000-0000-0000-000000000004', 'maquinaria', 'mantenimiento', 'aprobar', 'Aprobar mantenimiento', true, NOW(), NOW());

-- Maquinaria: Combustible
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa000008-0000-0000-0000-000000000001', 'maquinaria', 'combustible', 'ver', 'Ver registros de combustible', true, NOW(), NOW()),
('aa000008-0000-0000-0000-000000000002', 'maquinaria', 'combustible', 'crear', 'Registrar carga de combustible', true, NOW(), NOW()),
('aa000008-0000-0000-0000-000000000003', 'maquinaria', 'combustible', 'editar', 'Editar registro de combustible', true, NOW(), NOW()),
('aa000008-0000-0000-0000-000000000004', 'maquinaria', 'combustible', 'exportar', 'Exportar reporte de combustible', true, NOW(), NOW());

-- Maquinaria: GPS
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa000009-0000-0000-0000-000000000001', 'maquinaria', 'gps', 'ver', 'Ver rastreo GPS', true, NOW(), NOW()),
('aa000009-0000-0000-0000-000000000002', 'maquinaria', 'gps', 'editar', 'Configurar geocercas', true, NOW(), NOW());

-- Operaciones: Operaciones
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa00000a-0000-0000-0000-000000000001', 'operaciones', 'operaciones', 'ver', 'Ver ordenes de operacion', true, NOW(), NOW()),
('aa00000a-0000-0000-0000-000000000002', 'operaciones', 'operaciones', 'crear', 'Crear orden de operacion', true, NOW(), NOW()),
('aa00000a-0000-0000-0000-000000000003', 'operaciones', 'operaciones', 'editar', 'Editar orden de operacion', true, NOW(), NOW()),
('aa00000a-0000-0000-0000-000000000004', 'operaciones', 'operaciones', 'eliminar', 'Eliminar orden de operacion', true, NOW(), NOW());

-- Operaciones: Reportes de Campo
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa00000b-0000-0000-0000-000000000001', 'operaciones', 'reportes_campo', 'ver', 'Ver reportes de campo', true, NOW(), NOW()),
('aa00000b-0000-0000-0000-000000000002', 'operaciones', 'reportes_campo', 'crear', 'Crear reporte de campo', true, NOW(), NOW()),
('aa00000b-0000-0000-0000-000000000003', 'operaciones', 'reportes_campo', 'editar', 'Editar reporte de campo', true, NOW(), NOW()),
('aa00000b-0000-0000-0000-000000000004', 'operaciones', 'reportes_campo', 'exportar', 'Exportar reportes de campo', true, NOW(), NOW());

-- Operaciones: Criba
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa00000c-0000-0000-0000-000000000001', 'operaciones', 'criba', 'ver', 'Ver registros de criba', true, NOW(), NOW()),
('aa00000c-0000-0000-0000-000000000002', 'operaciones', 'criba', 'crear', 'Crear registro de criba', true, NOW(), NOW()),
('aa00000c-0000-0000-0000-000000000003', 'operaciones', 'criba', 'editar', 'Editar registro de criba', true, NOW(), NOW());

-- Operaciones: Inventario
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa00000d-0000-0000-0000-000000000001', 'operaciones', 'inventario', 'ver', 'Ver inventario', true, NOW(), NOW()),
('aa00000d-0000-0000-0000-000000000002', 'operaciones', 'inventario', 'crear', 'Crear articulo de inventario', true, NOW(), NOW()),
('aa00000d-0000-0000-0000-000000000003', 'operaciones', 'inventario', 'editar', 'Editar articulo de inventario', true, NOW(), NOW()),
('aa00000d-0000-0000-0000-000000000004', 'operaciones', 'inventario', 'eliminar', 'Eliminar articulo de inventario', true, NOW(), NOW()),
('aa00000d-0000-0000-0000-000000000005', 'operaciones', 'inventario', 'exportar', 'Exportar inventario', true, NOW(), NOW());

-- Operaciones: Proyectos
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa00000e-0000-0000-0000-000000000001', 'operaciones', 'proyectos', 'ver', 'Ver proyectos', true, NOW(), NOW()),
('aa00000e-0000-0000-0000-000000000002', 'operaciones', 'proyectos', 'crear', 'Crear proyecto', true, NOW(), NOW()),
('aa00000e-0000-0000-0000-000000000003', 'operaciones', 'proyectos', 'editar', 'Editar proyecto', true, NOW(), NOW()),
('aa00000e-0000-0000-0000-000000000004', 'operaciones', 'proyectos', 'eliminar', 'Eliminar proyecto', true, NOW(), NOW());

-- Comercial: Clientes
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa00000f-0000-0000-0000-000000000001', 'comercial', 'clientes', 'ver', 'Ver clientes', true, NOW(), NOW()),
('aa00000f-0000-0000-0000-000000000002', 'comercial', 'clientes', 'crear', 'Crear cliente', true, NOW(), NOW()),
('aa00000f-0000-0000-0000-000000000003', 'comercial', 'clientes', 'editar', 'Editar cliente', true, NOW(), NOW()),
('aa00000f-0000-0000-0000-000000000004', 'comercial', 'clientes', 'eliminar', 'Eliminar cliente', true, NOW(), NOW());

-- Comercial: Cotizaciones
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa000010-0000-0000-0000-000000000001', 'comercial', 'cotizaciones', 'ver', 'Ver cotizaciones', true, NOW(), NOW()),
('aa000010-0000-0000-0000-000000000002', 'comercial', 'cotizaciones', 'crear', 'Crear cotizacion', true, NOW(), NOW()),
('aa000010-0000-0000-0000-000000000003', 'comercial', 'cotizaciones', 'editar', 'Editar cotizacion', true, NOW(), NOW()),
('aa000010-0000-0000-0000-000000000004', 'comercial', 'cotizaciones', 'eliminar', 'Eliminar cotizacion', true, NOW(), NOW()),
('aa000010-0000-0000-0000-000000000005', 'comercial', 'cotizaciones', 'exportar', 'Exportar cotizacion', true, NOW(), NOW());

-- Comercial: Finanzas
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa000011-0000-0000-0000-000000000001', 'comercial', 'finanzas', 'ver', 'Ver finanzas', true, NOW(), NOW()),
('aa000011-0000-0000-0000-000000000002', 'comercial', 'finanzas', 'crear', 'Registrar transaccion financiera', true, NOW(), NOW()),
('aa000011-0000-0000-0000-000000000003', 'comercial', 'finanzas', 'editar', 'Editar transaccion financiera', true, NOW(), NOW()),
('aa000011-0000-0000-0000-000000000004', 'comercial', 'finanzas', 'exportar', 'Exportar reportes financieros', true, NOW(), NOW());

-- Comercial: Proveedores
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa000012-0000-0000-0000-000000000001', 'comercial', 'proveedores', 'ver', 'Ver proveedores', true, NOW(), NOW()),
('aa000012-0000-0000-0000-000000000002', 'comercial', 'proveedores', 'crear', 'Crear proveedor', true, NOW(), NOW()),
('aa000012-0000-0000-0000-000000000003', 'comercial', 'proveedores', 'editar', 'Editar proveedor', true, NOW(), NOW()),
('aa000012-0000-0000-0000-000000000004', 'comercial', 'proveedores', 'eliminar', 'Eliminar proveedor', true, NOW(), NOW());

-- Comercial: Ventas
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa000013-0000-0000-0000-000000000001', 'comercial', 'ventas', 'ver', 'Ver punto de venta', true, NOW(), NOW()),
('aa000013-0000-0000-0000-000000000002', 'comercial', 'ventas', 'crear', 'Crear venta', true, NOW(), NOW()),
('aa000013-0000-0000-0000-000000000003', 'comercial', 'ventas', 'editar', 'Editar venta', true, NOW(), NOW()),
('aa000013-0000-0000-0000-000000000004', 'comercial', 'ventas', 'cancelar', 'Cancelar venta', true, NOW(), NOW());

-- Comercial: Cobranza
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa000014-0000-0000-0000-000000000001', 'comercial', 'cobranza', 'ver', 'Ver cuentas por cobrar', true, NOW(), NOW()),
('aa000014-0000-0000-0000-000000000002', 'comercial', 'cobranza', 'crear', 'Registrar cobro', true, NOW(), NOW()),
('aa000014-0000-0000-0000-000000000003', 'comercial', 'cobranza', 'editar', 'Editar cobro', true, NOW(), NOW()),
('aa000014-0000-0000-0000-000000000004', 'comercial', 'cobranza', 'exportar', 'Exportar reporte de cobranza', true, NOW(), NOW());

-- Sistema: Documentos
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa000015-0000-0000-0000-000000000001', 'sistema', 'documentos', 'ver', 'Ver documentos', true, NOW(), NOW()),
('aa000015-0000-0000-0000-000000000002', 'sistema', 'documentos', 'crear', 'Subir documento', true, NOW(), NOW()),
('aa000015-0000-0000-0000-000000000003', 'sistema', 'documentos', 'editar', 'Editar documento', true, NOW(), NOW()),
('aa000015-0000-0000-0000-000000000004', 'sistema', 'documentos', 'eliminar', 'Eliminar documento', true, NOW(), NOW());

-- Sistema: Reportes
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa000016-0000-0000-0000-000000000001', 'sistema', 'reportes', 'ver', 'Ver reportes', true, NOW(), NOW()),
('aa000016-0000-0000-0000-000000000002', 'sistema', 'reportes', 'exportar', 'Exportar reportes', true, NOW(), NOW());

-- Sistema: Configuracion
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa000017-0000-0000-0000-000000000001', 'sistema', 'configuracion', 'ver', 'Ver configuracion del sistema', true, NOW(), NOW()),
('aa000017-0000-0000-0000-000000000002', 'sistema', 'configuracion', 'editar', 'Editar configuracion del sistema', true, NOW(), NOW());

-- Sistema: Usuarios
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa000018-0000-0000-0000-000000000001', 'sistema', 'usuarios', 'ver', 'Ver usuarios del sistema', true, NOW(), NOW()),
('aa000018-0000-0000-0000-000000000002', 'sistema', 'usuarios', 'crear', 'Crear usuario', true, NOW(), NOW()),
('aa000018-0000-0000-0000-000000000003', 'sistema', 'usuarios', 'editar', 'Editar usuario', true, NOW(), NOW()),
('aa000018-0000-0000-0000-000000000004', 'sistema', 'usuarios', 'eliminar', 'Eliminar usuario (soft delete)', true, NOW(), NOW()),
('aa000018-0000-0000-0000-000000000005', 'sistema', 'usuarios', 'asignar_rol', 'Asignar roles a usuarios', true, NOW(), NOW());

-- Sistema: Roles
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa000019-0000-0000-0000-000000000001', 'sistema', 'roles', 'ver', 'Ver roles del sistema', true, NOW(), NOW()),
('aa000019-0000-0000-0000-000000000002', 'sistema', 'roles', 'crear', 'Crear rol', true, NOW(), NOW()),
('aa000019-0000-0000-0000-000000000003', 'sistema', 'roles', 'editar', 'Editar rol y sus permisos', true, NOW(), NOW()),
('aa000019-0000-0000-0000-000000000004', 'sistema', 'roles', 'eliminar', 'Eliminar rol (si no es de sistema)', true, NOW(), NOW());

-- Sistema: Permisos
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa00001a-0000-0000-0000-000000000001', 'sistema', 'permisos', 'ver', 'Ver permisos del sistema', true, NOW(), NOW()),
('aa00001a-0000-0000-0000-000000000002', 'sistema', 'permisos', 'editar', 'Gestionar permisos', true, NOW(), NOW());

-- 4. VINCULO: Todos los permisos al rol Administrador
INSERT INTO role_permissions (rol_id, permiso_id, creado_en)
SELECT 'a0000000-0000-0000-0000-000000000001', id, NOW()
FROM permissions WHERE activo = true;

-- 5. VISTAS del sidebar (24 vistas)
INSERT INTO vistas (id, nombre, ruta, icono, orden, es_menu, es_visible, requiere_auth, activo, creado_en, actualizado_en) VALUES
('bb000001-0000-0000-0000-000000000001', 'Dashboard', '/dashboard', 'LayoutDashboard', 1, true, true, true, true, NOW(), NOW()),
('bb000002-0000-0000-0000-000000000001', 'Trabajadores', '/trabajadores', 'Users', 10, true, true, true, true, NOW(), NOW()),
('bb000002-0000-0000-0000-000000000002', 'Asistencia', '/asistencia', 'Clock', 11, true, true, true, true, NOW(), NOW()),
('bb000002-0000-0000-0000-000000000003', 'Nomina', '/nomina', 'Banknote', 12, true, true, true, true, NOW(), NOW()),
('bb000003-0000-0000-0000-000000000001', 'Flota', '/maquinaria', 'Truck', 20, true, true, true, true, NOW(), NOW()),
('bb000003-0000-0000-0000-000000000002', 'Horometro', '/horometro', 'Timer', 21, true, true, true, true, NOW(), NOW()),
('bb000003-0000-0000-0000-000000000003', 'Mantenimiento', '/mantenimiento', 'Wrench', 22, true, true, true, true, NOW(), NOW()),
('bb000003-0000-0000-0000-000000000004', 'Combustible', '/combustible', 'Fuel', 23, true, true, true, true, NOW(), NOW()),
('bb000003-0000-0000-0000-000000000005', 'GPS', '/gps', 'MapPin', 24, true, true, true, true, NOW(), NOW()),
('bb000004-0000-0000-0000-000000000001', 'Operaciones', '/operaciones', 'ClipboardList', 30, true, true, true, true, NOW(), NOW()),
('bb000004-0000-0000-0000-000000000002', 'Reportes de Campo', '/reportes-campo', 'ShieldAlert', 31, true, true, true, true, NOW(), NOW()),
('bb000004-0000-0000-0000-000000000003', 'Criba', '/criba', 'Layers', 32, true, true, true, true, NOW(), NOW()),
('bb000004-0000-0000-0000-000000000004', 'Inventario', '/inventario', 'Package', 33, true, true, true, true, NOW(), NOW()),
('bb000004-0000-0000-0000-000000000005', 'Proyectos', '/proyectos', 'HardHat', 34, true, true, true, true, NOW(), NOW()),
('bb000005-0000-0000-0000-000000000001', 'Clientes', '/clientes', 'Building2', 40, true, true, true, true, NOW(), NOW()),
('bb000005-0000-0000-0000-000000000002', 'Cotizaciones', '/cotizaciones', 'FileText', 41, true, true, true, true, NOW(), NOW()),
('bb000005-0000-0000-0000-000000000003', 'Finanzas', '/finanzas', 'Banknote', 42, true, true, true, true, NOW(), NOW()),
('bb000005-0000-0000-0000-000000000004', 'Proveedores', '/proveedores', 'Truck', 43, true, true, true, true, NOW(), NOW()),
('bb000005-0000-0000-0000-000000000005', 'Punto de Venta', '/ventas', 'ShoppingCart', 44, true, true, true, true, NOW(), NOW()),
('bb000005-0000-0000-0000-000000000006', 'Cobranza', '/cobranza', 'CreditCard', 45, true, true, true, true, NOW(), NOW()),
('bb000006-0000-0000-0000-000000000001', 'Documentacion', '/documentos', 'FileBadge', 50, true, true, true, true, NOW(), NOW()),
('bb000006-0000-0000-0000-000000000002', 'Reportes', '/reportes', 'BarChart3', 51, true, true, true, true, NOW(), NOW()),
('bb000006-0000-0000-0000-000000000003', 'Simulador App', '/simulador-movil', 'LayoutDashboard', 52, true, true, true, true, NOW(), NOW()),
('bb000006-0000-0000-0000-000000000004', 'Configuracion', '/configuracion', 'Settings', 53, true, true, true, true, NOW(), NOW());

-- 6. VINCULO: Todas las vistas al rol Administrador (acceso total)
INSERT INTO role_vistas (id, rol_id, vista_id, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar, activo)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', id, true, true, true, true, true, true
FROM vistas WHERE activo = true;
