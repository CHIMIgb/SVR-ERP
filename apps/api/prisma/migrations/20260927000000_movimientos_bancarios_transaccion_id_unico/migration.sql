-- Guard real anti doble conciliación: una transacción solo puede enlazarse
-- a UN movimiento. Postgres trata los NULLs como distintos, así que los
-- movimientos sin conciliar (transaccion_id NULL) no colisionan y al
-- desconciliar (transaccion_id = NULL) la transacción vuelve a estar libre.
DROP INDEX "movimientos_bancarios_transaccion_id_idx";

CREATE UNIQUE INDEX "movimientos_bancarios_transaccion_id_key" ON "movimientos_bancarios"("transaccion_id");
