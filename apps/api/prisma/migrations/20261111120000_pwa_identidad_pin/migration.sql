-- Identidad PWA (plan §8.1-1): número de empleado único + campos de PIN.
-- Sin valores de datos: el numero_empleado lo genera el alta (transacción con
-- consecutivo por prefijo); los PIN se hashean al volar (argon2id/bcrypt).
-- Idempotente: IF NOT EXISTS en columnas e índice.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "numero_empleado" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "users_numero_empleado_key" ON "users"("numero_empleado");
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pin_hash" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pin_temporal_hasta" TIMESTAMPTZ;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pin_cambiado_en" TIMESTAMPTZ;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pin_historial" JSONB DEFAULT '[]';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "intentos_pin" INTEGER DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cuenta_bloqueada_en" TIMESTAMPTZ;
