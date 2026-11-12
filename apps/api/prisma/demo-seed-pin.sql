-- ══════════════════════════════════════════════════════════════════════════
-- PIN DE DESARROLLO para la PWA (solo DEV — NO correr en producción)
-- ══════════════════════════════════════════════════════════════════════════
-- Retirado de la migración 20261111150000 por la review del PR #18 (#1):
-- un PIN dentro de una migración queda como credencial pública en el repo
-- y `migrate deploy` lo ejecuta en cualquier BD.
--
-- EJECUCIÓN (todas las cuentas comparten UN PIN que tú eliges):
--   1. Genera el hash bcrypt del PIN (una sola vez):
--        cd apps/api
--        node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 12))" TuPinDev
--   2. Ejecuta el seed pasando el hash como variable:
--        psql -U postgres -d svr_erp -v pin_hash='<pegar-hash-aqui>' -f prisma/demo-seed-pin.sql
--   3. Entra a la PWA con: <numero-empleado> / TuPinDev
--
-- El PIN NO vive en el repo ni en el SQL: el hash llega por variable psql.
-- Idempotente: solo asigna PIN a usuarios ACTIVOS con numero_empleado y sin
-- PIN (nunca sobrescribe un PIN ya creado por su dueño). El costo 12 es el
-- mismo que usa PinService (SALT_ROUNDS).
-- ══════════════════════════════════════════════════════════════════════════

UPDATE "users"
SET "pin_hash" = :'pin_hash',
    "pin_cambiado_en" = NOW(),
    "intentos_pin" = 0
WHERE "numero_empleado" IS NOT NULL
  AND "pin_hash" IS NULL
  AND "activo" = true
  AND "eliminado_en" IS NULL;
