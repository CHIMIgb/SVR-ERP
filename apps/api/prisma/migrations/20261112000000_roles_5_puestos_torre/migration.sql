-- Consolidación al modelo de 5 roles (decisión del SVR, 12-nov):
--   Administrativo (absorbe Encargado de RRHH), Tecnico (absorbe Tecnico
--   Mecanico/Soldador/Diesel/Mantenimiento) + Residente, Cobrador y
--   Trabajador sin cambio. Administrador se queda como rol del sistema.
-- La TORRE (área que atiende reportes de campo) pasa al PUESTO:
--   categorias_puesto.torre se copia a users.torre — el código de /reportes
--   ya da prioridad a users.torre sobre la del rol, así que el ámbito y la
--   clasificación no cambian.
-- IDEMPOTENTE: guardas WHERE NOT EXISTS y updates condicionales.

-- 1. Torre por puesto (la torre es del puesto, no del rol)
ALTER TABLE "categorias_puesto" ADD COLUMN IF NOT EXISTS "torre" "CategoriaReporte";

UPDATE "categorias_puesto" SET "torre" = 'MECANICO'
WHERE "nombre" = 'Mecanico' AND "torre" IS NULL;
UPDATE "categorias_puesto" SET "torre" = 'DIESEL'
WHERE "nombre" = 'Tecnico Diesel' AND "torre" IS NULL;
UPDATE "categorias_puesto" SET "torre" = 'SOLDADOR'
WHERE "nombre" = 'Soldador' AND "torre" IS NULL;
UPDATE "categorias_puesto" SET "torre" = 'MANTENIMIENTO'
WHERE "nombre" = 'Mantenimiento' AND "torre" IS NULL;
UPDATE "categorias_puesto" SET "torre" = 'RESIDENTE'
WHERE "nombre" = 'Ingeniero' AND "torre" IS NULL;
UPDATE "categorias_puesto" SET "torre" = 'ADMINISTRATIVO'
WHERE "nombre" IN ('Administrativo', 'RRHH') AND "torre" IS NULL;

-- Puestos que faltaban en el catálogo
INSERT INTO "categorias_puesto" ("id", "nombre", "torre", "actualizado_en")
SELECT gen_random_uuid(), v.nombre, v.torre::"CategoriaReporte", now()
FROM (VALUES
  ('Tecnico Diesel', 'DIESEL'),
  ('Soldador', 'SOLDADOR'),
  ('Mantenimiento', 'MANTENIMIENTO'),
  ('RRHH', 'ADMINISTRATIVO')
) AS v(nombre, torre)
WHERE NOT EXISTS (SELECT 1 FROM "categorias_puesto" c WHERE c."nombre" = v.nombre);

UPDATE "categorias_puesto" SET "torre" = 'DIESEL' WHERE "nombre" = 'Tecnico Diesel' AND "torre" IS NULL;
UPDATE "categorias_puesto" SET "torre" = 'SOLDADOR' WHERE "nombre" = 'Soldador' AND "torre" IS NULL;
UPDATE "categorias_puesto" SET "torre" = 'MANTENIMIENTO' WHERE "nombre" = 'Mantenimiento' AND "torre" IS NULL;
UPDATE "categorias_puesto" SET "torre" = 'ADMINISTRATIVO' WHERE "nombre" = 'RRHH' AND "torre" IS NULL;

-- 2. Rol consolidado Técnico (nivel 70, el de los técnicos)
INSERT INTO "roles" ("id", "nombre", "nivel", "actualizado_en")
SELECT gen_random_uuid(), 'Tecnico', 70, now()
WHERE NOT EXISTS (SELECT 1 FROM "roles" WHERE "nombre" = 'Tecnico');

-- 3. Unión de permisos: 4 técnicos → Tecnico (DISTINCT: dos roles de origen
--    comparten permisos y el NOT EXISTS no ve lo insertado en el mismo statement)
INSERT INTO "role_permissions" ("rol_id", "permiso_id")
SELECT DISTINCT d."id", p."permiso_id"
FROM "roles" d
JOIN "roles" o ON o."nombre" IN ('Tecnico Mecanico', 'Tecnico Soldador', 'Tecnico Diesel', 'Tecnico Mantenimiento')
JOIN "role_permissions" p ON p."rol_id" = o."id"
WHERE d."nombre" = 'Tecnico'
  AND NOT EXISTS (
    SELECT 1 FROM "role_permissions" rp
    WHERE rp."rol_id" = d."id" AND rp."permiso_id" = p."permiso_id"
  );

-- 4. Encargado de RRHH → Administrativo: unión de permisos (DISTINCT por lo mismo)
INSERT INTO "role_permissions" ("rol_id", "permiso_id")
SELECT DISTINCT d."id", p."permiso_id"
FROM "roles" d
JOIN "roles" o ON o."nombre" = 'Encargado de RRHH'
JOIN "role_permissions" p ON p."rol_id" = o."id"
WHERE d."nombre" = 'Administrativo'
  AND NOT EXISTS (
    SELECT 1 FROM "role_permissions" rp
    WHERE rp."rol_id" = d."id" AND rp."permiso_id" = p."permiso_id"
  );

