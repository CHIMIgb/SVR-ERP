# Plan — PostGIS: instalación local (PG18) y despliegue en Railway

**Fecha:** 2026-11-15 · **Ejecución:** el 2026-11-16 (acordado)
**Origen:** pregunta del usuario — cómo instalar PostGIS en PostgreSQL 18 local y
cómo colocarlo en la BD, dado que al subir a Railway la BD necesita PostGIS.

---

## 1. Estado actual (verificado el 2026-11-15)

- **Local (PostgreSQL 18.6, Windows):** PostGIS **no está disponible ni instalado**
  (`pg_available_extensions` sin entradas `postgis%`). Instalado a propósito sin
  PostGIS, según el historial del repo.
- **El esquema ya está preparado para él:** la migración
  `apps/api/prisma/migrations/20260821020000_postgis_geometrias/migration.sql` está
  en el historial y fue aplicada **con skip elegante** (`CREATE EXTENSION IF NOT
  EXISTS postgis` dentro de `DO $$ ... $$` con `RAISE NOTICE`). Lo que falta crear:
  - `geocercas.geometria` — `geography(Polygon,4326)` GENERATED ALWAYS (círculo
    centro+radio), con índice GIST `idx_geocercas_geometria`.
  - `rastreo_gps.posicion` — `geography(Point,4326)` GENERATED ALWAYS desde
    lat/lng, con índice GIST `idx_rastreo_gps_posicion`.
