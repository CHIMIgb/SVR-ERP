-- B5+ : descartar notificaciones desde el centro de alertas (la fila queda en BD).
-- AlterTable
ALTER TABLE "notificaciones" ADD COLUMN     "descartada" BOOLEAN NOT NULL DEFAULT false;

-- Valor de auditoría (ADD VALUE, no recrea el tipo).
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'NOTIFICACION_DESCARTADA';
