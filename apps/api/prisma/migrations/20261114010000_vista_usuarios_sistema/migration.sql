-- Vista /usuarios (Fase 1 del plan de vistas de Sistema, 2026-11-14).
-- Solo se asigna al rol Administrador (acceso exclusivo, decisión del cliente).
-- Idempotente: ON CONFLICT DO NOTHING (la tabla tiene índices únicos).

INSERT INTO vistas (id, ruta, nombre, descripcion, icono, orden, es_menu, es_visible, requiere_auth, creado_en, actualizado_en)
VALUES (
  'bb000006-0000-0000-0000-000000000005',
  '/usuarios',
  'Usuarios',
  'Alta y gestión de usuarios con acceso a la app de escritorio',
  'UserCog',
  51,
  true,
  true,
  true,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO role_vistas (id, rol_id, vista_id, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar, asignado_en)
VALUES (
  'bb700006-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000001', -- Administrador (es_sistema)
  'bb000006-0000-0000-0000-000000000005',
  true, true, true, true, false,
  now()
)
ON CONFLICT (rol_id, vista_id) DO NOTHING;
