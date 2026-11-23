# Perfil móvil concedido a todos los roles activos

**Fecha:** 2026-11-18
**Autor:** agente

## Cambios realizados
- Nueva migración seed idempotente `20261118010000_pwa_perfil_todos_roles`: concede `/m/perfil` («Mi perfil (móvil)») con `puede_ver = true` a los seis roles activos (Administrador, Administrativo, Cobrador, Residente, Tecnico y Trabajador).
- INSERT con `NOT EXISTS` para los roles sin fila en `role_vistas` y UPDATE condicional sobre `puede_ver = false` (era el caso de Residente). No se crean duplicados porque `role_vistas` solo tiene PK sobre `id`.

## Cosas nuevas
- `apps/api/prisma/migrations/20261118010000_pwa_perfil_todos_roles/migration.sql`

## Archivos tocados
- `apps/api/prisma/migrations/20261118010000_pwa_perfil_todos_roles/migration.sql` (creado)
- `historial-cambios/2026-11-18-pwa-perfil-todos-roles.md` (creado)

## Verificación / pruebas
- `npx prisma migrate deploy` aplicó la migración en `svr_erp` sin error.
- Consulta de control: los 6 roles activos quedaron con `puede_ver = true` en `/m/perfil`.
- Re-ejecución del SQL dentro de `BEGIN / ROLLBACK`: mismo resultado, sin filas nuevas (`NOT EXISTS` + UPDATE condicional).
- No se corrió `tsc`, lint ni tests: el cambio es solo SQL de seed de RBAC, sin código TS.

## Pendientes y riesgos
- No se corrió la suite de integración: la migración toca `role_vistas`, no `registro_auditoria`.
- La navegación no cambia visualmente: `/m/perfil` no es pestaña, se abre desde el header. El cambio hace que `user.vistas` lo incluya para todos los roles.
- El documento `docs-planes/docs-pwa/VISTAS-PWA.md` sigue con su redacción anterior (afirma que Perfil es común a todos los roles, lo que ahora sí es cierto en BD); los alias «Reportar» y «Cobro» y el ajuste de Diésel quedaron fuera por decisión del usuario.
- Producción tomará la migración al desplegar; aquí solo se aplicó en la BD local.
