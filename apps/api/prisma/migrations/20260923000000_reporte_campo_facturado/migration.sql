-- AlterEnum
ALTER TYPE "EstadoReporteCampo" ADD VALUE 'FACTURADO';
-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'REPORTE_CAMPO_FACTURADO';
-- AlterTable
ALTER TABLE "reportes_campo" ADD COLUMN     "cliente_id" UUID,
ADD COLUMN     "monto_servicio" DECIMAL(14,2),
ADD COLUMN     "proyecto_id" UUID;
-- CreateIndex
CREATE INDEX "reportes_campo_cliente_id_idx" ON "reportes_campo"("cliente_id");
-- CreateIndex
CREATE INDEX "reportes_campo_proyecto_id_idx" ON "reportes_campo"("proyecto_id");
-- AddForeignKey
ALTER TABLE "reportes_campo" ADD CONSTRAINT "fk_reportes_campo_cliente" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "reportes_campo" ADD CONSTRAINT "fk_reportes_campo_proyecto" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE SET NULL ON UPDATE CASCADE;