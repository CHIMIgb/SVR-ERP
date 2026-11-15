-- B5.12: usuario responsable del reporte (para notificar al cerrar aunque el
-- asignado sea texto libre).
-- AlterTable
ALTER TABLE "reportes_campo" ADD COLUMN IF NOT EXISTS "asignado_user_id" UUID;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reportes_campo_asignado_user_id_fkey') THEN
        ALTER TABLE "reportes_campo" ADD CONSTRAINT "reportes_campo_asignado_user_id_fkey" FOREIGN KEY ("asignado_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
