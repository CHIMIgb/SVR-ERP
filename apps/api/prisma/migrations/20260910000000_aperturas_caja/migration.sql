-- Apertura del turno de caja (flujo POST /ventas/corte)

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'APERTURA_CAJA_REGISTRADA';

-- CreateTable
CREATE TABLE "aperturas_caja" (
    "id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "cajero" TEXT NOT NULL,
    "fondo_inicial" DECIMAL(12,2) NOT NULL,
    "abierta_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,
    "creado_por" UUID,

    CONSTRAINT "aperturas_caja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aperturas_caja_fecha_key" ON "aperturas_caja"("fecha");

-- CreateIndex
CREATE INDEX "aperturas_caja_fecha_idx" ON "aperturas_caja"("fecha");
