-- B1.1: partidas de cotización (los renglones de los Word) + condiciones precargadas.
CREATE TABLE IF NOT EXISTS "cotizacion_items" (
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
ALTER TABLE "cotizaciones" ADD COLUMN IF NOT EXISTS "condiciones" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cotizacion_items_cotizacion_id_idx" ON "cotizacion_items"("cotizacion_id");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cotizacion_items_cotizacion_id_fkey') THEN
        ALTER TABLE "cotizacion_items" ADD CONSTRAINT "cotizacion_items_cotizacion_id_fkey" FOREIGN KEY ("cotizacion_id") REFERENCES "cotizaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_cotizacion_items_actualizado_por') THEN
        ALTER TABLE "cotizacion_items" ADD CONSTRAINT "fk_cotizacion_items_actualizado_por" FOREIGN KEY ("actualizado_por") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_cotizacion_items_creado_por') THEN
        ALTER TABLE "cotizacion_items" ADD CONSTRAINT "fk_cotizacion_items_creado_por" FOREIGN KEY ("creado_por") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;
