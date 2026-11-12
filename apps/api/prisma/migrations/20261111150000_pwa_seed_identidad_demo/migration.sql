-- Seed de identidad demo para la PWA (plan §8.6-4, paso 4):
-- numero_empleado para los 8 usuarios demo.
-- IDEMPOTENTE y NO destructivo: solo llena campos NULL (nunca sobrescribe
-- numero_empleado ya asignado). En servidores sin usuarios demo = UPDATE 0.
-- Ejemplos del spec §6.4: ADM-01, RES-014, TEC-007, COB-003, TRA-0142.
--
-- El PIN de desarrollo NO vive aquí (review PR #18 #1: un PIN dentro de una
-- migración queda como credencial pública en el repo y `migrate deploy` lo
-- ejecuta en cualquier BD). Se asigna a mano solo en local con
-- prisma/demo-seed-pin.sql — el hash llega por variable, el valor nunca
-- se escribe en el repo.

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
