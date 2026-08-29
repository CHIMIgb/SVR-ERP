-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('LOGIN_EXITOSO', 'LOGIN_FALLIDO', 'LOGOUT', 'TOKEN_REFRESCADO', 'TOKEN_REVOCADO', 'SESION_CERRADA', 'USUARIO_CREADO', 'USUARIO_ACTUALIZADO', 'USUARIO_ELIMINADO', 'ROL_ASIGNADO', 'ROL_REVOCADO', 'PERMISO_MODIFICADO', 'VISTA_CREADA', 'VISTA_ACTUALIZADA', 'VISTA_ELIMINADA', 'PERSONA_CREADA', 'PERSONA_ACTUALIZADA', 'DOCUMENTO_CREADO', 'DOCUMENTO_ACTUALIZADO', 'DOCUMENTO_ELIMINADO', 'REPORTE_CREADO', 'REPORTE_ACTUALIZADO', 'REPORTE_ELIMINADO', 'ESTATUS_CAMBIADO', 'PAGO_REGISTRADO', 'PAGO_ACTUALIZADO', 'PAGO_ELIMINADO', 'NOMINA_PROCESADA', 'COMBUSTIBLE_CARGADO', 'MAQUINA_ASIGNADA', 'MAQUINA_LIBERADA', 'USUARIO_BLOQUEADO', 'IP_BLOQUEADA', 'ARTICULO_CREADO', 'ARTICULO_ACTUALIZADO', 'ARTICULO_ELIMINADO', 'MOVIMIENTO_REGISTRADO', 'STOCK_BAJO_DETECTADO', 'STOCK_BAJO_RESUELTO', 'STOCK_INSUFICIENTE', 'BITACORA_CREADA', 'BITACORA_ACTUALIZADA', 'BITACORA_ELIMINADA', 'MANTENIMIENTO_REGISTRADO', 'MANTENIMIENTO_ACTUALIZADO', 'MANTENIMIENTO_ELIMINADO', 'COMBUSTIBLE_ACTUALIZADO', 'COMBUSTIBLE_ELIMINADO', 'INCIDENTE_CREADO', 'INCIDENTE_ACTUALIZADO', 'INCIDENTE_ELIMINADO', 'INCIDENTE_RESUELTO', 'INCIDENTE_REPORTADO', 'PROYECTO_CREADO', 'PROYECTO_ACTUALIZADO', 'PROYECTO_ELIMINADO', 'PROYECTO_FINANZAS_ACTUALIZADO', 'REGISTRO_CRIBA_CREADO', 'REGISTRO_CRIBA_ACTUALIZADO', 'REGISTRO_CRIBA_ELIMINADO', 'TRANSACCION_CREADA', 'TRANSACCION_ACTUALIZADA', 'TRANSACCION_ELIMINADA', 'CLIENTE_CREADO', 'CLIENTE_ACTUALIZADO', 'CLIENTE_ELIMINADO', 'COTIZACION_CREADA', 'COTIZACION_ACTUALIZADA', 'COTIZACION_ELIMINADA', 'VENTA_CREADA', 'RETIRO_REGISTRADO', 'CIERRE_CAJA_REGISTRADO', 'ERROR_SISTEMA');
ALTER TABLE "registro_auditoria" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "public"."AuditAction_old";
COMMIT;

-- AlterEnum
ALTER TYPE "MetodoPago" ADD VALUE 'TRANSFERENCIA';


