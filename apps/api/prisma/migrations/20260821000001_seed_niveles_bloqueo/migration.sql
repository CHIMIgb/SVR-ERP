-- ============================================================
-- SVR-ERP: Seed de niveles de bloqueo escalonados
-- Ejecutar después del seed RBAC: 20260821000000_seed_rbac
-- ============================================================

-- Nivel 1: 1 minuto (primeras infracciones)
-- Nivel 2: 5 minutos (segundo escalamiento)
-- Nivel 3: 15 minutos (tercer escalamiento)
-- Nivel 4: 1 hora (cuarto escalamiento)
-- Nivel 5: 24 horas (nivel máximo - cuenta bloqueada)

INSERT INTO niveles_bloqueo (id, nivel, duracion_minutos, descripcion, activo, actualizado_en)
VALUES
  ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 1, 1,     'Primer nivel - 1 minuto',       true, NOW()),
  ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 2, 5,     'Segundo nivel - 5 minutos',     true, NOW()),
  ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 3, 15,    'Tercer nivel - 15 minutos',     true, NOW()),
  ('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', 4, 60,    'Cuarto nivel - 1 hora',         true, NOW()),
  ('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091', 5, 1440,  'Nivel máximo - 24 horas',        true, NOW())
ON CONFLICT (nivel) DO NOTHING;
