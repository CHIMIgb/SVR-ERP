-- B4.1: fecha límite de pago en la orden de compra (se propaga a la CxP).
-- AlterTable
ALTER TABLE "ordenes_compra" ADD COLUMN     "fecha_vencimiento" DATE;
