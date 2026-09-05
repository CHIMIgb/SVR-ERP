-- Acciones de auditoría para el módulo de cotizaciones
ALTER TYPE "AuditAction" ADD VALUE 'COTIZACION_CREADA';
ALTER TYPE "AuditAction" ADD VALUE 'COTIZACION_ACTUALIZADA';
ALTER TYPE "AuditAction" ADD VALUE 'COTIZACION_ELIMINADA';
