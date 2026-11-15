-- B5.6 (Opción A): estado de leído/descartado POR USUARIO en tabla puente.
-- DropIndex
DROP INDEX IF EXISTS "notificaciones_leido_en_idx";

-- AlterTable (idempotente: las columnas solo se quitan si existen, una por una)
ALTER TABLE "notificaciones" DROP COLUMN IF EXISTS "descartada";
ALTER TABLE "notificaciones" DROP COLUMN IF EXISTS "leido_en";

-- CreateTable
CREATE TABLE IF NOT EXISTS "notificaciones_lecturas" (
    "notificacion_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "leido_en" TIMESTAMPTZ,
    "descartada" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_lecturas_pkey" PRIMARY KEY ("notificacion_id","user_id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notificaciones_lecturas_user_id_idx" ON "notificaciones_lecturas"("user_id");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notificaciones_lecturas_notificacion_id_fkey') THEN
        ALTER TABLE "notificaciones_lecturas" ADD CONSTRAINT "notificaciones_lecturas_notificacion_id_fkey" FOREIGN KEY ("notificacion_id") REFERENCES "notificaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_notificaciones_lecturas_usuario') THEN
        ALTER TABLE "notificaciones_lecturas" ADD CONSTRAINT "fk_notificaciones_lecturas_usuario" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;
END $$;
