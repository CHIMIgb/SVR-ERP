-- B3.1: cliente del catálogo en las ventas del POS (null = Público en general).
-- AlterTable
ALTER TABLE "ventas" ADD COLUMN IF NOT EXISTS "cliente_id" UUID;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ventas_cliente_id_idx" ON "ventas"("cliente_id");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ventas_cliente_id_fkey') THEN
        ALTER TABLE "ventas" ADD CONSTRAINT "ventas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
