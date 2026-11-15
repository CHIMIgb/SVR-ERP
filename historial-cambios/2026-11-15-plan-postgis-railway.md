# Plan documentado — PostGIS en PG18 local y en Railway

**Fecha:** 2026-11-15
**Autor:** Agente (análisis pedido por el usuario; solo documentación, sin código.
Ejecución acordada para el 2026-11-16.)

## Cambios realizados
- Documentado el análisis completo en
  `docs-planes/PLAN-POSTGIS-PG18-RAILWAY-2026-11-15.md`:
  - Estado verificado: PostGIS no disponible en el PG18 local; la migración
    `20260821020000_postgis_geometrias` ya está aplicada con skip elegante y su SQL
    es idempotente (se re-ejecuta a mano, NO con prisma migrate).
  - Instalación local: StackBuilder (Spatial Extensions → PostGIS para PG18) o
    descarga manual; luego re-run del SQL contra `svr_erp`/`svr-erp-backup`.
  - Trampa crítica documentada: si las columnas se crean y schema.prisma no las
    declara, el próximo `migrate dev` las BORRARÍA → declarar
    `Unsupported("geography")` en `geocercas.geometria` y `rastreo_gps.posicion`
    ANTES, y validar con `migrate diff`.
  - Railway (verificado web, oct-2026): el Postgres managed NO incluye PostGIS ni
    HA; opciones rankeadas — template "PostgreSQL Extensions" (PG18 +
    `EXTENSIONS=postgis`, encaja con la migración existente), build-your-own
    PG18, evitar `postgis/postgis:17` por mismatch con PG18 local; backups con
    pg_dump propio (sin managed backups en imagen custom).
  - Orden de ejecución para mañana (7 pasos) y riesgos.

## Archivos tocados
- `docs-planes/PLAN-POSTGIS-PG18-RAILWAY-2026-11-15.md` (nuevo)

## Verificación
- Solo documentación: no se tocó código; no aplica tsc/eslint/tests.
- Datos verificados en vivo: `pg_available_extensions` vacía de postgis,
  versión PG 18.6 local, modelos `geocercas`/`rastreo_gps` sin columnas
  geography en schema.prisma, migración idempotente revisada línea a línea.
- Railway verificado con búsqueda web (foro Railway oct-2026: PostGIS solo
  single-node, no en imagen oficial; docs de templates con PG18 + PostGIS).

## Pendientes / riesgos
- Ejecutar mañana el §5 pasos 1-6 (StackBuilder → schema → diff → re-run SQL).
- Matiz sin verificar: el diff de Prisma contra columnas `GENERATED ALWAYS AS`
  puede marcar drift no expresable — se decide con el diff real en mano.
- Railway queda para cuando se haga la subida (no mañana).
