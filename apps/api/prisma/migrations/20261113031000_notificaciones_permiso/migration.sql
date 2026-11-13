-- B5.2: valor de auditoría para "marcar leída" + permiso del centro de notificaciones.
-- ADD VALUE (no recrea el tipo: el drift preexistente de AuditAction queda intacto).
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'NOTIFICACION_LEIDA';

-- Permiso granular nuevo (sistema.notificaciones.ver) — sin duplicados.
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en)
VALUES ('aa00001d-0000-0000-0000-000000000001', 'sistema', 'notificaciones', 'ver', 'Ver el centro de notificaciones del Topbar', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- El centro del Topbar es para todos: el permiso va a TODOS los roles vivos
-- (las notificaciones ya se filtran por audiencia de rol al consultarse).
INSERT INTO role_permissions (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.modulo = 'sistema' AND p.recurso = 'notificaciones' AND p.accion = 'ver'
WHERE r.eliminado_en IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.rol_id = r.id AND rp.permiso_id = p.id
  );
