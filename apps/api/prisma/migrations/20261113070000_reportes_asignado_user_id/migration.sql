-- B5.12: usuario responsable del reporte (para notificar al cerrar aunque el
-- asignado sea texto libre).
-- AlterTable
ALTER TABLE "reportes_campo" ADD COLUMN     "asignado_user_id" UUID;

-- AddForeignKey
ALTER TABLE "reportes_campo" ADD CONSTRAINT "reportes_campo_asignado_user_id_fkey" FOREIGN KEY ("asignado_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
