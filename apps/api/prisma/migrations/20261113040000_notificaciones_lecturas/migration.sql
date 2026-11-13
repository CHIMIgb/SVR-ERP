-- B5.6 (Opción A): estado de leído/descartado POR USUARIO en tabla puente.
-- DropIndex
DROP INDEX "notificaciones_leido_en_idx";

-- AlterTable
ALTER TABLE "notificaciones" DROP COLUMN "descartada",
DROP COLUMN "leido_en";

-- CreateTable
CREATE TABLE "notificaciones_lecturas" (
    "notificacion_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "leido_en" TIMESTAMPTZ,
    "descartada" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_lecturas_pkey" PRIMARY KEY ("notificacion_id","user_id")
);

-- CreateIndex
CREATE INDEX "notificaciones_lecturas_user_id_idx" ON "notificaciones_lecturas"("user_id");

-- AddForeignKey
ALTER TABLE "notificaciones_lecturas" ADD CONSTRAINT "notificaciones_lecturas_notificacion_id_fkey" FOREIGN KEY ("notificacion_id") REFERENCES "notificaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones_lecturas" ADD CONSTRAINT "fk_notificaciones_lecturas_usuario" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
