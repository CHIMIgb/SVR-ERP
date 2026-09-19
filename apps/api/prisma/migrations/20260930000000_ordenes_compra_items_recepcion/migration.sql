-- SVR-ERP: Fase 7 — Recepción de OC → Inventario
-- Migración aditiva 20260930000000_ordenes_compra_items_recepcion
-- Tabla de líneas/detalle de OC + nueva acción de auditoría.
-- Aditiva y cerrada: NO toca ninguna tabla existente (solo ALTER TYPE + CREATE TABLE + FK).

-- 1. AuditAction nueva
ALTER TYPE "AuditAction" ADD VALUE 'ORDEN_COMPRA_RECIBIDA';

-- 2. Tabla ordenes_compra_items (articulo_id nullable: NULO si aún no está catalogado)
CREATE TABLE "ordenes_compra_items" (
    "id"                UUID NOT NULL,
    "orden_compra_id"   UUID NOT NULL,
    "articulo_id"       UUID,
    "nombre"            TEXT NOT NULL,
    "cantidad"          DECIMAL(10,2) NOT NULL,
    "cantidad_recibida" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "precio_unitario"   DECIMAL(12,2) NOT NULL,
    "activo"            BOOLEAN NOT NULL DEFAULT true,
    "creado_en"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en"    TIMESTAMPTZ NOT NULL,
    "actualizado_por"   UUID,
    "creado_por"        UUID,
    "eliminado_en"      TIMESTAMPTZ,

    CONSTRAINT "ordenes_compra_items_pkey" PRIMARY KEY ("id")
);

-- 3. Índices
CREATE INDEX "ordenes_compra_items_orden_compra_id_idx" ON "ordenes_compra_items"("orden_compra_id");
CREATE INDEX "ordenes_compra_items_articulo_id_idx" ON "ordenes_compra_items"("articulo_id");

-- 4. FKs
ALTER TABLE "ordenes_compra_items" ADD CONSTRAINT "ordenes_compra_items_orden_compra_id_fkey"
    FOREIGN KEY ("orden_compra_id") REFERENCES "ordenes_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ordenes_compra_items" ADD CONSTRAINT "ordenes_compra_items_articulo_id_fkey"
    FOREIGN KEY ("articulo_id") REFERENCES "articulos_inventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;