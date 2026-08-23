-- AlterEnum: Agregar valores de auditoría para bloqueos
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'USUARIO_BLOQUEADO';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'IP_BLOQUEADA';
