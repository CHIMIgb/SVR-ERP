-- Corrección de idempotencia de la conciliación bancaria (Blocker #1 de la review del PR #11).
--
-- El @@unique([cuenta_id, fecha, descripcion, deposito, retiro]) NUNCA disparaba:
-- deposito y retiro son mutuamente excluyentes (uno siempre NULL) y PostgreSQL trata
-- cada NULL como distinto dentro de un índice único. La única protección era un
-- chequeo leer-antes-de-insertar en cargarLote (TOCTOU).
--
-- Remedio:
-- 1. Dedupe de filas idénticas ya existentes (se conserva la más reciente por grupo).
-- 2. Índice único de expresión con COALESCE(0) como centinela: dos filas idénticas
--    ahora colisionan de verdad y el INSERT ... ON CONFLICT DO NOTHING generado por
--    createMany(skipDuplicates: true) las absorbe de forma atómica, cerrando la
--    condición de carrera sin cambios de código.

-- 1) Limpiar duplicados (conserva 1 fila por clave: la más reciente por id)
WITH dups AS (
  SELECT id, row_number() OVER (
    PARTITION BY cuenta_id, fecha, descripcion, COALESCE(deposito, 0), COALESCE(retiro, 0)
    ORDER BY creado_en DESC, id DESC
  ) AS rn
  FROM movimientos_bancarios
)
DELETE FROM movimientos_bancarios
WHERE id IN (SELECT id FROM dups WHERE rn > 1);

-- 2) Reemplazar el índice único roto
DROP INDEX IF EXISTS "movimientos_bancarios_cuenta_id_fecha_descripcion_deposito__key";

CREATE UNIQUE INDEX "movimientos_bancarios_dedupe_key"
ON "movimientos_bancarios" ("cuenta_id", "fecha", "descripcion", COALESCE("deposito", 0), COALESCE("retiro", 0));