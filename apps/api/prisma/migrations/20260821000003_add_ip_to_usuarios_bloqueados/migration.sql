-- AlterTable: Agregar ip_address a usuarios_bloqueados para bloqueo por IP
-- user_id se hace nullable para permitir bloqueos que solo afectan una IP

-- 1. Hacer user_id nullable (PostgreSQL permite esto con ALTER COLUMN)
ALTER TABLE "usuarios_bloqueados"
  ALTER COLUMN "user_id" DROP NOT NULL;

-- 2. Agregar columna ip_address
ALTER TABLE "usuarios_bloqueados"
  ADD COLUMN "ip_address" TEXT;

-- 3. Crear índice para búsquedas por IP
CREATE INDEX "usuarios_bloqueados_ip_address_activo_idx"
  ON "usuarios_bloqueados"("ip_address", "activo");
