-- PWA móvil, rebanada 5: "Flota y obras" del rol Técnico (GET /maquinas/campo).
-- Permiso propio en vez de maquinaria.flota:ver: ese abre toda la API de flota (costos, horómetro,
-- combustible, mantenimiento) y el técnico solo necesita lo de la pantalla: máquina, estado, obra de hoy,
-- operador o chofer y última posición GPS. La vista /m/flota-obras ya la tiene el rol Tecnico
-- (20261111130000_pwa_vistas_rbac + 20261112000000_roles_5_puestos_torre): aquí solo va el permiso de la API.
-- Aditiva e idempotente: correrla dos veces no duplica nada.

-- ON CONFLICT con objetivo (revisión 2026-11-24): si ya existe la terna, no hace nada y abajo se toma la
-- existente; si el UUID chocara con OTRO permiso, ahora truena en vez de pasar callado.
INSERT INTO permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en)
VALUES
  ('aa00001f-0000-0000-0000-000000000001', 'maquinaria', 'flota_campo', 'ver',
   'Ver la flota en campo: máquina, obra de hoy, operador y ubicación (PWA)', true, NOW(), NOW())
ON CONFLICT (modulo, recurso, accion) DO NOTHING;

-- El técnico (rol consolidado "Tecnico") y el administrador, igual que mi_equipo va a Residente y Administrador.
INSERT INTO role_permissions (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.modulo = 'maquinaria' AND p.recurso = 'flota_campo' AND p.accion = 'ver'
WHERE r.eliminado_en IS NULL
  AND r.activo = true
  AND r.nombre IN ('Tecnico', 'Administrador')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.rol_id = r.id AND rp.permiso_id = p.id
  );

-- La asignación va por nombre de rol: si en esta BD el rol se llama distinto ("Técnico" con acento, con
-- espacios...), el INSERT de arriba asigna 0 filas sin error y la pestaña daría 403. Aquí se avisa.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    JOIN roles r ON r.id = rp.rol_id
    JOIN permissions p ON p.id = rp.permiso_id
    WHERE r.nombre = 'Tecnico' AND r.activo AND r.eliminado_en IS NULL
      AND p.modulo = 'maquinaria' AND p.recurso = 'flota_campo' AND p.accion = 'ver'
  ) THEN
    RAISE WARNING 'maquinaria.flota_campo:ver NO quedó asignado al rol Tecnico (¿el rol tiene otro nombre en esta BD?). La pestaña Flota/Obras del técnico daría 403.';
  END IF;
END $$;
