-- Idempotencia de la cola PWA: un reenvío con la misma key no duplica el reporte.
-- Patrón de ventas (20260915000000_add_venta_idempotencia_key).
-- IDEMPOTENTE (menor 1, PR #23): si se re-ejecuta en el servidor, no truenan.

-- AlterTable
ALTER TABLE "reportes_campo" ADD COLUMN IF NOT EXISTS     "idempotencia_key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "reportes_campo_idempotencia_key_key" ON "reportes_campo"("idempotencia_key");
