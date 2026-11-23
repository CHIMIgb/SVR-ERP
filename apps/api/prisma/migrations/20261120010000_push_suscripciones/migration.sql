-- Suscripciones Web Push por dispositivo (fase a del plan de push:
-- docs-planes/docs-pwa/PLAN-NOTIFICACIONES-PUSH-PWA.md). Un endpoint por
-- dispositivo/permiso; al re-suscribir se reasigna al usuario y llaves nuevas.
-- IDEMPOTENTE (menor 1, PR #23): re-ejecución no truenan.

-- CreateTable
CREATE TABLE IF NOT EXISTS "push_suscripciones" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_suscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "push_suscripciones_endpoint_key" ON "push_suscripciones"("endpoint");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "push_suscripciones_user_id_idx" ON "push_suscripciones"("user_id");

-- AddForeignKey (no tiene IF NOT EXISTS nativo: bloque DO)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_push_suscripciones_usuario') THEN
        ALTER TABLE "push_suscripciones" ADD CONSTRAINT "fk_push_suscripciones_usuario" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;
END
$$;
