-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EstadoObra') THEN
    CREATE TYPE "EstadoObra" AS ENUM ('RECIEN_INICIADA', 'EN_PROCESO', 'FINALIZADA');
  END IF;
END $$;

-- AlterTable
ALTER TABLE "obras" ADD COLUMN IF NOT EXISTS "estado" "EstadoObra" NOT NULL DEFAULT 'EN_PROCESO';
