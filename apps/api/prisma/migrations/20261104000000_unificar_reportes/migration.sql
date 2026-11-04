-- Unificación de Reportes e Incidentes (2026-11)
-- 1) Enum: ADMINISTRATIVO disponible como área de reporte
ALTER TYPE "TipoReporteCampo" ADD VALUE 'ADMINISTRATIVO';

-- 2) Asignación / resolución en reportes_campo (quién lo debe resolver, quién lo resolvió)
ALTER TABLE "reportes_campo" ADD COLUMN "asignado_a_id" UUID;
ALTER TABLE "reportes_campo" ADD COLUMN "asignado_en" TIMESTAMPTZ;
ALTER TABLE "reportes_campo" ADD COLUMN "asignado_nombre" TEXT;
ALTER TABLE "reportes_campo" ADD COLUMN "resuelto_en" TIMESTAMPTZ;
ALTER TABLE "reportes_campo" ALTER COLUMN "actualizado_en" SET DEFAULT now();

ALTER TABLE "reportes_campo" ADD CONSTRAINT "reportes_campo_asignado_a_id_fkey"
  FOREIGN KEY ("asignado_a_id") REFERENCES "trabajadores"(id);

CREATE INDEX "reportes_campo_tipo_estado_idx" ON "reportes_campo"("tipo", "estado");
CREATE INDEX "reportes_campo_asignado_a_id_idx" ON "reportes_campo"("asignado_a_id");

-- 3) Migración de datos: incidentes → reportes_campo
--    titulo+descripcion → descripcion; ABIERTO→PENDIENTE; hora desde el timestamp
INSERT INTO "reportes_campo"
  (id, codigo, tipo, usuario, maquina_id, fecha, hora, descripcion, estado,
   prioridad, activo, creado_en, actualizado_en, actualizado_por, creado_por,
   eliminado_en, obra_id, obra_texto, usuario_id)
SELECT
  i.id,
  i.codigo,
  'INCIDENTE'::"TipoReporteCampo",
  COALESCE(ur.email, uc.email, 'sistema'),
  i.maquina_id,
  i.fecha::date,
  i.fecha::time,
  i.titulo || ' — ' || i.descripcion,
  (CASE i.estado
     WHEN 'ABIERTO' THEN 'PENDIENTE'
     WHEN 'EN_REVISION' THEN 'EN_REVISION'
     WHEN 'RESUELTO' THEN 'RESUELTO'
   END)::"EstadoReporteCampo",
  i.prioridad,
  i.activo,
  i.creado_en,
  i.actualizado_en,
  i.actualizado_por,
  i.creado_por,
  i.eliminado_en,
  i.obra_id,
  i.obra_texto,
  COALESCE(i.reportado_por, i.creado_por)
FROM "incidentes" i
LEFT JOIN "users" ur ON ur.id = i.reportado_por
LEFT JOIN "users" uc ON uc.id = i.creado_por;

-- 4) La tabla incidentes es fantasma: nada del sistema la referencia (verificado)
DROP TABLE "incidentes";
DROP TYPE "EstadoIncidente";

-- 5) RBAC: un solo permiso-set (operaciones.reportes_campo.*) y una sola vista /reportes
DELETE FROM "role_permissions"
 WHERE permiso_id IN (SELECT id FROM permissions WHERE modulo = 'operaciones' AND recurso = 'incidentes');
DELETE FROM "permissions" WHERE modulo = 'operaciones' AND recurso = 'incidentes';

DELETE FROM "role_vistas"
 WHERE vista_id IN (SELECT id FROM vistas WHERE ruta IN ('/incidentes', '/reportes-campo'));

UPDATE "vistas"
   SET ruta = '/reportes', nombre = 'Reportes', icono = 'AlertTriangle'
 WHERE ruta = '/reportes-campo';
