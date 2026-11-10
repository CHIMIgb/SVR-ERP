-- Ubicación del incidente: proyecto (tabla proyectos anos; obras retiradas del productivo
-- flujo) o GPS. Re-introduce proyecto_id FK y estructura para lat/long (las columnas
-- latitud/longitud ya existen desde el v2 y estaban dormidas).
ALTER TABLE "reportes_campo" ADD COLUMN "proyecto_id" UUID;
CREATE INDEX "reportes_campo_proyecto_id_idx" ON "reportes_campo"("proyecto_id");
ALTER TABLE "reportes_campo" ADD CONSTRAINT "reportes_campo_proyecto_id_fkey"
    FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
