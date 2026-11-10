# Bloque 2 review PR#17: usuarios demo fuera de migraciones (seed protegido)

**Fecha:** 2026-11-10
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

Continuación del plan `docs-planes/plan-revision-pr17.md` (bloque 1 ya hecho:
purga de nueva-info del historial, valores SHAs nuevos 3e043f20/14a15ad0/32dca833).

### Los 3 problemas migraciones→seed
- `20261108180000_roles_plantilla_y_usuarios`: SECCIÓN 4 (personas + users +
  users_roles, 5 cuentas) fuera; quedan roles/torre/role_permissions/role_vistas.
- `20261108230000_usuarios_por_area`: completo retirado (personas, users con
  torre explícita, vínculo al rol Técnico y su `UPDATE torre='MECANICO'`).
  El archivo queda como no-op documentado.
- `20261109010000_equipo_residente_demo`: completo retirado (personas, users
  con jefe_user_id, vínculo al rol Trabajador). Archivo no-op documentado.
- Los comentarios con contraseñas (`tecnico123`, `trabajador123`) y los hashes
  de contraseñas en el SQLmigraron **fuera del repo** (los hashes tampoco van).

### Nuevo `apps/api/prisma/demo-seed.sql` (ejecución manual en dev)
- Contiene TODAS las cuentas del plantel demo (10 personas/usuarios + vínculos
  de rol) en UN solo archivo idempotente (NOT EXISTS / ON CONFLICT).
- La contraseña llega por **variable de psql** (`-v pass_hash=...`): no vive
  en el repo el hash ni la contraseña; el operador la define al ejecutar.
- Corrección técnica: `jefe_user_id` del equipo del residente se pobla en un
  UPDATE aparte (Postgres no ve las filas insertadas en el mismo
  INSERT...SELECT — bug que habría dejado jefe NULL en BD fresca).
- Seed probado en la BD local: idempotente (todos los INSERT 0 / UPDATE 0 —
  ya existen cuentas y jeefes).

### Reconciliación de la BD local
- `prisma migrate resolve --applied` para las 3 migraciones editadas
  (checksync de archivos ya aplicados) y sin error.
- De visa: `_prisma_migrations` tenía 28 registros baseline faltantes
  (consecuencia del borrado de filas fallidas del 09-nov) + las 3 del
  04-nov (PR#16) sin registrar → se resolvieron como aplicadas SIN ejecutar
  su SQL (el esquema ya las tiene): `migrate status` = "DB up to date".
- `prisma validate` OK; `nest build` OK; smoke: login admin success y
  GET /reportes-campo items=10; puerto 3001 liberado después.

### README
- La tabla de credenciales del plantel humano demo ahora aclara que las
  cuentas NO se crean con `migrate` y se siembran a mano con
  `demo-seed.sql`; contraseñas de la tabla = sugerencia para dev.

## Archivos tocados

- `apps/api/prisma/migrations/20261108180000_roles_plantilla_y_usuarios/migration.sql`
- `apps/api/prisma/migrations/20261108230000_usuarios_por_area/migration.sql` (no-op)
- `apps/api/prisma/migrations/20261109010000_equipo_residente_demo/migration.sql` (no-op)
- `apps/api/prisma/demo-seed.sql` (nuevo)
- `README.md` (nota de credenciales)

## Pruebas / verificación

- `prisma migrate status` = "Database schema is up to date!" (37 registros
  metastore, camino limpio para deploys).
- `prisma validate` OK; `nest build` OK; smoke REST login+lista OK.
- demo-seed.sql ejecutado en local: 0 nuevas filas (idempotente).

## Pendientes y riesgos

- Los usuarios demo que ya existen en la BD local mantienen sus contraseñas
  viejas (el seed solo reponía si faltaban): nada cambió para quien ya estaba
  manejando cuentas locales.
- Un deploy de servidor que haya corrido las migraciones VIEJAS del merge
 历史 tomado del repo o si el branch se desplegó antes de esta corrección —
  en el servidor cambia el checksum del migrate deploy viejo → esto no aplica
  porque el PR #17 aún no se fusiona: los servidores correrán el SQL ya
  corregido por primera vez. En caso de haber corrido el SQL viejo, hacer
  `migrate resolve --applied` de las 3.
- El bloque 3 (ámbito en 6 métodos) sigue abierto — siguiente paso.
