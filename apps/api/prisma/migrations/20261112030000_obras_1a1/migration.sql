-- B2.1 — Obra 1:1 con el proyecto (plan comercial §10, 2026-11-12)
-- Aplica el índice único y siembra la obra de cada proyecto que no tiene.

-- 1) Una sola obra por proyecto: el índice único sustituye al índice simple.
DROP INDEX "obras_proyecto_id_idx";
CREATE UNIQUE INDEX "obras_proyecto_id_key" ON "obras"("proyecto_id");

-- 2) Backfill: cada proyecto vivo sin obra recibe la suya (hereda nombre,
--    estado mapeado y ubicación compuesta). Idempotente por el NOT EXISTS.
INSERT INTO "obras" ("id", "nombre", "estado", "proyecto_id", "ubicacion", "activo", "creado_en", "actualizado_en")
SELECT gen_random_uuid(),
       p."nombre",
       CASE p."estado" WHEN 'FINALIZADO' THEN 'FINALIZADA'::"EstadoObra" ELSE 'EN_PROCESO'::"EstadoObra" END,
       p."id",
       NULLIF(concat_ws(', ', p."calle", p."colonia", p."ciudad", p."estado_ubicacion"), ''),
       true,
       now(),
       now()
FROM "proyectos" p
WHERE p."eliminado_en" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "obras" o WHERE o."proyecto_id" = p."id");

-- 3) Normalización: la obra de un proyecto FINALIZADO no puede seguir EN_PROCESO
--    (caso "Puente Atizapán": seguía en el catálogo de /operaciones).
UPDATE "obras" o
SET "estado" = 'FINALIZADA',
    "actualizado_en" = now()
FROM "proyectos" p
WHERE p."id" = o."proyecto_id"
  AND p."estado" = 'FINALIZADO'
  AND o."estado" <> 'FINALIZADA';
