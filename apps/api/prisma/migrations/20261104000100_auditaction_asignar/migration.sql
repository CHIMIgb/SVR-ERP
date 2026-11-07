-- Enum de auditoría: acción de asignación de reporte (aditivo, sin datos alterados)
-- Idempotente (sugerencia review PR #15): un re-run no rompe.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'AuditAction' AND e.enumlabel = 'REPORTE_ASIGNADO'
  ) THEN
    ALTER TYPE "AuditAction" ADD VALUE 'REPORTE_ASIGNADO';
  END IF;
END $$;
