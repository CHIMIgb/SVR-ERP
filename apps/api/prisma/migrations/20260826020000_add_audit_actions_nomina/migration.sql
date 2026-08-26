-- Agrega valores de auditoria para el módulo de Nómina (RRHH): ajustes
-- manuales (bono/descuento/préstamo) y marcado de pago por trabajador o periodo.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'NOMINA_AJUSTE_APLICADO';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'NOMINA_PAGO_MARCADO';
