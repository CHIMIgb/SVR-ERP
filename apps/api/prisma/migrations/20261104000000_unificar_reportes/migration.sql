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
--
-- 3) Estado de accesos HOY en el servidor (comparar tras el deploy — re-revisión
--    PR #15): guarda la salida de esta consulta y contrasta con la post-deploy;
--    ningún rol debe ganar ni perder acceso a /reportes respecto de lo que
--    hoy ve en /incidentes, /reportes-campo o /reportes.
--      SELECT r.nombre, v.ruta, rv.puede_ver, rv.puede_crear, rv.puede_editar,
--             rv.puede_eliminar, rv.puede_exportar
--        FROM role_vistas rv
--        JOIN roles r ON r.id = rv.rol_id
--        JOIN vistas v ON v.id = rv.vista_id
--       WHERE v.ruta IN ('/incidentes', '/reportes-campo', '/reportes')
--       ORDER BY r.nombre, v.ruta;
-- ─────────────────────────────────────────────────────────────────────────────

-- Idempotencia (sugerencia review PR #15): un re-run no rompe — enum/columnas/
-- índice/FK con guard, y la migración de datos solo corre si `incidentes` aún existe.

-- 1) Enum: ADMINISTRATIVO disponible como área de reporte (PG 12+: ADD VALUE en DO block, sin usarlo en esta transacción)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'TipoReporteCampo' AND e.enumlabel = 'ADMINISTRATIVO'
  ) THEN
    ALTER TYPE "TipoReporteCampo" ADD VALUE 'ADMINISTRATIVO';
  END IF;
END $$;

-- 2) Asignación / resolución en reportes_campo (quién lo debe resolver, quién lo resolvió)
ALTER TABLE "reportes_campo" ADD COLUMN IF NOT EXISTS "asignado_a_id" UUID;
ALTER TABLE "reportes_campo" ADD COLUMN IF NOT EXISTS "asignado_en" TIMESTAMPTZ;
ALTER TABLE "reportes_campo" ADD COLUMN IF NOT EXISTS "asignado_nombre" TEXT;
ALTER TABLE "reportes_campo" ADD COLUMN IF NOT EXISTS "resuelto_en" TIMESTAMPTZ;
ALTER TABLE "reportes_campo" ALTER COLUMN "actualizado_en" SET DEFAULT now();

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reportes_campo_asignado_a_id_fkey'
  ) THEN
    ALTER TABLE "reportes_campo" ADD CONSTRAINT "reportes_campo_asignado_a_id_fkey"
      FOREIGN KEY ("asignado_a_id") REFERENCES "trabajadores"(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "reportes_campo_tipo_estado_idx" ON "reportes_campo"("tipo", "estado");
CREATE INDEX IF NOT EXISTS "reportes_campo_asignado_a_id_idx" ON "reportes_campo"("asignado_a_id");

-- 3) Migración de datos: incidentes → reportes_campo (solo si incidentes aún existe)
--    titulo+descripcion → descripcion; ABIERTO→PENDIENTE; hora desde el timestamp
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'incidentes') THEN

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
DROP TABLE IF EXISTS "incidentes";
DROP TYPE IF EXISTS "EstadoIncidente";

END IF;
END $$;

-- 5) RBAC: un solo permiso-set (operaciones.reportes_campo.*) y una sola vista
--    unificada /reportes — que COINCIDE con la ruta real de la web
--    (VISTA_RUTA = '/reportes' en proveedores/reportes; página (dashboard)/reportes).
--
-- Se REPURPUEA el mock '/reportes' (Sistema) que ya existe del dump: se actualiza
-- in-place (sin conflicto de unique(ruta)) y conserva sus role_vistas.
-- PERDIDA DE ACCESO: ningún rol gana ni pierde — la copia de flags corre ANTES
-- de borrar las vistas viejas (re-revisión PR #15, bloqueador RBAC).
DELETE FROM "role_permissions"
 WHERE permiso_id IN (SELECT id FROM permissions WHERE modulo = 'operaciones' AND recurso = 'incidentes');
DELETE FROM "permissions" WHERE modulo = 'operaciones' AND recurso = 'incidentes';

UPDATE "vistas"
   SET nombre = 'Reportes', icono = 'AlertTriangle'
 WHERE ruta = '/reportes';

-- 5a) Primero copiar: cada rol que veía /incidentes o /reportes-campo pasa a
--     /reportes con sus flags. GROUP BY + bool_or: un rol con las dos vistas
--     daría dos filas y role_vistas tiene unique (rol_id, vista_id).
--     ON CONFLICT: si el rol ya tenía el mock /reportes, conserva el mayor
--     de los dos niveles (re-revisión PR #15 — SQL validado por el reviewer).
INSERT INTO role_vistas (id, rol_id, vista_id, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar, asignado_en)
SELECT gen_random_uuid(), rv.rol_id, v_nueva.id,
       bool_or(rv.puede_ver), bool_or(rv.puede_crear), bool_or(rv.puede_editar),
       bool_or(rv.puede_eliminar), bool_or(rv.puede_exportar), now()
FROM role_vistas rv
JOIN vistas v_vieja ON v_vieja.id = rv.vista_id AND v_vieja.ruta IN ('/incidentes', '/reportes-campo')
JOIN vistas v_nueva ON v_nueva.ruta = '/reportes'
GROUP BY rv.rol_id, v_nueva.id
ON CONFLICT (rol_id, vista_id) DO UPDATE SET
  puede_ver      = role_vistas.puede_ver      OR EXCLUDED.puede_ver,
  puede_crear    = role_vistas.puede_crear    OR EXCLUDED.puede_crear,
  puede_editar   = role_vistas.puede_editar   OR EXCLUDED.puede_editar,
  puede_eliminar = role_vistas.puede_eliminar OR EXCLUDED.puede_eliminar,
  puede_exportar = role_vistas.puede_exportar OR EXCLUDED.puede_exportar;

-- 5b) Después borrar las vistas viejas, también /reportes-campo
DELETE FROM role_vistas WHERE vista_id IN (SELECT id FROM vistas WHERE ruta IN ('/incidentes', '/reportes-campo'));
DELETE FROM vistas WHERE ruta IN ('/incidentes', '/reportes-campo');
