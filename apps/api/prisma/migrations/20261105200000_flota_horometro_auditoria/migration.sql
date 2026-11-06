-- Auditoría de Flota (máquinas, despachos, checklists) y de Horómetro.
--   Esos módulos no escribían en registro_auditoria: AGENTS.md pide auditoría de éxito y de fallo de negocio
--   en todo módulo que se toca.
-- Aditiva e idempotente: se puede correr más de una vez.

-- AlterEnum (PostgreSQL 12+: los valores nuevos no se usan en esta misma migración)
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'HOROMETRO_REGISTRADO';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MAQUINA_CREADA';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DESPACHO_CREADO';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'CHECKLIST_REGISTRADO';
