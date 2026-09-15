-- SVR-ERP: Fase 4 — proyecto en CxC + bitácora → CxC
-- Aditiva: cuentas_por_cobrar.proyecto_id + audit BITACORA_FACTURADA.

-- AlterEnum (agregado al final del enum, PostgreSQL 12+)
ALTER TYPE "AuditAction" ADD VALUE 'BITACORA_FACTURADA';

-- AlterTable
ALTER TABLE "cuentas_por_cobrar" ADD COLUMN     "proyecto_id" UUID;

-- CreateIndex
CREATE INDEX "cuentas_por_cobrar_proyecto_id_estado_idx" ON "cuentas_por_cobrar"("proyecto_id", "estado");

-- AddForeignKey
ALTER TABLE "cuentas_por_cobrar" ADD CONSTRAINT "cuentas_por_cobrar_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE SET NULL ON UPDATE CASCADE;