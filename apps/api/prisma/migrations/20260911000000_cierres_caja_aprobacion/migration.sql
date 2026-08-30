-- Aprobación de cierres de caja por el Administrador

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'CIERRE_CAJA_APROBADO';
ALTER TYPE "AuditAction" ADD VALUE 'CIERRE_CAJA_RECHAZADO';

-- AlterTable
ALTER TABLE "cierres_caja"
    ADD COLUMN "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    ADD COLUMN "aprobador_id" UUID,
    ADD COLUMN "motivo_rechazo" TEXT;
