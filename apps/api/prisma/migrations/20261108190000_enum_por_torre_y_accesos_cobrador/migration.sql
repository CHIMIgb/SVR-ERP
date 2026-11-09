-- Unificación de vocabulario de áreas: el tipo del reporte se hace espejo de la
-- torre (CategoriaReporte) — el UI ya no pide el tipo viejo (se deriva del área).
-- + Accesos del rol Cobrador: /criba, /ventas y /ventas/corte.

-- ════════════════════════════════════════════════
-- 1. TipoReporteCampo: los 4 faltantes para espejar las torres (1:1)
--    (MECANICO y ADMINISTRATIVO ya existen; los viejos quedan como histórico)
-- ════════════════════════════════════════════════
ALTER TYPE "TipoReporteCampo" ADD VALUE IF NOT EXISTS 'SOLDADOR';
ALTER TYPE "TipoReporteCampo" ADD VALUE IF NOT EXISTS 'DIESEL';
ALTER TYPE "TipoReporteCampo" ADD VALUE IF NOT EXISTS 'MANTENIMIENTO';
ALTER TYPE "TipoReporteCampo" ADD VALUE IF NOT EXISTS 'RESIDENTE';

-- ════════════════════════════════════════════════
-- 2. Cobrador: vistas /criba, /ventas, /ventas/corte
--    /ventas con puede_crear (el POS necesita vender) · permisos: criba.ver,
--    ventas.ver, ventas.crear
-- ════════════════════════════════════════════════
INSERT INTO role_vistas (id, rol_id, vista_id, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar, activo, asignado_en)
SELECT gen_random_uuid(), r.id, v.id, f.tv, f.tc, false, false, false, true, NOW()
FROM roles r
JOIN (VALUES
  ('/criba',        true,  false),
  ('/ventas',       true,  true),
  ('/ventas/corte', true,  false)
) AS f(ruta, tv, tc) ON true
JOIN vistas v ON v.ruta = f.ruta
WHERE r.nombre = 'Cobrador'
  AND NOT EXISTS (
    SELECT 1 FROM role_vistas rv WHERE rv.rol_id = r.id AND rv.vista_id = v.id
  );

INSERT INTO role_permissions (rol_id, permiso_id, creado_en)
SELECT r.id, p.id, NOW()
FROM roles r
JOIN (VALUES
  ('operaciones', 'criba',  'ver'),
  ('comercial',   'ventas', 'ver'),
  ('comercial',   'ventas', 'crear')
) AS clave(modulo, recurso, accion) ON true
JOIN permissions p ON p.modulo = clave.modulo AND p.recurso = clave.recurso AND p.accion = clave.accion
WHERE r.nombre = 'Cobrador'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.rol_id = r.id AND rp.permiso_id = p.id
  );
