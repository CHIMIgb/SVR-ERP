-- AuditActions del modulo de GPS: CRUD de geocercas, cruces de geocerca
-- detectados al procesar posiciones, y generacion de posiciones simuladas.

-- AlterEnum (PostgreSQL 12+: multiples ADD VALUE en la misma transaccion)
ALTER TYPE "AuditAction" ADD VALUE 'GEOCERCA_CREADA';
ALTER TYPE "AuditAction" ADD VALUE 'GEOCERCA_ACTUALIZADA';
ALTER TYPE "AuditAction" ADD VALUE 'GEOCERCA_ELIMINADA';
ALTER TYPE "AuditAction" ADD VALUE 'GEOCERCA_ENTRADA_DETECTADA';
ALTER TYPE "AuditAction" ADD VALUE 'GEOCERCA_SALIDA_DETECTADA';
ALTER TYPE "AuditAction" ADD VALUE 'GPS_POSICIONES_SIMULADAS';

-- Telemetria de temperatura de motor en el ping de GPS (la envia el equipo
-- telematico junto con velocidad/odometro; nullable porque no todos los
-- dispositivos la reportan).
ALTER TABLE "rastreo_gps" ADD COLUMN "temperatura_motor" DECIMAL(5,2);
