-- Seed de identidad demo para la PWA (plan §8.6-4, paso 4):
-- numero_empleado + PIN de desarrollo para los 8 usuarios demo.
-- IDEMPOTENTE y NO destructivo: solo llena campos NULL (nunca sobrescribe
-- numero_empleado ni pin_hash ya asignados). El PIN demo es para DEV —
-- documentado en README; en producción el PIN lo define cada quien.
-- Ejemplos del spec §6.4: ADM-01, RES-014, TEC-007, COB-003, TRA-0142.

-- 1. numero_empleado (por email demo; en servidores sin demo = UPDATE 0)
UPDATE "users" SET "numero_empleado" = 'ADM-01'
WHERE "email" = 'admin@svr-constructora.com' AND "numero_empleado" IS NULL;

UPDATE "users" SET "numero_empleado" = 'RES-014'
WHERE "email" = 'residente@svr-constructora.com' AND "numero_empleado" IS NULL;

UPDATE "users" SET "numero_empleado" = 'TEC-007'
WHERE "email" = 'tecnico@svr-constructora.com' AND "numero_empleado" IS NULL;

UPDATE "users" SET "numero_empleado" = 'TEC-008'
WHERE "email" = 'soldador@svr-constructora.com' AND "numero_empleado" IS NULL;

UPDATE "users" SET "numero_empleado" = 'TEC-009'
WHERE "email" = 'diesel@svr-constructora.com' AND "numero_empleado" IS NULL;

UPDATE "users" SET "numero_empleado" = 'TEC-010'
WHERE "email" = 'mantenimiento@svr-constructora.com' AND "numero_empleado" IS NULL;

UPDATE "users" SET "numero_empleado" = 'COB-003'
WHERE "email" = 'cobrador@svr-constructora.com' AND "numero_empleado" IS NULL;

UPDATE "users" SET "numero_empleado" = 'TRA-0142'
WHERE "email" = 'trabajador@svr-constructora.com' AND "numero_empleado" IS NULL;

-- 2. PIN de desarrollo (SVR26DEM, bcrypt cost 12) solo si NO tiene PIN
--    y ya tiene numero_empleado (junto a su numero, no huérfano)
UPDATE "users"
SET "pin_hash" = '$2b$12$0a.huPkMZZmDrkC6Fc/MHOE/xOEEyttspAqtAk2TSfyQBiDgdRR/S',
    "pin_cambiado_en" = NOW(),
    "intentos_pin" = 0
WHERE "numero_empleado" IS NOT NULL AND "pin_hash" IS NULL;
