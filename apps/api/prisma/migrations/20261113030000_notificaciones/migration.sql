-- B5.1: notificaciones del ERP (una fila por evento, audiencia por rol).
-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('ALERTA', 'INFO');

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" UUID NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL DEFAULT 'INFO',
    "titulo" VARCHAR(200) NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "referencia_tipo" TEXT,
    "referencia_id" UUID,
    "audiencia_rol_id" UUID,
    "leido_en" TIMESTAMPTZ,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" UUID,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notificaciones_audiencia_rol_id_idx" ON "notificaciones"("audiencia_rol_id");

-- CreateIndex
CREATE INDEX "notificaciones_leido_en_idx" ON "notificaciones"("leido_en");

-- CreateIndex
CREATE INDEX "notificaciones_creado_en_idx" ON "notificaciones"("creado_en");

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_audiencia_rol_id_fkey" FOREIGN KEY ("audiencia_rol_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "fk_notificaciones_creado_por" FOREIGN KEY ("creado_por") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
