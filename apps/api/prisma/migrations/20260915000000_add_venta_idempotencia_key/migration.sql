-- Agrega clave de idempotencia a ventas para evitar duplicados por doble clic/reintento de red

-- AlterTable
ALTER TABLE "ventas" ADD COLUMN "idempotencia_key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ventas_idempotencia_key_key" ON "ventas"("idempotencia_key");
