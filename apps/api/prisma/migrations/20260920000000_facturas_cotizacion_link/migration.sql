-- SVR-ERP: Facturas + vínculo cotización → factura (fase 3)
-- Aditiva: facturas.cotizacion_id + acciones de auditoría + RBAC comercial.facturas.

-- AlterEnum (PostgreSQL 12+: múltiples ADD VALUE en la misma transacción)
ALTER TYPE "AuditAction" ADD VALUE 'FACTURA_CREADA';
ALTER TYPE "AuditAction" ADD VALUE 'FACTURA_ACTUALIZADA';
ALTER TYPE "AuditAction" ADD VALUE 'FACTURA_TIMBRADA';
ALTER TYPE "AuditAction" ADD VALUE 'FACTURA_CANCELADA';
ALTER TYPE "AuditAction" ADD VALUE 'COTIZACION_FACTURADA';

-- AlterTable
ALTER TABLE "facturas" ADD COLUMN     "cotizacion_id" UUID;

-- CreateIndex
CREATE INDEX "facturas_cotizacion_id_idx" ON "facturas"("cotizacion_id");

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_cotizacion_id_fkey" FOREIGN KEY ("cotizacion_id") REFERENCES "cotizaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Permisos: Comercial → Facturas (ver, crear, editar, eliminar, exportar)
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) VALUES
('aa00001c-0000-0000-0000-000000000001', 'comercial', 'facturas', 'ver', 'Ver facturas', true, NOW(), NOW()),
('aa00001c-0000-0000-0000-000000000002', 'comercial', 'facturas', 'crear', 'Crear factura', true, NOW(), NOW()),
('aa00001c-0000-0000-0000-000000000003', 'comercial', 'facturas', 'editar', 'Editar factura', true, NOW(), NOW()),
('aa00001c-0000-0000-0000-000000000004', 'comercial', 'facturas', 'eliminar', 'Eliminar factura', true, NOW(), NOW()),
('aa00001c-0000-0000-0000-000000000005', 'comercial', 'facturas', 'exportar', 'Exportar facturas', true, NOW(), NOW());

-- Permisos nuevos → rol Administrador
INSERT INTO role_permissions (rol_id, permiso_id, creado_en)
SELECT 'a0000000-0000-0000-0000-000000000001', id, NOW()
FROM permissions WHERE recurso = 'facturas' AND activo = true;

-- Vista del sidebar: Facturas (Comercial, orden 47 — después de Cierre de Caja)
INSERT INTO vistas (id, nombre, ruta, icono, orden, es_menu, es_visible, requiere_auth, activo, creado_en, actualizado_en)
VALUES ('bb000005-0000-0000-0000-000000000008', 'Facturas', '/facturas', 'Receipt', 47, true, true, true, true, NOW(), NOW());

-- Vista nueva → rol Administrador (acceso total)
INSERT INTO role_vistas (id, rol_id, vista_id, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar, activo)
VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'bb000005-0000-0000-0000-000000000008', true, true, true, true, true, true);