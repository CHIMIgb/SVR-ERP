-- Campos financieros administrativos del proyecto (fase 1 CRUD)
-- NOTA: los desgloses (nomina, combustible, mantenimiento, materiales) NO se
-- almacenan aqui; se calcularan por agregacion de sus modulos en fase final.
ALTER TABLE "proyectos" ADD COLUMN "ingreso_cobrado" DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE "proyectos" ADD COLUMN "gastado" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- Enum de auditoria para el CRUD de proyectos
ALTER TYPE "AuditAction" ADD VALUE 'PROYECTO_CREADO';
ALTER TYPE "AuditAction" ADD VALUE 'PROYECTO_ACTUALIZADO';
ALTER TYPE "AuditAction" ADD VALUE 'PROYECTO_ELIMINADO';
