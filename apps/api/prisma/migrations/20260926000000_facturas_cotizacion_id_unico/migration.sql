-- Blocker #3 PR #11: una cotización solo puede tener UNA factura.
-- Se reemplaza el índice no único por uno único. PostgreSQL permite
-- múltiples NULLs en índices únicos, así que las facturas normales
-- (sin cotización origen) no se ven afectadas.

DROP INDEX IF EXISTS "facturas_cotizacion_id_idx";

CREATE UNIQUE INDEX "facturas_cotizacion_id_key" ON "facturas"("cotizacion_id");