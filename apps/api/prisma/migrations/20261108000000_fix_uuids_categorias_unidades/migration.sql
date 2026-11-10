-- Corrige IDs "pseudo-UUID" del seed de unificar_ventas_inventario (20260909000000):
-- d2000000-0000-0000-0000-... (categorías Áridos/Materiales/Acero) y
-- d1000000-0000-0000-0000-... (unidades tonelada/viaje/bulto/pieza/bolsa).
-- Postgres acepta el formato, pero el nibble de versión (0000) y el de variante
-- (0000) violan el RFC 4122: class-validator 0.15+ (@IsUUID, validator.js)
-- los rechaza → 400 "categoriaId must be a UUID" al filtrar/crear en /inventario.
-- Fix: version=4, variante=8 (UUID v4-form). Mantener el sufijo para trazabilidad.
-- FKs hacia ambas tablas son ON UPDATE CASCADE:
-- los hijos (articulos_inventario, ordenes_compra_items, movimientos, ventas_items) se re-apuntan solos.
-- Idempotente: el WHERE deja de matchear después del fix.

UPDATE categorias_inventario
SET id = (substring(text(id), 1, 14) || '4000-8000-' || substring(text(id), 25))::uuid,
    actualizado_en = NOW()
WHERE text(id) LIKE 'd2000000-0000-0000-0000-%';

UPDATE unidades_medida
SET id = (substring(text(id), 1, 14) || '4000-8000-' || substring(text(id), 25))::uuid,
    actualizado_en = NOW()
WHERE text(id) LIKE 'd1000000-0000-0000-0000-%';
