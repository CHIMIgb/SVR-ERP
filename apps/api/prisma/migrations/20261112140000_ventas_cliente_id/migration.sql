-- B3.1: cliente del catálogo en las ventas del POS (null = Público en general).
-- AlterTable
ALTER TABLE "ventas" ADD COLUMN     "cliente_id" UUID;

-- CreateIndex
CREATE INDEX "ventas_cliente_id_idx" ON "ventas"("cliente_id");

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
