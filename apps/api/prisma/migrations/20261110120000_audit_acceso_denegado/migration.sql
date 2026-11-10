-- Acción de auditoría para accesos directos denegados por ámbito (review PR #17):
-- findOne/aceptar/cambiarEstado/comentar/adjuntar/remove registran FAIL con
-- este action cuando el reporte queda fuera del árbol del usuario.
-- Idempotente: ADD VALUE con guarda IF NOT EXISTS.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'REPORTE_ACCESO_DENEGADO';
