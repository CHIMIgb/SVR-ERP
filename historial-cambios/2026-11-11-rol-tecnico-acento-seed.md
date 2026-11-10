# Bloque 7a review PR#17: acento del rol genérico en migración técnica + seed alineado

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

El rol genérico nació como `'Técnico'` (con acento, en
`20261108180000_roles_plantilla_y_usuarios`), pero
`20261108221000_roles_tecnicos_descriptivos` lo buscaba como `'Tecnico'`
(sin acento) en 5 lugares → la reasignación de técnicos jamás encontró al
usuario y su limpieza jamás corrió (el entorno local lo escondió porque se
corrigió a mano).

1. **Correo `'Tecnico'` → `'Técnico'` (5 referencias exactas, en la
   `20261108221000_roles_tecnicos_descriptivos/migration.sql`):** el JOIN de
   reasignación de usuarios + 3 DELETE de limpieza (users_roles,
   role_permissions, role_vistas, roles) — el match es exacto-sólo el rol
   genérico ("'Técnico'"), sin usar los 4 roles descriptivos nuevos
   ('Tecnico Mecanico' etc., que REalmente viven sin acento en BD
   (confirmado con SELECT en la BD local).
2. **"prisma/demo-seed.sql" alineado:** los usuarios técnico/soldador/
   diesel/mantenimiento ahora se enlazan a sus roles DESCRIPTIVOS
   ('Tecnico Mecanico', etc.). Antes se enlazaban al genérico 'Técnico'
   — que en un entorno fresco la migración corregida ELIMINA tras
   re-asignar: en un correo `seed-demo` habría dejado a los técnicos sin
   rol (RBAC en dev roto). En la BD local queda idempotente (INSERT 0).
3. **README:** la tabla de credenciales lista los nombres EXACTOS que viven
   en la BD ('Tecnico Mecanico', etc. — sin acento) en lugar del mojijo
   mixto que tenía (Técnico Mecanico).

## Archivos tocados

- `apps/api/prisma/migrations/20261108221000_roles_tecnicos_descriptivos/migration.sql`
- `apps/api/prisma/demo-seed.sql` (vínculos a roles descriptivos)
- `README.md` (tabla — nombres exactos de roles)

## Pruebas / verificación

- La migración editada — `migrate resolve --applied` + `migrate status`
  "Database schema is up to date!" + `prisma validate` OK.
- demo-seed re-ejecutado en local: idempotente (INSERT 0 / UPDATE 0).
- Grep del archivo: 0 referencias 'Tecnico' sin acento al rol genérico;
  5 con acento.

## Pendientes y riesgos

- **Sin push (orden del usuario)** — commit local.
- En BD remota la migración corregida correría por PRIMERA VEZ (creación de
  roles descriptivos + reasignación POR users.torre + el paso EXTRA que ya
  funciona: la limpieza del rol genérico ahora sí encuentra a los usuarios).
- Falta del plan: menores bloque 7 restantes (comment corrupto en page.tsx,
  .turbo → .gitignore, eliminar rotate-jwt-secrets.js, registros
  retroactivos 36 commits, decisión del borde del DataTable).
