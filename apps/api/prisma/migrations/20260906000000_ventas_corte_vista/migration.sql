-- Agregar vista Cierre de Caja al menú y asignarla al rol Administrador

-- 1. Vista del sidebar (después de Punto de Venta, orden 46)
INSERT INTO vistas (id, nombre, ruta, icono, orden, es_menu, es_visible, requiere_auth, activo, creado_en, actualizado_en) VALUES
('bb000005-0000-0000-0000-000000000007', 'Cierre de Caja', '/ventas/corte', 'ReceiptText', 46, true, true, true, true, NOW(), NOW())
ON CONFLICT (ruta) DO NOTHING;

-- 2. Vincular vista al rol Administrador
INSERT INTO role_vistas (id, rol_id, vista_id, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar, activo)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', id, true, true, true, true, true, true
FROM vistas
WHERE ruta = '/ventas/corte'
ON CONFLICT (rol_id, vista_id) DO NOTHING;
