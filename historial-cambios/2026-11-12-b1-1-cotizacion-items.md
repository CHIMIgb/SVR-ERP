# 2026-11-12 — B1.1: tabla `cotizacion_items` y condiciones precargadas en BD

## Qué se hizo

Fase B1.1 del plan (partidas de cotización, §1 fila B1): la base de datos ya
puede guardar los renglones que hoy solo viven en los Word
(`docs-svr/COTIZACION 37/50.docx`).

- **`apps/api/prisma/schema.prisma`**:
  - Modelo nuevo **`cotizacion_items`**: `cotizacion_id` FK a `cotizaciones`
    (ON DELETE CASCADE), `descripcion`, `cantidad` Decimal(10,4), `unidad`,
    `precio_unitario` Decimal(12,2), `importe` Decimal(12,2), `orden` Int
    default 0, timestamps de auditoría (`creado_en/actualizado_en/creado_por/
    actualizado_por`). Sin soft delete propio: las partidas viven y mueren con
    la cotización. Índice `cotizacion_items_cotizacion_id_idx`.
  - `cotizaciones` gana la columna `condiciones` `String?` (el texto precargado
    del Word) y la back-relation `items cotizacion_items[]`.
  - Back-relations `cotizacion_items_actualizado_porTousers` /
    `_creado_porTousers` en `users` (convención existente).
- **`apps/api/prisma/migrations/20261112060000_cotizacion_items/migration.sql`**
  — solo las sentencias propias (CREATE TABLE, ADD COLUMN, índice y 3 FKs);
  el drift preexistente del repo (enum `AuditAction`, FK
  `categorias_puesto`, índices `reportes_campo/subcategorias/users_jefe`,
  `users.pin_historial/intentos_pin` NOT NULL) queda intacto, fuera del diff.
- Sin permisos nuevos: se reusa `comercial.cotizaciones.*`.

## Verificación

- `npx prisma validate` — OK.
- `npx prisma generate` — cliente regenerado con `cotizacion_items`.
- Migración aplicada y registrada con el método de esta BD (`prisma db execute`
  + `migrate resolve --applied`; `migrate dev` no funciona con el historial
  reconstruido).
- `psql \d cotizacion_items`: columnas, PK, índice y las 3 FKs correctas
  (cascade hacia `cotizaciones`, SET NULL hacia `users`).
- `psql`: `cotizaciones.condiciones` existe (nullable).
- `migrate diff --from-config-datasource` tras aplicar: solo queda el drift
  preexistente documentado (no aparece `cotizacion_items` ni `condiciones`).

## Pendientes / riesgos

- La tabla está vacía: ninguna cotización existente tiene partidas (flujos
  antiguos siguen funcionando planos — eso lo garantiza B1.2, aún sin hacer).
- `monto` de `cotizaciones` sigue siendo campo libre: el backend todavía no lo
  recalcula desde los importes (fase B1.2).
