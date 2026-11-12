-- ══════════════════════════════════════════════════════════════════════════
-- USUARIOS DEMO (solo DEV — NO correr en producción)
-- ══════════════════════════════════════════════════════════════════════════
-- Retirados de las migraciones por la review del PR #17: migrar equivalentía
-- a crear cuentas con contraseña conocida en servidores.
--
-- EJECUCIÓN (todas las cuentas comparten UNA contraseña que tú eliges):
--   1. Genera el hash bcrypt de la contraseña que quieras usar (una sola vez):
--        cd apps/api
--        node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 10))" SuaContraseñaDev
--   2. Ejecuta el seed pasando el hash como variable:
--        psql -U postgres -d svr_erp -v pass_hash='<pegar-hash-aqui>' -f prisma/demo-seed.sql
--   3. Entra con: <email-demo> / SuaContraseñaDev
--
-- La contraseña NO vive en el repo ni en el SQL: el hash llega por variable.
-- Idempotente: reprime duplicados por id/email y vínculos por NOT EXISTS.
-- ══════════════════════════════════════════════════════════════════════════

-- ══ roles cubiertos: plantilla (5) + técnico de área (torres Explícitas) + equipo del residente ══

-- Personas del plantel demo
INSERT INTO personas (id, nombre, apellido_paterno, apellido_materno, correo, telefono, activo, creado_en, actualizado_en)
SELECT v.id::uuid, v.nombre_p, v.ap1, v.ap2, NULL, v.tel, true, NOW(), NOW()
FROM (VALUES
  ('e1000000-0000-0000-0000-0000000000a1', 'Laura',  'Administrativo', 'Oficina',      NULL),
  ('e1000000-0000-0000-0000-0000000000a2', 'Óscar',  'Residente',      'de Obra',      NULL),
  ('e1000000-0000-0000-0000-0000000000a3', 'Rubén',  'Técnico',        'de Flota',     NULL),
  ('e1000000-0000-0000-0000-0000000000a4', 'Carla',  'Cobradora',      'de Criba',     NULL),
  ('e1000000-0000-0000-0000-0000000000a5', 'Juan',   'Trabajador',     'de Campo',     NULL),
  ('e1000000-0000-0000-0000-0000000000b1', 'Carlos', 'Soldador',       'de Planta',    '55 1234 0011'),
  ('e1000000-0000-0000-0000-0000000000b2', 'Denis',  'Repartidor',     'de Diesel',    '55 1234 0012'),
  ('e1000000-0000-0000-0000-0000000000b3', 'Moises', 'Mantenimiento',  'General',      '55 1234 0013'),
  ('e1000000-0000-0000-0000-0000000000c1', 'Pedro',  'Chofer',         'de Obra',      '55 1234 0021'),
  ('e1000000-0000-0000-0000-0000000000c2', 'Luis',   'Operador',       'de Patio',     '55 1234 0022')
) AS v(id, nombre_p, ap1, ap2, tel)
WHERE NOT EXISTS (SELECT 1 FROM personas p WHERE p.id = v.id::uuid);

-- Un usuario demo por cuenta (misma contraseña para todos, hash por variable)
-- NOTA: jefe_user_id se pobla en el UPDATE de abajo — en un INSERT...SELECT
-- Postgres no ve las filas insertadas por el mismo statement (snapshot único).
INSERT INTO users (id, persona_id, email, password_hash, email_verificado, activo, torre, jefe_user_id, preferencias, creado_en, actualizado_en)
SELECT v.id::uuid, v.persona_id::uuid, v.email, :'pass_hash', true, true,
       v.torre::"CategoriaReporte",
       NULL,
       '{}', NOW(), NOW()
FROM (VALUES
  ('e2000000-0000-0000-0000-0000000000a1', 'e1000000-0000-0000-0000-0000000000a1', 'administrativo@svr-constructora.com',  'ADMINISTRATIVO'),
  ('e2000000-0000-0000-0000-0000000000a2', 'e1000000-0000-0000-0000-0000000000a2', 'residente@svr-constructora.com',       'RESIDENTE'),
  ('e2000000-0000-0000-0000-0000000000a3', 'e1000000-0000-0000-0000-0000000000a3', 'tecnico@svr-constructora.com',         'MECANICO'),
  ('e2000000-0000-0000-0000-0000000000a4', 'e1000000-0000-0000-0000-0000000000a4', 'cobrador@svr-constructora.com',        'ADMINISTRATIVO'),
  ('e2000000-0000-0000-0000-0000000000a5', 'e1000000-0000-0000-0000-0000000000a5', 'trabajador@svr-constructora.com',      NULL),
  ('e2000000-0000-0000-0000-0000000000b1', 'e1000000-0000-0000-0000-0000000000b1', 'soldador@svr-constructora.com',        'SOLDADOR'),
  ('e2000000-0000-0000-0000-0000000000b2', 'e1000000-0000-0000-0000-0000000000b2', 'diesel@svr-constructora.com',          'DIESEL'),
  ('e2000000-0000-0000-0000-0000000000b3', 'e1000000-0000-0000-0000-0000000000b3', 'mantenimiento@svr-constructora.com',   'MANTENIMIENTO'),
  ('e2000000-0000-0000-0000-0000000000c1', 'e1000000-0000-0000-0000-0000000000c1', 'pedro.chofer@svr-constructora.com',    NULL),
  ('e2000000-0000-0000-0000-0000000000c2', 'e1000000-0000-0000-0000-0000000000c2', 'luis.operador@svr-constructora.com',   NULL)
) AS v(id, persona_id, email, torre)
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = v.email);

-- Vínculos usuario ↔ rol
INSERT INTO users_roles (id, user_id, rol_id, es_principal, activo, asignado_en)
SELECT gen_random_uuid(), u.id, r.id, true, true, NOW()
FROM users u
JOIN (VALUES
  ('administrativo@svr-constructora.com', 'Administrativo'),
  ('residente@svr-constructora.com',      'Residente'),
  ('tecnico@svr-constructora.com',        'Tecnico'),
  ('cobrador@svr-constructora.com',       'Cobrador'),
  ('trabajador@svr-constructora.com',     'Trabajador'),
  ('soldador@svr-constructora.com',       'Tecnico'),
  ('diesel@svr-constructora.com',         'Tecnico'),
  ('mantenimiento@svr-constructora.com',  'Tecnico'),
  ('pedro.chofer@svr-constructora.com',   'Trabajador'),
  ('luis.operador@svr-constructora.com',  'Trabajador')
) AS v(email, rol_nombre) ON u.email = v.email
JOIN roles r ON r.nombre = v.rol_nombre
WHERE NOT EXISTS (
  SELECT 1 FROM users_roles ur WHERE ur.user_id = u.id AND ur.rol_id = r.id
);

-- Jefe del equipo demo del residente (statement aparte: el INSERT de arriba
-- no ve sus propias filas dentro del mismo statement).
UPDATE users
SET jefe_user_id = (SELECT id FROM users WHERE email = 'residente@svr-constructora.com'), actualizado_en = NOW()
WHERE email IN ('pedro.chofer@svr-constructora.com', 'luis.operador@svr-constructora.com')
AND jefe_user_id IS NULL;
