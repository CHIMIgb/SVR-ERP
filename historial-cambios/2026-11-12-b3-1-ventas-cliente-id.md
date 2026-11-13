# 2026-11-12 — B3.1: ventas.cliente_id (FK a clientes, nullable)

## Qué se hizo

Fase B3.1 (cliente real en el POS): la tabla `ventas` puede apuntar al catálogo
real de clientes.

- **`apps/api/prisma/schema.prisma`**:
  - `ventas` gana `cliente_id String? @db.Uuid` con comentario, la relación
    `clientes clientes?` y el índice `@@index([cliente_id])`.
  - `clientes` gana la back-relation `ventas ventas[]`.
- **`apps/api/prisma/migrations/20261112140000_ventas_cliente_id/migration.sql`**
  — solo lo propio (ADD COLUMN, índice y FK `ventas_cliente_id_fkey` con
  `ON DELETE SET NULL`: si un cliente se borra físicamente, la venta queda con
  su snapshot de nombre en la columna `cliente` de texto). El drift
  preexistente del repo no se tocó.
- Los clientes se borran lógico (soft delete), así que la FK SET NULL es solo
  la red de seguridad del borrado físico.

## Verificación

- `npx prisma validate` OK; `migrate diff` tras aplicar muestra solo el drift
  preexistente documentado.
- `psql`: columna `cliente_id` nullable presente; migración registrada en
  `_prisma_migrations`.
- `npx prisma generate` regenerado.

## Pendientes / riesgos

- La columna está vacía: nada la llena todavía (backend en B3.2, sin hacer).
- Las ventas existentes siguen con `cliente` de texto y `cliente_id` NULL.
