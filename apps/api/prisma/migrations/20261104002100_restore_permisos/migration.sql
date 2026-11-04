-- Restauración de la tabla `permisos` (solicitudes de vacaciones/RRHH)
-- Pedida de vuelta por el usuario el 2026-11-04 tras el drop de tablas fantasma.
-- El SQL es el diff exacto schema ↔ BD (prisma migrate diff) para dejar la tabla
-- idéntica a lo que define schema.prisma.

-- CreateEnum
CREATE TYPE "TipoPermiso" AS ENUM ('VACACIONES', 'PERMISO', 'INCAPACIDAD');

-- CreateTable
CREATE TABLE "permisos" (
    "id" UUID NOT NULL,
    "trabajador_id" UUID NOT NULL,
    "tipo" "TipoPermiso" NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "estado" "EstadoPermiso" NOT NULL DEFAULT 'PENDIENTE',
    "motivo" TEXT NOT NULL,
    "dias_solicitados" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,
    "codigo" TEXT,
    "actualizado_por" UUID,
    "aprobador_id" UUID,
    "creado_por" UUID,
    "eliminado_en" TIMESTAMPTZ,
    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permisos_codigo_key" ON "permisos"("codigo");
-- CreateIndex
CREATE INDEX "permisos_trabajador_id_idx" ON "permisos"("trabajador_id");

-- AddForeignKey
ALTER TABLE "permisos" ADD CONSTRAINT "fk_permisos_actualizado_por" FOREIGN KEY ("actualizado_por") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
-- AddForeignKey
ALTER TABLE "permisos" ADD CONSTRAINT "fk_permisos_aprobador" FOREIGN KEY ("aprobador_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
-- AddForeignKey
ALTER TABLE "permisos" ADD CONSTRAINT "fk_permisos_creado_por" FOREIGN KEY ("creado_por") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
-- AddForeignKey
ALTER TABLE "permisos" ADD CONSTRAINT "permisos_trabajador_id_fkey" FOREIGN KEY ("trabajador_id") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
