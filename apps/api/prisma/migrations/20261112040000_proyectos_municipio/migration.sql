-- Municipio del proyecto (columna nueva, nullable: los proyectos existentes no tienen el dato)
ALTER TABLE "proyectos" ADD COLUMN "municipio" TEXT;
