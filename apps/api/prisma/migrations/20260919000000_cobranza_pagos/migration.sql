-- SVR-ERP: Módulo cobranza — cuentas por cobrar y cobros
-- Aditiva: pagos.cuenta_por_cobrar_id + acciones de auditoría del módulo.

-- AlterEnum (PostgreSQL 12+: múltiples ADD VALUE en la misma transacción)
ALTER TYPE "AuditAction" ADD VALUE 'CXC_CREADA';
ALTER TYPE "AuditAction" ADD VALUE 'CXC_ACTUALIZADA';
ALTER TYPE "AuditAction" ADD VALUE 'CXC_CONSULTADA';
ALTER TYPE "AuditAction" ADD VALUE 'COBRO_REGISTRADO';

-- AlterTable
ALTER TABLE "pagos" ADD COLUMN     "cuenta_por_cobrar_id" UUID;

-- CreateIndex
CREATE INDEX "pagos_cuenta_por_cobrar_id_idx" ON "pagos"("cuenta_por_cobrar_id");

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_cuenta_por_cobrar_id_fkey" FOREIGN KEY ("cuenta_por_cobrar_id") REFERENCES "cuentas_por_cobrar"("id") ON DELETE SET NULL ON UPDATE CASCADE;