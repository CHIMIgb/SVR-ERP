# Fix: UUIDs inválidos en categorías/unidades del inventario

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

Bug: en `/inventario`, filtrar por las categorías "Áridos"/"Materiales"/"Acero"
arrojaba `BAD_REQUEST: categoriaId must be a UUID`. Mismo destino para crear un
artículo con las unidades `tonelada/viaje/bulto/pieza/bolsa`.

Causa raíz (NO es el frontend ni el filtro): la migración
`20260909000000_unificar_ventas_inventario` insertó IDs pseudo-UUID
(`d2000000-0000-0000-0000-000000000002`, `d1000000-0000-...`). PostgreSQL los
acepta (solo valida formato), pero violan el RFC 4122: el nibble de versión
(grupo 3) y el de variante (grupo 4) son `0000`. Con `class-validator 0.15` +
validator.js moderno, `@IsUUID` los rechaza de facto. Las demás categorías
(Refacciones, Lubricantes, Neumáticos) tienen UUIDs reales y filtraban bien.

Fix: nueva migración SQL idempotente que corrige versión=4 y variante=8 en los 8
IDs fake (→ `d2000000-0000-4000-8000-...` / `d1000000-0000-4000-8000-...`,
sufijo-preservado para trazabilidad). FKs hacia `categorias_inventario` y
`unidades_medida` son `ON UPDATE CASCADE`, así que los hijos
(`articulos_inventario`: 12 articulos, `ordenes_compra_items`, etc.) se
re-apuntaron solos. No se edita la migración vieja (rompería el checksum de
`_prisma_migrations`, cuyo historial fue reconstruido en el baseline).

## Cosas nuevas

- Migración `20261108000000_fix_uuids_categorias_unidades` (SQL, idempotente).

## Archivos tocados

- `apps/api/prisma/migrations/20261108000000_fix_uuids_categorias_unidades/migration.sql` (nuevo)

## Pruebas / verificación

- Repro del validador: `validator/lib/isUUID(fake,'all') === false`,
  `isUUID(fixed,'all') === true` (class-validator 0.15.1).
- `npx prisma migrate deploy` — aplicada OK (vía `deploy`, no `dev`: el shadow
  DB truena con `seed_rbac` por el historial reconstruido; problema conocido).
- Post-migración: los 3 categorías + 5 unidades con IDs v4-form; conteos de
  articulos por categoria preservados (Áridos 7, Materiales 3, Acero 2).
- End-to-end contra API corriendo (`GET /api/inventario?categoriaId=...`,
  token admin): Materiales/Áridos/Acero → `success:true` con
  pagination.total = 3/7/2. Antes: 400 en las 3.

## Pendientes y riesgos

- IDs de DB cambiaron. Grep en repo: nada más hardcodea estos IDs fuera del
  docs-planes/`IMPLEMENTACIONES-A-FUTURO.md` (doc de planes, se deja tal cual).
- Si algún cliente externo/cache guardó los IDs fake, dejaron de validar —
  no aplica al app (los catálogos se leen fresco del backend).
- Aplicar migraciones futuras vía `migrate deploy`; `migrate dev` sigue roto
  por el shadow DB (sin tablas base en `_prisma_migrations` reconstruido).
