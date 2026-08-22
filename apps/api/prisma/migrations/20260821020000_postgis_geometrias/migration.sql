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
-- el servidor de Postgres que la va a correr (Windows: bundle oficial
-- postgis-bundle-pgXX desde https://postgis.net/windows_downloads/,
-- extraer sobre la carpeta de PostgreSQL; o via Stack Builder si viene
-- con el instalador de EDB). Sin esto, "CREATE EXTENSION postgis"
-- fallara y la migracion no aplicara.
--
-- No se declaran en schema.prisma: son columnas GENERATED ALWAYS AS
-- (STORED) de tipo geography, y Prisma no tiene sintaxis para columnas
-- calculadas ni para el tipo geography. Se consultan via $queryRaw
-- (ST_DWithin, ST_Distance, etc.), igual que ya se hace para los demas
-- objetos crudos de esta base (triggers, CHECK constraints).
-- ═══════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE "geocercas" ADD COLUMN "geometria" geography(Polygon, 4326) GENERATED ALWAYS AS (
    ST_Buffer(
        ST_SetSRID(ST_MakePoint(centro_lng::float, centro_lat::float), 4326)::geography,
        radio_metros
    )
) STORED;

CREATE INDEX idx_geocercas_geometria ON geocercas USING gist(geometria);

ALTER TABLE "rastreo_gps" ADD COLUMN "posicion" geography(Point, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(lng::float, lat::float), 4326)::geography
) STORED;

CREATE INDEX idx_rastreo_gps_posicion ON rastreo_gps USING gist(posicion);
