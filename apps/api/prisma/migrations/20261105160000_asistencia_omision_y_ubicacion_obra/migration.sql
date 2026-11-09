-- Omisión de asistencia (decisión del cliente, 2026-11-05):
--   checar tarde (entrada + 15 min) o no checar deja el día en OMISION; la administradora la resuelve como
--   FALTA o RETARDO con un motivo. Sin resolver a las 17:00 cuenta como falta (se calcula, no se guarda).
-- Registro de la ubicación de la obra (centro y radio de la geocerca) desde Asistencia.
-- Aditiva e idempotente: se puede correr más de una vez.

-- AlterEnum (PostgreSQL 12+: los valores nuevos no se usan en esta misma migración)
ALTER TYPE "EstadoAsistencia" ADD VALUE IF NOT EXISTS 'OMISION';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ASISTENCIA_OMISION_RESUELTA';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'OBRA_UBICACION_REGISTRADA';

-- Resolución de la omisión: motivo que dio el trabajador y quién/cuándo la resolvió.
ALTER TABLE "registros_asistencia" ADD COLUMN IF NOT EXISTS "omision_motivo" TEXT;
ALTER TABLE "registros_asistencia" ADD COLUMN IF NOT EXISTS "omision_resuelta_en" TIMESTAMPTZ;
ALTER TABLE "registros_asistencia" ADD COLUMN IF NOT EXISTS "omision_resuelta_por" UUID;
