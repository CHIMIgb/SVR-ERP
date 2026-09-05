-- Tabla de configuración del sistema (key-value)
CREATE TABLE IF NOT EXISTS "configuracion_sistema" (
  "clave" VARCHAR(100) PRIMARY KEY,
  "valor" TEXT NOT NULL,
  "descripcion" TEXT,
  "tipo" VARCHAR(20) NOT NULL DEFAULT 'string', -- string, number, boolean, json
  "categoria" VARCHAR(50) NOT NULL DEFAULT 'general',
  "creado_en" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "actualizado_en" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "creado_por" UUID,
  "actualizado_por" UUID
);

-- Índice por categoría
CREATE INDEX IF NOT EXISTS "idx_configuracion_categoria" ON "configuracion_sistema" ("categoria");

-- Valores por defecto para horarios de turno
INSERT INTO "configuracion_sistema" ("clave", "valor", "descripcion", "tipo", "categoria", "creado_en", "actualizado_en")
VALUES 
  ('turno_apertura', '07:00', 'Hora de apertura del turno (formato HH:mm 24h)', 'string', 'turno', now(), now()),
  ('turno_cierre', '20:00', 'Hora de cierre del turno (formato HH:mm 24h)', 'string', 'turno', now(), now()),
  ('turno_tolerancia_minutos', '30', 'Minutos de tolerancia antes/después del cierre para permitir arqueo', 'number', 'turno', now(), now())
ON CONFLICT ("clave") DO NOTHING;

-- Permisos: solo Administrador puede ver/editar configuración
-- La vista /configuracion ya existe y tiene role_vistas para Administrador