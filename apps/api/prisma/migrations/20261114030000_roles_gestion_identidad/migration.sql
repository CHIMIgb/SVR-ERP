-- Fase 3 del plan de vistas de Sistema (2026-11-14): /roles (Gestión de Identidad).
-- 1) Acciones de auditoría literales para el catálogo de roles (decisión del
--    cliente: valores literales, no metadata).
-- 2) Vista /roles en el sidebar, SOLO Administrador.
-- Idempotente. (PG permite ALTER TYPE ADD VALUE en transacción si el valor
-- nuevo no se usa dentro de la misma — aquí no se usan.)

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ROL_CREADO';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ROL_ACTUALIZADO';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ROL_ELIMINADO';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'VISTAS_ROL_ACTUALIZADAS';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PERMISOS_ROL_ACTUALIZADOS';

INSERT INTO vistas (id, ruta, nombre, descripcion, icono, orden, es_menu, es_visible, requiere_auth, creado_en, actualizado_en)
VALUES (
  'bb000006-0000-0000-0000-000000000007',
  '/roles',
  'Gestión de Identidad',
  'Roles, vistas, permisos, áreas, PIN y sesiones por usuario',
  'ShieldCheck',
  54,
  true,
  true,
  true,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO role_vistas (id, rol_id, vista_id, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar, asignado_en)
VALUES (
  'bb700006-0000-0000-0000-000000000007',
  'a0000000-0000-0000-0000-000000000001', -- Administrador (es_sistema)
  'bb000006-0000-0000-0000-000000000007',
  true, true, true, true, false,
  now()
)
ON CONFLICT (rol_id, vista_id) DO NOTHING;
