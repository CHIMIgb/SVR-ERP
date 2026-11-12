-- El PUESTO decide el rol del alta (decisión del SVR, 12-nov):
--   categorias_puesto.rol_id (FK, nullable) = rol que recibe la cuenta de
--   acceso cuando el alta lleva ese puesto. NULL = sin cuenta (ej. "Otro").
-- Además: quitar reportes_campo.ELIMINAR a todo rol que no sea Administrador
--   (decisión del SVR: borrar reportes es solo del Administrador).
-- IDEMPOTENTE: guardas WHERE NOT EXISTS / condicionales.

-- 1. Columna del rol por puesto
ALTER TABLE "categorias_puesto" ADD COLUMN IF NOT EXISTS "rol_id" UUID
  REFERENCES "roles"("id") ON DELETE SET NULL;

-- 2. Mapeo puesto → rol (solo llena NULL; el SVR lo puede cambiar luego)
UPDATE "categorias_puesto" c SET "rol_id" = (SELECT "id" FROM "roles" WHERE "nombre" = 'Trabajador' AND "activo")
WHERE c."nombre" IN ('Operador', 'Chofer') AND c."rol_id" IS NULL;

UPDATE "categorias_puesto" c SET "rol_id" = (SELECT "id" FROM "roles" WHERE "nombre" = 'Tecnico' AND "activo")
WHERE c."nombre" IN ('Mecanico', 'Tecnico Diesel', 'Soldador', 'Mantenimiento') AND c."rol_id" IS NULL;

UPDATE "categorias_puesto" c SET "rol_id" = (SELECT "id" FROM "roles" WHERE "nombre" = 'Residente' AND "activo")
WHERE c."nombre" = 'Ingeniero' AND c."rol_id" IS NULL;

UPDATE "categorias_puesto" c SET "rol_id" = (SELECT "id" FROM "roles" WHERE "nombre" = 'Administrativo' AND "activo")
WHERE c."nombre" IN ('RRHH', 'Administrativo') AND c."rol_id" IS NULL;

-- 3. Puesto "Otro": perfil laboral SIN acceso a la app
INSERT INTO "categorias_puesto" ("id", "nombre", "actualizado_en")
SELECT gen_random_uuid(), 'Otro', now()
WHERE NOT EXISTS (SELECT 1 FROM "categorias_puesto" WHERE "nombre" = 'Otro');

-- 4. reportes_campo.ELIMINAR solo para Administrador
DELETE FROM "role_permissions" rp
USING "permissions" p, "roles" r
WHERE p."id" = rp."permiso_id" AND r."id" = rp."rol_id"
  AND p."modulo" = 'operaciones' AND p."recurso" = 'reportes_campo' AND p."accion" = 'eliminar'
  AND r."nombre" <> 'Administrador';

-- DOWN (best-effort): restaurar el permiso y quitar el mapeo/roles nuevos.
--   INSERT INTO role_permissions (rol_id, permiso_id)
--   SELECT (SELECT id FROM roles WHERE nombre='Administrativo'), id FROM permissions
--   WHERE modulo='operaciones' AND recurso='reportes_campo' AND accion='eliminar'
--   ON CONFLICT DO NOTHING;
--   UPDATE categorias_puesto SET rol_id = NULL; DELETE FROM categorias_puesto WHERE nombre='Otro';
--   ALTER TABLE categorias_puesto DROP COLUMN rol_id;