- **La app hoy NO depende de PostGIS:** todo el radio/contención se resuelve con
  lat/lng + Haversine manual (regla del repo: "no declarar geometría en cambios
  nuevos; consultar por lat/lng"). Las columnas habilitan consultas espaciales
  reales cuando el GPS lo pida.
- `schema.prisma` **no declara** esas columnas (Prisma no soporta `geography`
  nativo) — fuente de la trampa del §3.

## 2. Instalación local en PostgreSQL 18 (Windows)

Como el PG18 es el instalador EDB:

1. **StackBuilder** (menú inicio → PostgreSQL 18 → StackBuilder) → categoría
   *Spatial Extensions* → **PostGIS bundle for PostgreSQL 18** (PostGIS 3.6) →
   instalar. Los binarios van a `share/extension` del servidor.
   - Alternativa sin StackBuilder: descargar el bundle desde
     `postgis.net/windows_downloads/` eligiendo PostgreSQL 18.
2. **NO re-aplicar con `prisma migrate`** — la migración ya está registrada como
   aplicada en ambas BDs. Re-ejecutar su SQL a mano (está idempotente a propósito):
   ```powershell
   $env:PGPASSWORD='admin123'
   psql -U postgres -h localhost -d svr_erp -v ON_ERROR_STOP=1 `
     -f "apps\api\prisma\migrations\20260821020000_postgis_geometrias\migration.sql"
   # repetir contra svr-erp-backup si se quiere
   ```
   Esto crea extensión + columnas + índices GIST en un solo paso.
3. Verificación:
   ```sql
   SELECT postgis_version();
   -- y: \d geocercas → debe aparecer la columna geometria + el índice GIST
   ```
4. Requisito de permisos: `CREATE EXTENSION postgis` exige superuser → usuario
   `postgres` local es superuser ✓ (en Railway el usuario también lo es).

## 3. ⚠️ Trampa crítica: drift de `migrate dev` — arreglar ANTES de crear columnas

Si las columnas existen y `schema.prisma` no las declara, el próximo
`npx prisma migrate dev` generará una migración que las **BORRA** (el shadow DB
replayea las migraciones — tendrá las columnas porque el `CREATE EXTENSION`
sí funcionará ahí — y el diff contra el schema las ve como sobrantes).

**Fix previo obligatorio** — declarar en `schema.prisma`:

```prisma
model geocercas {
  // ... campos actuales ...
  geometria Unsupported("geography")? @map("geometria")  // GENERATED, Prisma no la lee ni escribe
}

model rastreo_gps {
  // ... campos actuales ...
  posicion Unsupported("geography")? @map("posicion")
}
```

Validación posterior (diff debe salir VACÍO):

```powershell
cd apps/api
$env:DATABASE_URL='postgresql://postgres:admin123@localhost:5432/svr_erp'
npx prisma migrate diff --from-migrations ./prisma/migrations `
  --to-schema-datamodel ./prisma/schema.prisma `
  --shadow-database-url 'postgresql://postgres:admin123@localhost:5432/svr_shadow_erp'
```

**Matiz no verificado:** el atributo `GENERATED ALWAYS AS` no es expresable en
Prisma — es posible que el diff siga marcando la columna. Si pasa, opciones:
(a) aceptar el ruido solo en esas 2 columnas y documentarlo,
(b) quedarse con lat/lng+Haversine y NO crear las columnas hasta que se necesiten
(el sistema ya funciona así), tratando las columnas como SQL raw fuera del ciclo
de migraciones. Decidir con el diff real en mano.

## 4. Railway (estado verificado 2026-10/11 vía web)

- **El Postgres "managed" de Railway NO incluye PostGIS** y no admite plugins
  (confirmado por Railway en su foro, oct-2026: *"PostGIS isn't installed in that
  image… PostGIS only runs as single-node"*). También confirmado que **no hay HA
  con PostGIS** (los features HA/backups managed son solo de la imagen oficial).
- **Opciones en Railway, de mejor a peor para este proyecto:**
  1. **Template "PostgreSQL Extensions"** (`railway.com/deploy/postgresql-extensions`):
     **PostgreSQL 18** con PostGIS precompilado; variable `EXTENSIONS=postgis` y el
     entrypoint ejecuta `CREATE EXTENSION IF NOT EXISTS postgis` al boot. Encaja
     perfecto con nuestra migración existente (mismo PG major que local).
  2. Template "PostgreSQL with Extensions" (build-your-own, PG18):
     `PG_APT_PACKAGES=postgresql-18-postgis-3`.
  3. Imagen clásica `postgis/postgis:17-3.5` — **evitar**: PG17 vs PG18 local
     (mismatch al restaurar dumps entre entornos).
  4. Dockerfile propio `FROM postgis/postgis:18-3.x` — mismo resultado con control
     total (para cuando se quiera pin de versión).
- **Despliegue:** `migrate deploy` en el primer arranque de la API aplica el
  historial completo; la migración de PostGIS crea extensión+columnas sola si la
  extensión existe; si no, hace el mismo skip elegante de local (la app funciona
  con lat/lng igual que hoy).
- **Backups (consecuencia aceptada):** PostGIS en Railway = single node sin los
  backups managed de Railway → plan propio: `pg_dump` programado (servicio cron en
  Railway o job externo), mismo patrón que `svr_erp_export/` local.

## 5. Orden de ejecución para mañana (2026-11-16)

| # | Paso | Verificación |
|---|---|---|
| 1 | StackBuilder → PostGIS para PG18 | `pg_available_extensions` muestra `postgis` con default_version |
| 2 | Declarar `Unsupported("geography")` en schema.prisma (2 columnas) + `npx prisma generate` | tsc api OK |
| 3 | `migrate diff` (§3) → evaluar resultado | diff vacío o ruido documentado |
| 4 | Re-ejecutar el SQL de `20260821020000_postgis_geometrias` en `svr_erp` (y `svr-erp-backup`) | `SELECT postgis_version();` + `\d geocercas` con índice GIST |
| 5 | `migrate status` en ambas BDs | "up to date" (el re-run manual no toca el historial) |
| 6 | Commit del schema (si el diff quedó limpio) + registro | 1 commit `feat(db): declarar columnas geography en schema (postgis local)` |
| 7 | (Railway, cuando toque la subida) template PG18 + `EXTENSIONS=postgis` + job pg_dump | — |

## 6. Riesgos

- **Si se instala PostGIS y se crean columnas sin el §3**, el siguiente
  `migrate dev` las borrará con una migración silenciosa — orden 2 antes del 4.
- **Diff con `GENERATED ALWAYS`:** resultado incierto hasta correrlo (§3 matiz).
- **Railway sin HA/backups managed** con PostGIS — pg_dump propio obligatorio
  antes de pasar datos reales de producción.
- StackBuilder podría no listar PostGIS para PG18 si la instalación local no es
  la de EDB — en ese caso, descarga manual (`postgis.net/windows_downloads/`).

## Estado: APROBADO para ejecutar el 2026-11-16 (solo el §5 pasos 1-6; Railway más adelante)
