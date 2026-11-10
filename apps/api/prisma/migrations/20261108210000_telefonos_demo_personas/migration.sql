-- Teléfonos demo para los usuarios de plantilla (la columna personas.telefono ya existe;
-- solo se rellenan los que no tienen — detalle "Levantó" de /reportes).
UPDATE personas p SET telefono = f.tel
FROM (VALUES
  ('e1000000-0000-0000-0000-0000000000a1', '55 1234 0001'),
  ('e1000000-0000-0000-0000-0000000000a2', '55 1234 0002'),
  ('e1000000-0000-0000-0000-0000000000a3', '55 1234 0003'),
  ('e1000000-0000-0000-0000-0000000000a4', '55 1234 0004'),
  ('e1000000-0000-0000-0000-0000000000a5', '55 1234 0005')
) AS f(persona_id, tel)
WHERE p.id = f.persona_id::uuid AND p.telefono IS NULL;
