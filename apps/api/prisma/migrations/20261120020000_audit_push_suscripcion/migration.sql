-- Auditoría del Web Push (menor 3 PR #23): suscripción alta/baja quedan
-- registradas en registro_auditoria como cualquier mutación del API.
-- PG 12+: ADD VALUE es válido en transacción mientras no se USE el valor en ella.

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'PWA_PUSH_SUSCRITO';

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'PWA_PUSH_BAJA';
