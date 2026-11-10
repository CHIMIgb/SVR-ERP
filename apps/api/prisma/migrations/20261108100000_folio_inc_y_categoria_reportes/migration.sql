-- /reportes: folio único uniforme INC0001 (renumera los RC006..RC021 del demo
-- preservando el orden) + categoría responsable (torre que atiende el reporte:
-- MECANICO/SOLDADOR/DIESEL/MANTENIMIENTO/ADMINISTRATIVO/RESIDENTE, según la
-- nueva-info de la PWA: técnicos = mecánico+soldador+diésel+mantenimiento).

-- 1. Renumerar códigos RCxxx → INC0001.. por su correlativo actual
UPDATE reportes_campo r
SET codigo = renumerado.nuevo
FROM (
  SELECT id, 'INC' || LPAD(ROW_NUMBER() OVER (ORDER BY substring(codigo, '[0-9]+')::int)::text, 4, '0') AS nuevo
  FROM reportes_campo
  WHERE codigo IS NOT NULL
) AS renumerado
WHERE r.id = renumerado.id;

-- 2. Enum de categoría responsable + columna
CREATE TYPE "CategoriaReporte" AS ENUM ('MECANICO', 'SOLDADOR', 'DIESEL', 'MANTENIMIENTO', 'ADMINISTRATIVO', 'RESIDENTE');
ALTER TABLE "reportes_campo" ADD COLUMN "categoria" "CategoriaReporte";

-- 3. Backfill best-effort del demo (el resto queda NULL → "—" en el UI)
UPDATE reportes_campo SET categoria = 'MECANICO'      WHERE tipo = 'MECANICO' AND categoria IS NULL;
UPDATE reportes_campo SET categoria = 'ADMINISTRATIVO' WHERE tipo = 'ADMINISTRATIVO' AND categoria IS NULL;
UPDATE reportes_campo SET categoria = 'DIESEL'        WHERE tipo = 'PIPERO' AND categoria IS NULL;
UPDATE reportes_campo SET categoria = 'RESIDENTE'     WHERE tipo = 'INGENIERO' AND categoria IS NULL;
