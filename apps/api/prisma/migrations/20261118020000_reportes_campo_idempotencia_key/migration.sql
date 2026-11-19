-- Idempotencia de la cola PWA: un reenvío con la misma key no duplica el reporte.
-- Patrón de ventas (20260915000000_add_venta_idempotencia_key).

-- AlterTable
ALTER TABLE "reportes_campo" ADD COLUMN     "idempotencia_key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "reportes_campo_idempotencia_key_key" ON "reportes_campo"("idempotencia_key");
