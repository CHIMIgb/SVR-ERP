-- fecha: DATE -> TIMESTAMPTZ (permite registrar fecha y hora del incidente)
ALTER TABLE "incidentes" ALTER COLUMN "fecha" TYPE TIMESTAMPTZ USING "fecha"::timestamptz;

-- Campos del reporte formal del incidente
ALTER TABLE "incidentes" ADD COLUMN "reporte_descripcion" TEXT;
ALTER TABLE "incidentes" ADD COLUMN "reportado_por" UUID;
ALTER TABLE "incidentes" ADD COLUMN "reportado_en" TIMESTAMPTZ;
ALTER TABLE "incidentes" ADD CONSTRAINT "fk_incidentes_reportado_por" FOREIGN KEY ("reportado_por") REFERENCES "users"("id") ON UPDATE NO ACTION;

-- Enum de auditoría para el reporte
ALTER TYPE "AuditAction" ADD VALUE 'INCIDENTE_REPORTADO';