-- 5. Unión de vistas de los 4 técnicos → Tecnico (valores de la primera fila por vista)
INSERT INTO "role_vistas" ("id", "rol_id", "vista_id", "puede_ver", "puede_crear", "puede_editar", "puede_eliminar", "puede_exportar", "asignado_en", "activo")
SELECT gen_random_uuid(), d."id", s."vista_id", s."puede_ver", s."puede_crear", s."puede_editar", s."puede_eliminar", s."puede_exportar", now(), true
FROM "roles" d
JOIN (
  SELECT DISTINCT ON ("vista_id") "vista_id", "puede_ver", "puede_crear", "puede_editar", "puede_eliminar", "puede_exportar"
  FROM "role_vistas" rv
  JOIN "roles" o ON o."id" = rv."rol_id"
  WHERE o."nombre" IN ('Tecnico Mecanico', 'Tecnico Soldador', 'Tecnico Diesel', 'Tecnico Mantenimiento')
  ORDER BY "vista_id", "puede_ver" DESC
) s ON true
WHERE d."nombre" = 'Tecnico'
  AND NOT EXISTS (
    SELECT 1 FROM "role_vistas" rv2 WHERE rv2."rol_id" = d."id" AND rv2."vista_id" = s."vista_id"
  );

-- 6. Encargado de RRHH → Administrativo: unión de vistas
INSERT INTO "role_vistas" ("id", "rol_id", "vista_id", "puede_ver", "puede_crear", "puede_editar", "puede_eliminar", "puede_exportar", "asignado_en", "activo")
SELECT gen_random_uuid(), d."id", s."vista_id", s."puede_ver", s."puede_crear", s."puede_editar", s."puede_eliminar", s."puede_exportar", now(), true
FROM "roles" d
JOIN (
  SELECT DISTINCT ON ("vista_id") "vista_id", "puede_ver", "puede_crear", "puede_editar", "puede_eliminar", "puede_exportar"
  FROM "role_vistas" rv
  JOIN "roles" o ON o."id" = rv."rol_id"
  WHERE o."nombre" = 'Encargado de RRHH'
  ORDER BY "vista_id", "puede_ver" DESC
) s ON true
WHERE d."nombre" = 'Administrativo'
  AND NOT EXISTS (
    SELECT 1 FROM "role_vistas" rv2 WHERE rv2."rol_id" = d."id" AND rv2."vista_id" = s."vista_id"
  );

-- 7. Torre del usuario desde su rol CON torre (antes de remapear; respeta overrides previos)
UPDATE "users" u
SET "torre" = sub."torre"
FROM (
  SELECT DISTINCT ON (ur."user_id") ur."user_id", r."torre"
  FROM "users_roles" ur
  JOIN "roles" r ON r."id" = ur."rol_id"
  WHERE r."torre" IS NOT NULL
  ORDER BY ur."user_id", r."nivel" DESC
) sub
WHERE u."id" = sub."user_id" AND u."torre" IS NULL;

-- 8. Remapeo de usuarios (dedupe del unique user+rol antes del UPDATE)
DELETE FROM "users_roles" ur
WHERE ur."rol_id" IN (SELECT "id" FROM "roles" WHERE "nombre" LIKE 'Tecnico %' OR "nombre" = 'Encargado de RRHH')
  AND EXISTS (
    SELECT 1
    FROM "users_roles" ur2
    JOIN "roles" r2 ON r2."id" = ur2."rol_id"
    JOIN "roles" r_o ON r_o."id" = ur."rol_id"
    WHERE ur2."user_id" = ur."user_id"
      AND r2."nombre" = (CASE WHEN r_o."nombre" LIKE 'Tecnico %' THEN 'Tecnico' ELSE 'Administrativo' END)
  );

UPDATE "users_roles" ur
SET "rol_id" = (SELECT "id" FROM "roles" WHERE "nombre" = 'Tecnico')
WHERE "rol_id" IN (SELECT "id" FROM "roles" WHERE "nombre" LIKE 'Tecnico %');

UPDATE "users_roles" ur
SET "rol_id" = (SELECT "id" FROM "roles" WHERE "nombre" = 'Administrativo')
WHERE "rol_id" = (SELECT "id" FROM "roles" WHERE "nombre" = 'Encargado de RRHH');

-- 9. Desactivar los roles consolidados (no se borran: historial)
UPDATE "roles"
SET "activo" = false, "eliminado_en" = now(), "actualizado_en" = now()
WHERE "nombre" IN ('Encargado de RRHH', 'Tecnico Mecanico', 'Tecnico Soldador', 'Tecnico Diesel', 'Tecnico Mantenimiento')
  AND "activo" = true;

-- 10. Residuo de pruebas (categorias creadas por suites de integración)
DELETE FROM "categorias_puesto" WHERE "nombre" LIKE 'TestCategoria-%';

-- DOWN (best-effort): reactiva los roles viejos. Los usuarios quedan en los
-- consolidados (el mapeo original no se conserva) y users.torre se conserva
-- — revertir la torre al rol rompería el ámbito de /reportes.
-- UPDATE "roles" SET "activo" = true, "eliminado_en" = NULL
-- WHERE "nombre" IN ('Encargado de RRHH','Tecnico Mecanico','Tecnico Soldador','Tecnico Diesel','Tecnico Mantenimiento');
