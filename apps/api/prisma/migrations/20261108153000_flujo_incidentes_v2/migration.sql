-- Nuevo flujo de /reportes (mini-ServiceNow):
-- Estados 3: NUEVO → EN_CURSO → CERRADO (reemplaza la máquina de 6 estados),
-- subcategorías por torre (catálogo), actividades (bitácora del incidente),
-- adjuntos (imágenes en base64) y ubicación GPS opcional.
-- Borrado del flujo anterior: columnas cliente/proyecto/monto y facturar de reportes.

-- ── 1. Estados simplificados (re-mapeo de datos demo incluido) ──
ALTER TYPE "EstadoReporteCampo" RENAME TO "EstadoReporteCampoOld";
CREATE TYPE "EstadoIncidente" AS ENUM ('NUEVO', 'EN_CURSO', 'CERRADO');
ALTER TABLE "reportes_campo" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "reportes_campo" ALTER COLUMN "estado" TYPE "EstadoIncidente"
  USING CASE "estado"
    WHEN 'PENDIENTE'::"EstadoReporteCampoOld" THEN 'NUEVO'::"EstadoIncidente"
    WHEN 'VISTO'::"EstadoReporteCampoOld"     THEN 'EN_CURSO'::"EstadoIncidente"
    WHEN 'ATENDIDO'::"EstadoReporteCampoOld"  THEN 'EN_CURSO'::"EstadoIncidente"
    WHEN 'EN_REVISION'::"EstadoReporteCampoOld" THEN 'EN_CURSO'::"EstadoIncidente"
    WHEN 'RESUELTO'::"EstadoReporteCampoOld"  THEN 'CERRADO'::"EstadoIncidente"
    WHEN 'FACTURADO'::"EstadoReporteCampoOld" THEN 'CERRADO'::"EstadoIncidente"
    ELSE 'EN_CURSO'::"EstadoIncidente"
  END;
ALTER TABLE "reportes_campo" ALTER COLUMN "estado" SET DEFAULT 'NUEVO'::"EstadoIncidente";
DROP TYPE "EstadoReporteCampoOld";

-- El cierre dejó de ser "resuelto_en"
ALTER TABLE "reportes_campo" RENAME COLUMN "resuelto_en" TO "cerrado_en";

-- ── 2. Borrado del flujo anterior: facturación de reportes ──
ALTER TABLE "reportes_campo" DROP COLUMN IF EXISTS "cliente_id";
ALTER TABLE "reportes_campo" DROP COLUMN IF EXISTS "proyecto_id";
ALTER TABLE "reportes_campo" DROP COLUMN IF EXISTS "monto_servicio";

-- ── 3. Ubicación GPS opcional ("mi ubicación actual") ──
ALTER TABLE "reportes_campo" ADD COLUMN "latitud" DECIMAL(10,7),
ADD COLUMN "longitud" DECIMAL(10,7);

-- ── 4. Subcategorías por torre (catálogo) ──
CREATE TABLE "subcategorias_reporte" (
    "id" UUID NOT NULL,
    "categoria" "CategoriaReporte" NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subcategorias_reporte_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "subcategorias_reporte_categoria_nombre_key"
    ON "subcategorias_reporte"("categoria", "nombre");
CREATE INDEX "subcategorias_reporte_categoria_idx" ON "subcategorias_reporte"("categoria");

INSERT INTO "subcategorias_reporte" ("id", "categoria", "nombre") VALUES
  (gen_random_uuid(), 'DIESEL', '150 litros de diésel'),
  (gen_random_uuid(), 'ADMINISTRATIVO', 'Cubeta de aceite'),
  (gen_random_uuid(), 'MECANICO', 'Cambio de refacción'),
  (gen_random_uuid(), 'MECANICO', 'Servicio preventivo'),
  (gen_random_uuid(), 'SOLDADOR', 'Soldadura de pieza'),
  (gen_random_uuid(), 'SOLDADOR', 'Fabricación de estructura'),
  (gen_random_uuid(), 'MANTENIMIENTO', 'Reparación de luminaria'),
  (gen_random_uuid(), 'MANTENIMIENTO', 'Instalación hidrosanitaria'),
  (gen_random_uuid(), 'RESIDENTE', 'Supervisión de obra');

-- ── 5. Actividades (bitácora del incidente) ──
CREATE TABLE "reportes_actividades" (
    "id" UUID NOT NULL,
    "reporte_id" UUID NOT NULL,
    "texto" TEXT NOT NULL,
    "autor_nombre" TEXT NOT NULL,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reportes_actividades_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "reportes_actividades_reporte_id_idx" ON "reportes_actividades"("reporte_id");
ALTER TABLE "reportes_actividades" ADD CONSTRAINT "reportes_actividades_reporte_id_fkey"
    FOREIGN KEY ("reporte_id") REFERENCES "reportes_campo"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 6. Adjuntos (imágenes del incidente, base64 en BD) ──
CREATE TABLE "reportes_adjuntos" (
    "id" UUID NOT NULL,
    "reporte_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "tamano" INTEGER NOT NULL,
    "datos" TEXT NOT NULL,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reportes_adjuntos_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "reportes_adjuntos_reporte_id_idx" ON "reportes_adjuntos"("reporte_id");
ALTER TABLE "reportes_adjuntos" ADD CONSTRAINT "reportes_adjuntos_reporte_id_fkey"
    FOREIGN KEY ("reporte_id") REFERENCES "reportes_campo"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 7. Nuevas acciones de auditoría ──
ALTER TYPE "AuditAction" ADD VALUE 'REPORTE_COMENTADO';
ALTER TYPE "AuditAction" ADD VALUE 'REPORTE_ADJUNTO';