-- CreateTable
CREATE TABLE "materiales_venta" (
    "id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT,
    "unidad_base" TEXT NOT NULL,
    "stock" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,
    "creado_por" UUID,
    "actualizado_por" UUID,
    "eliminado_en" TIMESTAMPTZ,

    CONSTRAINT "materiales_venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiales_precio" (
    "id" UUID NOT NULL,
    "material_id" UUID NOT NULL,
    "medida" TEXT NOT NULL,
    "precio" DECIMAL(12,2) NOT NULL,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materiales_precio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" UUID NOT NULL,
    "folio" TEXT NOT NULL,
    "ticket" INTEGER NOT NULL,
    "terminal" TEXT NOT NULL DEFAULT 'TER-01',
    "caja" TEXT NOT NULL DEFAULT 'CAJA-PV',
    "cliente" TEXT NOT NULL DEFAULT 'Público en general',
    "cajero" TEXT NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "iva" DECIMAL(12,2) NOT NULL,
    "ieps" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "efectivo_recibido" DECIMAL(12,2),
    "cambio" DECIMAL(12,2),
    "descuento_pct" DECIMAL(5,2),
    "descuento_total" DECIMAL(12,2),
    "autorizado_por" TEXT,
    "items_count" INTEGER NOT NULL,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,
    "creado_por" UUID,
    "eliminado_en" TIMESTAMPTZ,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas_items" (
    "id" UUID NOT NULL,
    "venta_id" UUID NOT NULL,
    "material_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "medida" TEXT NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "descuento_pct" DECIMAL(5,2),
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventas_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas_pagos" (
    "id" UUID NOT NULL,
    "venta_id" UUID NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventas_pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retiros_caja" (
    "id" UUID NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "autorizado_por" TEXT NOT NULL,
    "cajero" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "hora" TEXT NOT NULL,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,
    "creado_por" UUID,
    "eliminado_en" TIMESTAMPTZ,

    CONSTRAINT "retiros_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cierres_caja" (
    "id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "cajero" TEXT NOT NULL,
    "ventas_count" INTEGER NOT NULL,
    "total_ventas" DECIMAL(12,2) NOT NULL,
    "efectivo_inicial" DECIMAL(12,2) NOT NULL,
    "ventas_efectivo" DECIMAL(12,2) NOT NULL,
    "total_retiros" DECIMAL(12,2) NOT NULL,
    "esperado" DECIMAL(12,2) NOT NULL,
    "contado" DECIMAL(12,2) NOT NULL,
    "diferencia" DECIMAL(12,2) NOT NULL,
    "fondo_siguiente" DECIMAL(12,2) NOT NULL,
    "notas" TEXT,
    "denominaciones" JSONB NOT NULL,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,
    "creado_por" UUID,

    CONSTRAINT "cierres_caja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "materiales_venta_sku_key" ON "materiales_venta"("sku");

-- CreateIndex
CREATE INDEX "materiales_precio_material_id_idx" ON "materiales_precio"("material_id");

-- CreateIndex
CREATE UNIQUE INDEX "materiales_precio_material_id_medida_key" ON "materiales_precio"("material_id", "medida");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_folio_key" ON "ventas"("folio");

-- CreateIndex
CREATE INDEX "ventas_creado_en_idx" ON "ventas"("creado_en");

-- CreateIndex
CREATE INDEX "ventas_ticket_creado_en_idx" ON "ventas"("ticket", "creado_en");

-- CreateIndex
CREATE INDEX "ventas_items_venta_id_idx" ON "ventas_items"("venta_id");

-- CreateIndex
CREATE INDEX "ventas_items_material_id_idx" ON "ventas_items"("material_id");

-- CreateIndex
CREATE INDEX "ventas_pagos_venta_id_idx" ON "ventas_pagos"("venta_id");

-- CreateIndex
CREATE INDEX "retiros_caja_fecha_idx" ON "retiros_caja"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "cierres_caja_fecha_key" ON "cierres_caja"("fecha");

-- CreateIndex
CREATE INDEX "cierres_caja_fecha_idx" ON "cierres_caja"("fecha");

-- AddForeignKey
ALTER TABLE "materiales_precio" ADD CONSTRAINT "materiales_precio_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materiales_venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_items" ADD CONSTRAINT "ventas_items_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_items" ADD CONSTRAINT "ventas_items_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materiales_venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_pagos" ADD CONSTRAINT "ventas_pagos_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

