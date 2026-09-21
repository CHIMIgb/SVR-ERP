-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'PROVEEDOR_CONSULTADO';

-- AlterTable: RFC único en proveedores (nullable → múltiples NULLs permitidos)
CREATE UNIQUE INDEX "proveedores_rfc_key" ON "proveedores"("rfc");