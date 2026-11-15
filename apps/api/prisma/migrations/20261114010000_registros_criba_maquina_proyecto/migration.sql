-- B6.1: FK maquina_id / proyecto_id en registros_criba (opcionales).
-- AlterTable
ALTER TABLE "registros_criba" ADD COLUMN IF NOT EXISTS "maquina_id" UUID;
ALTER TABLE "registros_criba" ADD COLUMN IF NOT EXISTS "proyecto_id" UUID;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "registros_criba_maquina_id_idx" ON "registros_criba"("maquina_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "registros_criba_proyecto_id_idx" ON "registros_criba"("proyecto_id");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'registros_criba_maquina_id_fkey') THEN
        ALTER TABLE "registros_criba" ADD CONSTRAINT "registros_criba_maquina_id_fkey" FOREIGN KEY ("maquina_id") REFERENCES "maquinas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'registros_criba_proyecto_id_fkey') THEN
        ALTER TABLE "registros_criba" ADD CONSTRAINT "registros_criba_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
