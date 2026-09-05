-- SVR-ERP: Módulo proveedores — órdenes de compra, abonos y cuentas por pagar
-- Aditiva: no toca tablas existentes salvo ADD COLUMN categoria en proveedores.

-- CreateEnum
CREATE TYPE "EstadoOrdenCompra" AS ENUM ('PENDIENTE', 'APROBADA', 'RECIBIDA', 'CANCELADA');

-- AlterEnum (PostgreSQL 12+: múltiples ADD VALUE en la misma transacción)
ALTER TYPE "AuditAction" ADD VALUE 'PROVEEDOR_CREADO';
ALTER TYPE "AuditAction" ADD VALUE 'PROVEEDOR_ACTUALIZADO';
ALTER TYPE "AuditAction" ADD VALUE 'PROVEEDOR_ELIMINADO';
ALTER TYPE "AuditAction" ADD VALUE 'ORDEN_COMPRA_CREADA';
ALTER TYPE "AuditAction" ADD VALUE 'ORDEN_COMPRA_ACTUALIZADA';
ALTER TYPE "AuditAction" ADD VALUE 'ORDEN_COMPRA_ELIMINADA';
ALTER TYPE "AuditAction" ADD VALUE 'ORDEN_COMPRA_ESTADO_CAMBIADO';
ALTER TYPE "AuditAction" ADD VALUE 'PAGO_PROVEEDOR_REGISTRADO';

-- AlterTable
ALTER TABLE "proveedores" ADD COLUMN     "categoria" TEXT DEFAULT 'Otros';

-- CreateTable
CREATE TABLE "cuentas_por_pagar" (
    "id" UUID NOT NULL,
    "proveedor_id" UUID NOT NULL,
    "orden_compra_id" UUID NOT NULL,
    "monto" DECIMAL(14,2) NOT NULL,
    "monto_pagado" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "fecha_vencimiento" DATE,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "cuentas_por_pagar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_compra" (
    "id" UUID NOT NULL,
    "folio" TEXT NOT NULL,
    "proveedor_id" UUID NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(14,2) NOT NULL,
    "pagado" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "fecha" DATE NOT NULL,
    "estado" "EstadoOrdenCompra" NOT NULL DEFAULT 'PENDIENTE',
    "motivo_cancelacion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,
    "creado_por" UUID,
    "actualizado_por" UUID,
    "eliminado_en" TIMESTAMPTZ,

    CONSTRAINT "ordenes_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_proveedor" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "proveedor_id" UUID NOT NULL,
    "orden_compra_id" UUID NOT NULL,
    "monto" DECIMAL(14,2) NOT NULL,
    "fecha_pago" DATE NOT NULL,
    "metodo_pago" TEXT NOT NULL DEFAULT 'EFECTIVO',
    "referencia" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" UUID,
    "eliminado_en" TIMESTAMPTZ,

    CONSTRAINT "pagos_proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_por_pagar_orden_compra_id_key" ON "cuentas_por_pagar"("orden_compra_id");

-- CreateIndex
CREATE INDEX "cuentas_por_pagar_proveedor_id_estado_idx" ON "cuentas_por_pagar"("proveedor_id", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_compra_folio_key" ON "ordenes_compra"("folio");

-- CreateIndex
CREATE INDEX "ordenes_compra_proveedor_id_estado_idx" ON "ordenes_compra"("proveedor_id", "estado");

-- CreateIndex
CREATE INDEX "ordenes_compra_fecha_idx" ON "ordenes_compra"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_proveedor_codigo_key" ON "pagos_proveedor"("codigo");

-- CreateIndex
CREATE INDEX "pagos_proveedor_proveedor_id_fecha_pago_idx" ON "pagos_proveedor"("proveedor_id", "fecha_pago");

-- AddForeignKey
ALTER TABLE "cuentas_por_pagar" ADD CONSTRAINT "cuentas_por_pagar_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "ordenes_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_por_pagar" ADD CONSTRAINT "cuentas_por_pagar_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "fk_ordenes_compra_actualizado_por" FOREIGN KEY ("actualizado_por") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "fk_ordenes_compra_creado_por" FOREIGN KEY ("creado_por") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pagos_proveedor" ADD CONSTRAINT "pagos_proveedor_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "ordenes_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_proveedor" ADD CONSTRAINT "pagos_proveedor_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_proveedor" ADD CONSTRAINT "fk_pagos_proveedor_creado_por" FOREIGN KEY ("creado_por") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;