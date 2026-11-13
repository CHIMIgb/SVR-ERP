-- B5.11: cuenta de acceso del trabajador (FK única, nullable) + backfill por
-- nombre exacto (solo coincidencias ÚNICAS; ambigüedades quedan sin enlazar).
-- AlterTable
ALTER TABLE "trabajadores" ADD COLUMN     "usuario_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "trabajadores_usuario_id_key" ON "trabajadores"("usuario_id");

-- AddForeignKey
ALTER TABLE "trabajadores" ADD CONSTRAINT "fk_trabajadores_usuario" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill único: trabajador.nombre == persona (nombre + apellidos) de la
-- cuenta. Solo si el nombre del trabajador es ÚNICO y la persona candidata
-- es ÚNICA (duplicados/ambigüedades quedan sin enlazar a propósito).
UPDATE "trabajadores" t
SET "usuario_id" = u.id
FROM users u
JOIN personas p ON p.id = u.persona_id
WHERE u.persona_id IS NOT NULL
  AND lower(concat_ws(' ', p.nombre, p.apellido_paterno, p.apellido_materno)) = lower(trim(t.nombre))
  AND (SELECT count(*) FROM trabajadores t2
       WHERE lower(trim(t2.nombre)) = lower(trim(t.nombre)) AND t2.eliminado_en IS NULL) = 1
  AND (SELECT count(*) FROM users u2
       JOIN personas p2 ON p2.id = u2.persona_id
       WHERE lower(concat_ws(' ', p2.nombre, p2.apellido_paterno, p2.apellido_materno)) = lower(trim(t.nombre))) = 1
  AND t.eliminado_en IS NULL;
