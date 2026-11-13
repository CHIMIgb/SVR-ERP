# 2026-11-13 — B4.1: ordenes_compra.fecha_vencimiento (DATE nullable)

## Qué se hizo

Fase B4.1 (fecha de vencimiento en CxP):

- **`apps/api/prisma/schema.prisma`** — `ordenes_compra` gana
  `fecha_vencimiento DateTime? @db.Date` con comentario. La columna
  `cuentas_por_pagar.fecha_vencimiento` YA existía (nullable) y no se tocó.
- **`apps/api/prisma/migrations/20261113020000_ordenes_compra_fecha_vencimiento/migration.sql`**
  — solo el `ALTER TABLE ... ADD COLUMN` (el drift preexistente del repo queda
  fuera del diff, como siempre).
- El /finanzas (flujo neto) ya lee `cuentas_por_pagar.fecha_vencimiento`, así
  que al llenarse la columna vía backend (B4.2) esa vista se corrige sola.

## Verificación

- `npx prisma validate` OK; `migrate diff` tras aplicar solo muestra el drift
  preexistente documentado.
- `psql`: columna `fecha_vencimiento` presente, `is_nullable = YES`, tipo
  `date`. Migración registrada en `_prisma_migrations`.
- `npx prisma generate` regenerado.

## Pendientes / riesgos

- La columna está vacía en todas las OCs existentes: nada la llena todavía
  (backend en B4.2, sin hacer).
