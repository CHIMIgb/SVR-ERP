# 2026-11-12 — B2.1: obra 1:1 con el proyecto — índice único + backfill de las 6 obras faltantes

## Qué se hizo

Primera fase de **B2** (plan comercial/operaciones §10): alinear los datos a la
relación **1:1 proyecto ↔ obra** sin tocar todavía el backend ni la UI.

1. **`apps/api/prisma/schema.prisma`** — `model obras`: `@@index([proyecto_id])`
   pasa a `@@unique([proyecto_id])`. La BD garantiza una sola obra por proyecto
   (el índice único también cubre las búsquedas por FK).
2. **Migración `20261112030000_obras_1a1`** (una sola, transaccional):
   - `DROP INDEX obras_proyecto_id_idx` + `CREATE UNIQUE INDEX obras_proyecto_id_key`.
   - **Backfill idempotente**: una obra por cada proyecto vivo sin obra (hereda
     `nombre`, estado mapeado `FINALIZADO → FINALIZADA` / resto `EN_PROCESO`, y
     `ubicacion` compuesta con calle/colonia/ciudad/estado). Guard `NOT EXISTS`.
   - **Normalización de estados**: obras de proyectos FINALIZADO que seguían
     EN_PROCESO pasan a FINALIZADA (caso "Puente Atizapán").

**Sin cambios de código**: `proyectos.service` todavía no crea obras (eso es
B2.2). Ningún endpoint, DTO, permiso ni vista se tocó.

## Verificación

Respaldo previo: `pg_dump -Fc svr_erp` → `%TEMP%\opencode\svr_erp_pre_b2_1.dump`.

- **Datos**: 9 proyectos vivos / **9 obras** / 0 obras huérfanas (antes: 3 obras,
  6 proyectos sin obra). "Puente Atizapán" quedó obra FINALIZADA con proyecto
  FINALIZADO; "Pavimentación Av. Bahía" nació FINALIZADA (proyecto finalizado);
  las 3 obras que ya existían conservaron su estado.
- **Ubicaciones**: las 6 obras nuevas heredaron la dirección del proyecto
  (`ubicacion` ya no viene vacía en `/catalogos/proyectos`).
- **Índice**: `obras_proyecto_id_key` UNIQUE sobre `proyecto_id`; el índice
  simple anterior ya no existe.
- **Registro de migración**: `_prisma_migrations` marca
  `20261112030000_obras_1a1` como aplicada (se aplicó con
  `prisma db execute` + `migrate resolve --applied`, porque el historial
  reconstruido no se puede replayar en la shadow DB).
- `npx prisma validate` ✅ · `npx prisma generate` ✅ ·
  `npx prisma migrate diff` ya **no** reporta el índice de `obras` (solo queda el
  drift preexistente: 3 índices en BD, `users.pin_historial`/`intentos_pin` NOT
  NULL y la FK de `categorias_puesto.rol_id`).
- `npm run test`: **1316 passed / 2 failed** — los 2 fallos son de
  `cobranza.service.spec.ts` (CSV `ATRASO_GRAVE`) y **ya fallaban sin este
  cambio** (verificado con stash).
- `npx jest --config jest.integration.config.js src/proyectos`: **10/10 passed**.

## Pendientes / riesgos

- **B2.2–B2.4 no implementadas**: `proyectos.service.create` aún no crea la obra,
  así que un proyecto nuevo por API quedará sin obra hasta esa fase. Mientras
  tanto los catálogos solo reflejan los 9 proyectos existentes.
- **`migrate dev` no sirve en este repo** para crear migraciones: la shadow DB
  falla en `seed_rbac` (historial reconstruido sin init). Para la próxima:
  `migrate diff` + carpeta manual + `db execute` + `migrate resolve --applied`.
- **Drift preexistente** detectado y NO tocado (3 índices, 2 columnas NOT NULL,
  FK de `categorias_puesto.rol_id`) — es de otro cambio, no de B2.
- `seed-proyectos-demo.sql` inserta proyectos por SQL directo: si se vuelve a
  correr después de B2.2 creará proyectos sin obra.
- `PAUSADO` no tiene equivalente en `EstadoObra`: la obra de "Oficinas
  distribuidora Tokio" quedó EN_PROCESO (sigue en el catálogo) — decisión D2 de
  §10 pendiente de confirmar con el cliente.
