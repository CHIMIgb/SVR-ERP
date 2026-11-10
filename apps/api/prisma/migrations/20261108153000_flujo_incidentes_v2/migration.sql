-- Nuevo flujo de /reportes (mini-ServiceNow):
-- Estados 3: NUEVO → EN_CURSO → CERRADO (reemplaza la máquina de 6 estados),
-- subcategorías por torre (catálogo), actividades (bitácora del incidente),
-- adjuntos (imágenes en base64) y ubicación GPS opcional.
-- Borrado del flujo anterior: columnas cliente/proyecto/monto y facturar de reportes.
--
-- IDEMPOTENTE (review PR #17): cada paso con guarda — re-aplicar esta migración
-- no suma datos duplicados ni truena por objetos pre-existentes.

-- ── 1. Estados simplificados (re-mapeo de datos demo incluido) ──
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EstadoReporteCampo') THEN
    ALTER TYPE "EstadoReporteCampo" RENAME TO "EstadoReporteCampoOld";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EstadoIncidente') THEN
    CREATE TYPE "EstadoIncidente" AS ENUM ('NUEVO', 'EN_CURSO', 'CERRADO');
  END IF;
END $$;

DO $$
BEGIN
  -- sólo si la columna todavía usa el tipo viejo (media carrera ya migrada)
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_name = 'reportes_campo' AND c.column_name = 'estado'
      AND c.udt_name = 'EstadoReporteCampoOld'
  ) THEN
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
  END IF;
END $$;

-- el tipo viejo se suelta aquí (si existe) — puede ser que la media carrera
-- ya lo haya dejado en el estado intermedio
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EstadoReporteCampoOld') THEN
    DROP TYPE "EstadoReporteCampoOld";
  END IF;
END $$;

-- El cierre dejó de ser "resuelto_en"
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reportes_campo' AND column_name = 'resuelto_en'
  ) THEN
    ALTER TABLE "reportes_campo" RENAME COLUMN "resuelto_en" TO "cerrado_en";
  END IF;
END $$;

-- ── 2. Borrado del flujo anterior: facturación de reportes ──
ALTER TABLE "reportes_campo" DROP COLUMN IF EXISTS "cliente_id";
ALTER TABLE "reportes_campo" DROP COLUMN IF EXISTS "proyecto_id";
ALTER TABLE "reportes_campo" DROP COLUMN IF EXISTS "monto_servicio";

-- ── 3. Ubicación GPS opcional ("mi ubicación actual") ──
ALTER TABLE "reportes_campo" ADD COLUMN IF NOT EXISTS "latitud" DECIMAL(10,7);
ALTER TABLE "reportes_campo" ADD COLUMN IF NOT EXISTS "longitud" DECIMAL(10,7);

-- ── 4. Subcategorías por torre (catálogo) ──
CREATE TABLE IF NOT EXISTS "subcategorias_reporte" (
    "id" UUID NOT NULL,
    "categoria" "CategoriaReporte" NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subcategorias_reporte_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "subcategorias_reporte_categoria_nombre_key"
    ON "subcategorias_reporte"("categoria", "nombre");
CREATE INDEX IF NOT EXISTS "subcategorias_reporte_categoria_idx" ON "subcategorias_reporte"("categoria");

-- idempotente: el唯一 indice (categoria, nombre) absorbe re-inserciones
INSERT INTO "subcategorias_reporte" ("id", "categoria", "nombre")
SELECT gen_random_uuid(), v.categoria::"CategoriaReporte", v.nombre
FROM (VALUES
  ('DIESEL', '150 litros de diésel'),
  ('ADMINISTRATIVO', 'Cubeta de aceite'),
  ('MECANICO', 'Cambio de refacción'),
  ('MECANICO', 'Servicio preventivo'),
  ('SOLDADOR', 'Soldadura de pieza'),
  ('SOLDADOR', 'Fabricación de estructura'),
  ('MANTENIMIENTO', 'Reparación de luminaria'),
  ('MANTENIMIENTO', 'Instalación hidrosanitaria'),
  ('RESIDENTE', 'Supervisión de obra')
) AS v(categoria, nombre)
WHERE NOT EXISTS (
  SELECT 1 FROM "subcategorias_reporte" s
  WHERE s.categoria = v.categoria::"CategoriaReporte" AND s.nombre = v.nombre
);

-- ── 5. Actividades (bitácora del incidente) ──
CREATE TABLE IF NOT EXISTS "reportes_actividades" (
    "id" UUID NOT NULL,
    "reporte_id" UUID NOT NULL,
    "texto" TEXT NOT NULL,
    "autor_nombre" TEXT NOT NULL,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reportes_actividades_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "reportes_actividades_reporte_id_idx" ON "reportes_actividades"("reporte_id");
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reportes_actividades_reporte_id_fkey'
  ) THEN
    ALTER TABLE "reportes_actividades" ADD CONSTRAINT "reportes_actividades_reporte_id_fkey"
        FOREIGN KEY ("reporte_id") REFERENCES "reportes_campo"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ── 6. Adjuntos (imágenes del incidente, base64 en BD) ──
CREATE TABLE IF NOT EXISTS "reportes_adjuntos" (
    "id" UUID NOT NULL,
    "reporte_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "tamano" INTEGER NOT NULL,
    "datos" TEXT NOT NULL,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reportes_adjuntos_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "reportes_adjuntos_reporte_id_idx" ON "reportes_adjuntos"("reporte_id");
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reportes_adjuntos_reporte_id_fkey'
  ) THEN
    ALTER TABLE "reportes_adjuntos" ADD CONSTRAINT "reportes_adjuntos_reporte_id_fkey"
        FOREIGN KEY ("reporte_id") REFERENCES "reportes_campo"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ── 7. Nuevas acciones de auditoría ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'AuditAction' AND e.enumlabel = 'REPORTE_COMENTADO'
  ) THEN
    ALTER TYPE "AuditAction" ADD VALUE 'REPORTE_COMENTADO';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'AuditAction' AND e.enumlabel = 'REPORTE_ADJUNTO'
  ) THEN
    ALTER TYPE "AuditAction" ADD VALUE 'REPORTE_ADJUNTO';
  END IF;
END $$;
