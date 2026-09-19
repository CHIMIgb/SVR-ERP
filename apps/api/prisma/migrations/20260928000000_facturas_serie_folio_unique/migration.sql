-- Blocker #4: dos facturas no pueden compartir serie + folio.
--
-- Limpieza legacy: algunas BD traen facturaciones concurrentes previas con
-- serie + folio repetidos y CxC ya emitidas (no se pueden borrar). Se
-- reasigna un folio único a los duplicados extra (se conserva el más antiguo
-- del grupo con su folio original) usando el máximo folio numérico actual.
-- En BD limpias el UPDATE no afecta ninguna fila.

WITH max_folio AS (
  SELECT COALESCE(MAX(NULLIF(regexp_replace(folio, '\D', '', 'g'), '')::bigint), 0) AS m
  FROM facturas
  WHERE folio IS NOT NULL AND folio ~ '^\d+$'
),
dups AS (
  SELECT id, row_number() OVER (
    PARTITION BY serie, folio
    ORDER BY creado_en ASC, id ASC
  ) AS rn,
  row_number() OVER (
    ORDER BY serie, folio, creado_en ASC, id ASC
  ) AS seq
  FROM facturas
  WHERE serie IS NOT NULL AND folio IS NOT NULL
)
UPDATE facturas f
SET folio = LPAD(((SELECT m FROM max_folio) + dups.seq)::text, 6, '0')
FROM dups
WHERE f.id = dups.id AND dups.rn > 1;

CREATE UNIQUE INDEX "facturas_serie_folio_key"
ON "facturas" ("serie", "folio");