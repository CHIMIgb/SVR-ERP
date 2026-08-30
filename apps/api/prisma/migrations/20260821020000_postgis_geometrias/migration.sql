-- ═══════════════════════════════════════════════════════════════════════
-- Agrega soporte PostGIS que faltaba tras restaurar desde el dump
-- "sin_postgis" (esa version se uso a proposito para no depender de la
-- extension mientras no estaba instalada). Con PostGIS ya disponible en
-- el servidor, se agregan las columnas de geometria real:
--
--   - geocercas.geometria: circulo real (centro + radio) como geography,
--     para consultas espaciales (ST_DWithin) en vez de Haversine manual.
--   - rastreo_gps.posicion: punto espacial derivado de lat/lng.
--
-- REQUISITO para aplicar esta migracion: PostGIS debe estar instalado en
-- el servidor de Postgres que la va a correr. Si no esta disponible, la
-- migracion se salta estos cambios sin fallar (util para shadow DBs o
-- entornos de desarrollo sin PostGIS).
--
-- No se declaran en schema.prisma: son columnas GENERATED ALWAYS AS
-- (STORED) de tipo geography, y Prisma no tiene sintaxis para columnas
-- calculadas ni para el tipo geography. Se consultan via $queryRaw
-- (ST_DWithin, ST_Distance, etc.), igual que ya se hace para los demas
-- objetos crudos de esta base (triggers, CHECK constraints).
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS postgis;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'PostGIS no disponible, se omiten columnas geograficas: %', SQLERRM;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER TABLE "geocercas" ADD COLUMN IF NOT EXISTS "geometria" geography(Polygon, 4326) GENERATED ALWAYS AS (
      ST_Buffer(
          ST_SetSRID(ST_MakePoint(centro_lng::float, centro_lat::float), 4326)::geography,
          radio_metros
      )
  ) STORED';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo agregar geometria de geocercas: %', SQLERRM;
END $$;

DO $$
BEGIN
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_geocercas_geometria ON geocercas USING gist(geometria)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear indice de geocercas: %', SQLERRM;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER TABLE "rastreo_gps" ADD COLUMN IF NOT EXISTS "posicion" geography(Point, 4326) GENERATED ALWAYS AS (
      ST_SetSRID(ST_MakePoint(lng::float, lat::float), 4326)::geography
  ) STORED';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo agregar posicion de rastreo_gps: %', SQLERRM;
END $$;

DO $$
BEGIN
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_rastreo_gps_posicion ON rastreo_gps USING gist(posicion)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear indice de rastreo_gps: %', SQLERRM;
END $$;
