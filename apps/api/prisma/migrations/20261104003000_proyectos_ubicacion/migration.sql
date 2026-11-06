-- /proyectos: ubicación exacta (calle, colonia, ciudad, estado, CP)
-- 2026-11-04 — columnas nullable para no romper los proyectos existentes;
-- la UI las vuelve obligatorias al crear/editar.
-- SIN backfill (revisión PR #15): las direcciones reales de P001–P003 se
-- capturan desde la UI; las demo viven en `seed-proyectos-demo.sql` (que NO
-- corre en producción).
ALTER TABLE "proyectos" ADD COLUMN "calle" TEXT;
ALTER TABLE "proyectos" ADD COLUMN "colonia" TEXT;
ALTER TABLE "proyectos" ADD COLUMN "ciudad" TEXT;
ALTER TABLE "proyectos" ADD COLUMN "estado_ubicacion" TEXT;
ALTER TABLE "proyectos" ADD COLUMN "codigo_postal" VARCHAR(10);
