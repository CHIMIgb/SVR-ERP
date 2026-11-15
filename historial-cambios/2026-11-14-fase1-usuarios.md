# 2026-11-14 — Fase 1 del plan de vistas de Sistema: /usuarios (backend, BD y web)

## Qué se hizo

Primera fase de `PLAN-VISTAS-SISTEMA-USUARIOS-ROLES-EQUIPOS-2026-11-14.md`
(respuestas del cliente: identidad de trabajadores se queda en
/trabajadores, `/roles` también editará roles, rutas confirmadas, auditoría
de jefe con migración de enum — esa parte es de la Fase 2).

**Commit `7df77e0e` — BD:**
- Migración `20261114010000_vista_usuarios_sistema`: vista `/usuarios`
  (orden 51, icono UserCog) + `role_vistas` SOLO para Administrador con
  todos los flags. Aplicada con `prisma db execute` + `migrate resolve`
  (`migrate dev` no funciona en esta BD restaurada; la BD física no tiene
  defaults en `actualizado_en` → timestamps explícitos en el SQL).
- Se decidió crear SOLO la vista de esta fase (no las 3 de golpe) para no
  dejar entradas del sidebar hacia páginas inexistentes.

**Commit `9a59fa39` — API (módulo nuevo `usuarios`):**
- `GET /usuarios` (paginado default 10/techo 100, search por nombre/email/
  número de empleado, filtros rolId/estado), `GET /usuarios/stats`
  (total/activos/conIdentidad/bloqueados), `GET /usuarios/catalogos`
  (roles asignables sin `es_sistema` + personas sin cuenta de acceso).
- `POST /usuarios`: persona del catálogo (o alta rápida), email único
  (pre-check + P2002 → `EMAIL_DUPLICADO`), bcrypt rounds 12, rol principal.
  Rol `es_sistema` rechazado (`ROL_NO_ASIGNABLE`, patrón de trabajadores).
- `PATCH /usuarios/:id` (email/activo/torre), `DELETE /usuarios/:id`
  (soft delete + cierre de sesiones con `motivo_cierre='usuario_eliminado'`;
  guards: no auto-eliminarse, no eliminar al último Administrador).
- `POST /usuarios/:id/roles` (asignar con es_principal en transacción) y
  `DELETE /usuarios/:id/roles/:rolId` (revocar; guard de último rol).
- Serialización sin `password_hash`/`pin_hash`; `pinEstado` derivado
  (NORMAL/TEMPORAL/BLOQUEADO con el umbral real de auth/pin = 5 intentos).
- Los 4 estándares: JWT + blacklist, auditoría SUCCESS y FAIL + error_code
  con patrón `fallir()`. Permisos existentes `sistema.usuarios.*` (sin
  permisos nuevos, regla anti-duplicado).
- Tests: unitarios **26/26**; integración contra BD real **12/12**
  (registro_auditoria SUCCESS/FAIL reales, unicidad de email real, soft
  delete cierra sesiones, DELETE contra registro_auditoria rechazado por
  el trigger, listado sin eliminados).

**Commit fix — UUIDs legados:** los IDs del seed (`e0000000-...`, el admin
`c0000000-...`) NO pasan `@IsUUID`/`ParseUUIDPipe` (bits de versión en 0 —
mismo gotcha ya documentado en B9 con `vendedorId`). Cambios:
- DTOs `rolId`/`personaId` → `@IsString` (pre-check en service).
- Controller sin `ParseUUIDPipe` en `:id`/`:rolId` (el service da
  `USUARIO_NO_ENCONTRADO` si no existe).

**Commit web — vista `/usuarios`:**
- `lib/api.ts`: `UsuarioDTO`, `UsuariosStats`, `UsuariosCatalogos`,
  `usuariosApi` (listar/stats/catalogos/crear/actualizar/eliminar/
  asignarRol/revocarRol).
- `app/(dashboard)/usuarios/page.tsx` con la plantilla `/inventario`:
  PageHeader, 4 StatsCards (texto neutro, sin badges), SearchBar + filtros
  (rol, estado) + chips, DataTable (usuario/email, roles, área, identidad
  PWA + estado PIN, estado, creado, acciones por RBAC), Pagination
  server-side, FormModal crear (persona del catálogo o alta rápida,
  contraseña min 8), editar (email/estado/área + gestión de roles al
  instante), eliminar con confirmación.
- Gates: `npx tsc --noEmit` limpio (web y api); eslint solo el error
  preexistente `react-hooks/set-state-in-effect` (línea del fetchData —
  deuda conocida de todas las vistas).

## Verificación (smoke real contra API :3001)

- Stats: `{total:35, activos:35, conIdentidad:31, bloqueados:0}`; catálogo:
  5 roles, 246 personas sin usuario; listado 35 paginado.
- Ciclo completo: crear "Smoke Fase1 Test" (rol Residente) → duplicado
  rechazado con `EMAIL_DUPLICADO` → editar torre → asignar "Administrativo"
  → revocarlo → eliminar. En `registro_auditoria`: SUCCESS y
  `EMAIL_DUPLICADO`/FAIL con actor real.
- Smoke visual en navegador pendiente (sin navegador).

## Pendientes / riesgos

- La gestión de roles en el modal de editar se aplica AL INSTANTE (el
  backend audita cada asignación/revocación); cerrar el modal sin "Guardar"
  no revierte los cambios de roles (comportamiento intencional).
- El listado incluye usuarios seed de demo sin rol activo ("PinInt ...",
  con roles vacíos) — se muestran con "—"; si molestan, se filtran con el
  filtro de rol o se limpian del seed.
- Faltan las fases 2 (`/equipos` + endpoint de jefe con migración de enum
  `JEFE_ASIGNADO`) y 3 (`/roles` — gestión de identidad).
