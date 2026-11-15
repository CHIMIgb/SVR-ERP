-- B5.1: notificaciones del ERP (una fila por evento, audiencia por rol).
-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TipoNotificacion') THEN
        CREATE TYPE "TipoNotificacion" AS ENUM ('ALERTA', 'INFO');
    END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "notificaciones" (
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
CREATE INDEX IF NOT EXISTS "notificaciones_audiencia_rol_id_idx" ON "notificaciones"("audiencia_rol_id");

-- CreateIndex (guarda por columna: 20261113040000 movió leido_en a la tabla puente, y una
-- re-ejecución contra el esquema final no debe intentar el índice sobre una columna que ya no está)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notificaciones' AND column_name = 'leido_en')
       AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'notificaciones_leido_en_idx') THEN
        CREATE INDEX "notificaciones_leido_en_idx" ON "notificaciones"("leido_en");
    END IF;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notificaciones_creado_en_idx" ON "notificaciones"("creado_en");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notificaciones_audiencia_rol_id_fkey') THEN
        ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_audiencia_rol_id_fkey" FOREIGN KEY ("audiencia_rol_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_notificaciones_creado_por') THEN
        ALTER TABLE "notificaciones" ADD CONSTRAINT "fk_notificaciones_creado_por" FOREIGN KEY ("creado_por") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;
