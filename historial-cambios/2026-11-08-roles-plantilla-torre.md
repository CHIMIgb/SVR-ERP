# Roles de plantilla (5) con área-torre + usuarios demo + herencia de "misma área"

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

Registry de los 5 roles de nueva-info con su ubicación (torre) **atadis al rol**,
conectando así el alta de /reportes ("misma área") con el sistema de RBAC:

- `roles.torre` (CategoriaReporte, nullable) nueva; asignada también al
  Administrador y Encargado de RRHH (ADMINISTRATIVO).
- 5 roles: Administrativo(80)/ADMINISTRATIVO · Residente(90)/RESIDENTE ·
  Técnico(70)/MECANICO · Cobrador(60)/ADMINISTRATIVO · Trabajador(20)/NULL.
- role_permissions + role_vistas por rol (dashboard + /reportes):
  - Administrativo: ver/crear/editar/eliminar/exportar (todo).
  - Residente y Técnico: ver/crear/editar (iniciar/cerrar/asignar).
  - Cobrador: solo ver.
  - Trabajador: ver/crear.
- 5 personas + 5 usuarios demo (users_roles con es_principal) — emails y
  passwords-documentados en README (tabla nueva junto a admin/rrhh).

**Herencia de la torre** (resolver del service + `buildUserProfile`):
`user.torre (overrides) → torre del rol principal → ADMINISTRATIVO (office)`.
El perfil (`GET /auth/profile`/login) ahora entrega `torre` (UserAuth/AuthResponse).

Unit tests: 71/71 reportes (+2 casos nuevos: torre por rol) y 64/64 auth.

Archivos: migration `20261108180000_roles_plantilla_y_usuarios`, schema
(roles.torre), auth.service (+ buildUserProfile), reportes-campo service/Spec,
README, shared types (UserAuth).

## Pruebas / verificación

- E2E real: login técnico → torre=MECANICO, 2 vistas;西域 área → nace
  categoria=Mecanico; iniciar (Editar perm) OK; **delete → FORBIDDEN** (RBAC
  real). Login cobrador → solo ver, crear → FORBIDDEN.
- Los roles / usuarios quedaron en la BD via `migrate deploy` (idempotente).

## Pendientes y riesgos

- El filtrado **por torre al listar** (ver solo los de tu área) es el diseño de
  la vista del empleado del siguiente giro — hoy todos ven el listado completo.
- Trabajador sin torre: "misma área" cae en oficina; si el cliente decide otra
  área para este rol, UPDATE en `roles.torre`.
