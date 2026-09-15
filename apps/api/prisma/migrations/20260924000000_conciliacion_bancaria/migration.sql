-- Conciliación bancaria MVP: catálogo de bancos, cuentas y movimientos
ALTER TYPE "AuditAction" ADD VALUE 'BANCO_CREADO';
ALTER TYPE "AuditAction" ADD VALUE 'CUENTA_BANCARIA_CREADA';
ALTER TYPE "AuditAction" ADD VALUE 'MOVIMIENTO_BANCARIO_CREADO';
ALTER TYPE "AuditAction" ADD VALUE 'MOVIMIENTO_BANCARIO_LOTE_CARGADO';
ALTER TYPE "AuditAction" ADD VALUE 'MOVIMIENTO_CONCILIADO';
ALTER TYPE "AuditAction" ADD VALUE 'MOVIMIENTO_DESCONCILIADO';

-- CreateTable
CREATE TABLE "bancos" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,
    "creado_por" UUID,
    CONSTRAINT "bancos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_bancarias" (
    "id" UUID NOT NULL,
    "banco_id" UUID NOT NULL,
    "numero" TEXT NOT NULL,
    "nombre" TEXT,
    "saldo_inicial" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,
    "creado_por" UUID,
    CONSTRAINT "cuentas_bancarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_bancarios" (
    "id" UUID NOT NULL,
    "cuenta_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "descripcion" TEXT NOT NULL,
    "deposito" DECIMAL(14,2),
    "retiro" DECIMAL(14,2),
    "conciliado" BOOLEAN NOT NULL DEFAULT false,
    "transaccion_id" UUID,
    "conciliado_en" TIMESTAMPTZ,
    "conciliado_por" UUID,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,
    "creado_por" UUID,
    CONSTRAINT "movimientos_bancarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bancos_nombre_key" ON "bancos"("nombre");
CREATE INDEX "bancos_activo_idx" ON "bancos"("activo");
CREATE UNIQUE INDEX "cuentas_bancarias_numero_key" ON "cuentas_bancarias"("numero");
CREATE INDEX "cuentas_bancarias_banco_id_activo_idx" ON "cuentas_bancarias"("banco_id", "activo");
CREATE INDEX "movimientos_bancarios_cuenta_id_fecha_idx" ON "movimientos_bancarios"("cuenta_id", "fecha");
CREATE INDEX "movimientos_bancarios_transaccion_id_idx" ON "movimientos_bancarios"("transaccion_id");
CREATE INDEX "movimientos_bancarios_conciliado_idx" ON "movimientos_bancarios"("conciliado");
CREATE UNIQUE INDEX "movimientos_bancarios_cuenta_id_fecha_descripcion_deposito__key" ON "movimientos_bancarios"("cuenta_id", "fecha", "descripcion", "deposito", "retiro");

-- AddForeignKey
ALTER TABLE "cuentas_bancarias" ADD CONSTRAINT "cuentas_bancarias_banco_id_fkey" FOREIGN KEY ("banco_id") REFERENCES "bancos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimientos_bancarios" ADD CONSTRAINT "movimientos_bancarios_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas_bancarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimientos_bancarios" ADD CONSTRAINT "movimientos_bancarios_transaccion_id_fkey" FOREIGN KEY ("transaccion_id") REFERENCES "transacciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;