-- Complementaria: FK de reporte hacia su subcategoría (catálogo por torre).
ALTER TABLE "reportes_campo" ADD COLUMN "subcategoria_id" UUID;
CREATE INDEX "reportes_campo_subcategoria_id_idx" ON "reportes_campo"("subcategoria_id");
ALTER TABLE "reportes_campo" ADD CONSTRAINT "reportes_campo_subcategoria_id_fkey"
    FOREIGN KEY ("subcategoria_id") REFERENCES "subcategorias_reporte"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
