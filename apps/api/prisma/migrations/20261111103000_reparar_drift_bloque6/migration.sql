-- Reparación (bloque 6 review PR #17): la re-corrida manual de
-- 20261108153000 sobre una BD donde migraciones posteriores (20261108200000)
-- ya habían re-creado objetos, destruyó proyecto_id + su FK/índice.
-- Idempotente; sin tocar columnas aún existentes.
-- https://prisma.io — semántica de `migrate deploy`: cada migración corre 1 vez.

ALTER TABLE "reportes_campo" ADD COLUMN IF NOT EXISTS "proyecto_id" UUID;

CREATE INDEX IF NOT EXISTS "reportes_campo_proyecto_id_idx" ON "reportes_campo"("proyecto_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reportes_campo_proyecto_id_fkey'
  ) THEN
    ALTER TABLE "reportes_campo" ADD CONSTRAINT "reportes_campo_proyecto_id_fkey"
      FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
