-- Fase 2 del plan de vistas de Sistema (2026-11-14): /equipos.
-- 1) Acción de auditoría literal JEFE_ASIGNADO (decisión del cliente):
--    el enum de BD es la lista cerrada de acciones válidas de registro_auditoria.
-- 2) Vista /equipos en el sidebar, SOLO Administrador.
-- Idempotente. (PG permite ALTER TYPE ADD VALUE en transacción si el valor
-- nuevo no se usa dentro de la misma — aquí no se usa.)

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'JEFE_ASIGNADO';

INSERT INTO vistas (id, ruta, nombre, descripcion, icono, orden, es_menu, es_visible, requiere_auth, creado_en, actualizado_en)
VALUES (
  'bb000006-0000-0000-0000-000000000006',
  '/equipos',
  'Equipos',
  'Enlace de residentes con sus trabajadores (jefe_user_id)',
  'UsersRound',
  52,
  true,
  true,
  true,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO role_vistas (id, rol_id, vista_id, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar, asignado_en)
VALUES (
  'bb700006-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000001', -- Administrador (es_sistema)
  'bb000006-0000-0000-0000-000000000006',
  true, false, true, false, false,
  now()
)
ON CONFLICT (rol_id, vista_id) DO NOTHING;
