-- B1.1: partidas de cotización (los renglones de los Word) + condiciones precargadas.
CREATE TABLE "cotizacion_items" (
    "id" UUID NOT NULL,
    "cotizacion_id" UUID NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(10,4) NOT NULL,
    "unidad" TEXT NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "importe" DECIMAL(12,2) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,
    "creado_por" UUID,
    "actualizado_por" UUID,

    CONSTRAINT "cotizacion_items_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "cotizaciones" ADD COLUMN     "condiciones" TEXT;

-- CreateIndex
CREATE INDEX "cotizacion_items_cotizacion_id_idx" ON "cotizacion_items"("cotizacion_id");

-- AddForeignKey
ALTER TABLE "cotizacion_items" ADD CONSTRAINT "cotizacion_items_cotizacion_id_fkey" FOREIGN KEY ("cotizacion_id") REFERENCES "cotizaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizacion_items" ADD CONSTRAINT "fk_cotizacion_items_actualizado_por" FOREIGN KEY ("actualizado_por") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cotizacion_items" ADD CONSTRAINT "fk_cotizacion_items_creado_por" FOREIGN KEY ("creado_por") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
