-- B7.1: catálogo de materiales de criba + FK en registros + estado de envío a inventario.

-- Renombrado de negocio: el material "Arena lavada" de la criba es el artículo
-- "Arena de río" del inventario (mismo producto, nombre homogéneo).
UPDATE articulos_inventario
SET nombre = 'Arena lavada', actualizado_en = NOW()
WHERE nombre = 'Arena de río' AND eliminado_en IS NULL;

-- CreateTable: catálogo (cada material enlaza a su artículo de inventario)
CREATE TABLE "materiales_criba" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "articulo_id" UUID,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "materiales_criba_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "materiales_criba_nombre_key" ON "materiales_criba"("nombre");

-- AddForeignKey
ALTER TABLE "materiales_criba" ADD CONSTRAINT "materiales_criba_articulo_id_fkey" FOREIGN KEY ("articulo_id") REFERENCES "articulos_inventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed: los 3 materiales de criba enlazados a su artículo por nombre.
INSERT INTO materiales_criba (id, nombre, articulo_id, creado_en, actualizado_en)
SELECT gen_random_uuid(), m.mat, a.id, NOW(), NOW()
FROM (VALUES ('Criba fina'), ('Criba gruesa'), ('Arena lavada')) AS m(mat)
JOIN articulos_inventario a ON lower(a.nombre) = lower(m.mat)
WHERE a.eliminado_en IS NULL;

-- AlterTable: registro de criba → material del catálogo + estado de envío.
ALTER TABLE "registros_criba" ADD COLUMN     "material_criba_id" UUID,
ADD COLUMN     "inventario_en" TIMESTAMPTZ;

-- CreateIndex
CREATE INDEX "registros_criba_material_criba_id_idx" ON "registros_criba"("material_criba_id");

-- CreateIndex
CREATE INDEX "registros_criba_inventario_en_idx" ON "registros_criba"("inventario_en");

-- AddForeignKey
ALTER TABLE "registros_criba" ADD CONSTRAINT "registros_criba_material_criba_id_fkey" FOREIGN KEY ("material_criba_id") REFERENCES "materiales_criba"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: cada registro enlaza al material del catálogo con su mismo nombre.
UPDATE registros_criba r
SET material_criba_id = mc.id
FROM materiales_criba mc
WHERE lower(mc.nombre) = lower(r.tipo_material)
  AND r.material_criba_id IS NULL;
