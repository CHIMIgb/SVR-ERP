-- Unificación de Reportes e Incidentes (2026-11)
--
-- ─────────────────────────────────────────────────────────────────────────────
-- ⚠️  INSTRUCCIONES PARA EL SERVIDOR (bloqueador 4, review PR #15)
--
-- 1) PRE-FLIGHT antes de aplicar (verifiable data de incidentes a preservar):
--      SELECT count(*), count(reporte_descripcion), count(reportado_en)
--        FROM incidentes;
--    Los campos reporto_id / reporte_descripcion / reportado_en ya NO se
--    pierden: se preservan en reportes_campo.detalles (jsonb, condicional).
--
-- 2) Aplicar SOLO con `npx prisma migrate deploy` — cada migración corre en
--    UNA transacción (si el INSERT falla, el DROP también revierte). NUNCA
--    ejecutar este SQL crudo con psql (sin -1/ON_ERROR_STOP un error en el
--    INSERT no detendría el DROP de abajo).
-- ─────────────────────────────────────────────────────────────────────────────

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
   eliminado_en, obra_id, obra_texto, usuario_id, detalles)
SELECT
  i.id,
  i.codigo,
  'INCIDENTE'::"TipoReporteCampo",
  COALESCE(ur.email, uc.email, 'sistema'),
  i.maquina_id,
  -- TZ determinista (review, bloqueador 4): el cast ::date/::time sobre un
  -- timestamptz depende de la TZ de la sesión; con el servidor en UTC la
  -- hora quedaba corrida 6 h. Fijamos America/Mexico_City explícito.
  (i.fecha AT TIME ZONE 'America/Mexico_City')::date,
  (i.fecha AT TIME ZONE 'America/Mexico_City')::time,
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
  COALESCE(i.reportado_por, i.creado_por),
  -- Preservación de campos que antes se perdían (review, bloqueador 4):
  -- reporto_id (trabajador que reportó), reporte_descripcion y reportado_en
  -- van a detalles (jsonb nullable). Solo se construye si hay algo que
  -- preservar (nunca un objecto vacío).
  CASE
    WHEN i.reporto_id IS NOT NULL
      OR i.reporte_descripcion IS NOT NULL
      OR i.reportado_en IS NOT NULL THEN
      jsonb_strip_nulls(jsonb_build_object(
        'reporto_id',            i.reporto_id,
        'reporte_descripcion',   i.reporte_descripcion,
        'reportado_en',          i.reportado_en
      ))
    ELSE NULL
  END
FROM "incidentes" i
LEFT JOIN "users" ur ON ur.id = i.reportado_por
LEFT JOIN "users" uc ON uc.id = i.creado_por;

-- 4) La tabla incidentes es fantasma: nada del sistema la referencia (verificado)
DROP TABLE "incidentes";
DROP TYPE "EstadoIncidente";

-- 5) RBAC: un solo permiso-set (operaciones.reportes_campo.*) y una sola vista
--    unificada /reportes — que COINCIDE con la ruta real de la web
--    (VISTA_RUTA = '/reportes' en proveedores/reportes; página (dashboard)/reportes).
--
-- Se REPURPUEA el mock '/reportes' (Sistema) que ya existe del dump: se actualiza
-- in-place (sin conflicto de unique(ruta)) y conserva sus role_vistas; los roles
-- que veían '/incidentes' o '/reportes-campo' se re-vinculan con COPIA de sus
-- flags para que NINGUNO pierda el acceso (review PR #15, bloqueador 3).
DELETE FROM "role_permissions"
 WHERE permiso_id IN (SELECT id FROM permissions WHERE modulo = 'operaciones' AND recurso = 'incidentes');
DELETE FROM "permissions" WHERE modulo = 'operaciones' AND recurso = 'incidentes';

DELETE FROM "role_vistas"
 WHERE vista_id IN (SELECT id FROM vistas WHERE ruta IN ('/incidentes', '/reportes-campo'));

DELETE FROM "vistas" WHERE ruta = '/incidentes';

UPDATE "vistas"
   SET nombre = 'Reportes', icono = 'AlertTriangle'
 WHERE ruta = '/reportes';

-- Re-vincular a todos los roles que veían las vistas viejas, copiando sus flags
INSERT INTO role_vistas (id, rol_id, vista_id, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar, asignado_en)
SELECT gen_random_uuid(),
       rvv.rol_id,
       v_nueva.id,
       rvv.puede_ver,
       rvv.puede_crear,
       rvv.puede_editar,
       rvv.puede_eliminar,
       rvv.puede_exportar,
       now()
FROM role_vistas rvv
JOIN vistas v_vieja ON v_vieja.id = rvv.vista_id
JOIN vistas v_nueva ON v_nueva.ruta = '/reportes'
WHERE v_vieja.ruta IN ('/incidentes', '/reportes-campo')
  AND NOT EXISTS (
    SELECT 1 FROM role_vistas rv
     WHERE rv.rol_id = rvv.rol_id AND rv.vista_id = v_nueva.id
  );

-- Si algún rol ya tenía la vista unificada (o venía del mock /reportes),
-- garantiza al menos puede_ver sobre la ruta real de la web:
INSERT INTO role_vistas (id, rol_id, vista_id, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar, asignado_en)
SELECT gen_random_uuid(), r.id, v.id, true, false, false, false, false, now()
FROM roles r JOIN vistas v ON v.ruta = '/reportes'
WHERE NOT EXISTS (
  SELECT 1 FROM role_vistas rv WHERE rv.rol_id = r.id AND rv.vista_id = v.id
);
