-- SVR-ERP Unificación del catálogo: /ventas e /inventario usan articulos_inventario
-- Opción B (multi-medida/precio conservada vía articulos_precio).
-- Preserva la integridad: re-apunta ventas_items existentes, migra materiales a
-- articulos_inventario y sus precios a articulos_precio, y elimina las tablas
-- duplicadas materiales_venta / materiales_precio.
-- Idempotente (INSERT/UPDATE vs clave única o NOT EXISTS).

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. Categorías de inventario necesarias para los materiales del POS
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO categorias_inventario (id, nombre, activo, creado_en, actualizado_en)
SELECT v.id::uuid, v.nombre, true, NOW(), NOW()
FROM (VALUES
  ('d2000000-0000-0000-0000-000000000001', 'Áridos'),
  ('d2000000-0000-0000-0000-000000000002', 'Materiales'),
  ('d2000000-0000-0000-0000-000000000003', 'Acero')
) AS v(id, nombre)
WHERE NOT EXISTS (SELECT 1 FROM categorias_inventario c WHERE c.nombre = v.nombre);

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. Unidades de medida necesarias para las medidas de venta del POS
--    (m³ y m² ya existen en la BD; se crean tonelada, viaje, bulto, pieza, bolsa)
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO unidades_medida (id, codigo, nombre, activo, creado_en, actualizado_en)
SELECT v.id::uuid, v.codigo, v.codigo, true, NOW(), NOW()
FROM (VALUES
  ('d1000000-0000-0000-0000-000000000001', 'tonelada'),
  ('d1000000-0000-0000-0000-000000000002', 'viaje'),
  ('d1000000-0000-0000-0000-000000000003', 'bulto'),
  ('d1000000-0000-0000-0000-000000000004', 'pieza'),
  ('d1000000-0000-0000-0000-000000000005', 'bolsa')
) AS v(id, codigo)
WHERE NOT EXISTS (SELECT 1 FROM unidades_medida u WHERE u.codigo = v.codigo);

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. Crear tabla articulos_precio (precios del artículo por medida de venta)
--    (antes del DROP de materiales_precio)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "articulos_precio" (
    "id" UUID NOT NULL,
    "articulo_id" UUID NOT NULL,
    "medida" TEXT NOT NULL,
    "precio" DECIMAL(12,2) NOT NULL,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "articulos_precio_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "articulos_precio_articulo_id_medida_key"
    ON "articulos_precio"("articulo_id", "medida");
CREATE INDEX IF NOT EXISTS "articulos_precio_articulo_id_idx"
    ON "articulos_precio"("articulo_id");

-- FK a articulos_inventario (fuente única del catálogo)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'articulos_precio_articulo_id_fkey') THEN
    ALTER TABLE "articulos_precio" ADD CONSTRAINT "articulos_precio_articulo_id_fkey"
      FOREIGN KEY ("articulo_id") REFERENCES "articulos_inventario"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. Migrar los materiales del POS a articulos_inventario (mismo UUID)
--    Mapeo material → unidad base (unidad_id) y proveedor (CAT México).
--    precio_unitario = precio de la medida base del material.
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO articulos_inventario
  (id, codigo, nombre, stock, stock_minimo, precio_unitario, activo,
   creado_en, actualizado_en, categoria_id, proveedor_id, unidad_id)
SELECT
  m.id, m.sku, m.nombre, m.stock, 0,
  COALESCE((SELECT mp.precio FROM materiales_precio mp
            WHERE mp.material_id = m.id AND mp.medida = m.unidad_base), 0),
  true, m.creado_en, NOW(),
  (SELECT id FROM categorias_inventario WHERE nombre = m.categoria),
  '22d61153-008b-479f-bd4b-3df58f7f5b2f',  -- CAT México (proveedor activo)
  (SELECT id FROM unidades_medida WHERE codigo = m.unidad_base)
FROM materiales_venta m
WHERE NOT EXISTS (SELECT 1 FROM articulos_inventario a WHERE a.codigo = m.sku);

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. Migrar precios por medida a articulos_precio (mismo uuid del precio)
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO articulos_precio (id, articulo_id, medida, precio, creado_en)
SELECT mp.id, mp.material_id, mp.medida, mp.precio, mp.creado_en
FROM materiales_precio mp
WHERE NOT EXISTS (
  SELECT 1 FROM articulos_precio ap
  WHERE ap.articulo_id = mp.material_id AND ap.medida = mp.medida
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. Re-apuntar ventas_items existentes de material_id → articulo_id
--    (FK actual apunta a materiales_venta con ON DELETE RESTRICT)
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE "ventas_items" DROP CONSTRAINT IF EXISTS "ventas_items_material_id_fkey";
ALTER TABLE "ventas_items" RENAME COLUMN "material_id" TO "articulo_id";
DROP INDEX IF EXISTS "ventas_items_material_id_idx";
CREATE INDEX "ventas_items_articulo_id_idx" ON "ventas_items"("articulo_id");
ALTER TABLE "ventas_items" ADD CONSTRAINT "ventas_items_articulo_id_fkey"
  FOREIGN KEY ("articulo_id") REFERENCES "articulos_inventario"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. Eliminar tablas duplicadas del catálogo viejo del POS
-- ══════════════════════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS "materiales_precio";
DROP TABLE IF EXISTS "materiales_venta";
