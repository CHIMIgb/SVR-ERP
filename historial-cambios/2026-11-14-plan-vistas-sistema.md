# 2026-11-14 — Plan de las 3 vistas de Sistema (usuarios, equipos, identidad)

## Qué se hizo

Nuevo plan `docs-prioridades/PLAN-VISTAS-SISTEMA-USUARIOS-ROLES-EQUIPOS-2026-11-14.md`:
planeación y análisis de las 3 vistas del módulo Sistema que pidió el
cliente, con acceso exclusivo del rol Administrador y construcción una a
una:

- **V1 `/usuarios`** — CRUD de usuarios de escritorio (correo + contraseña);
  muestra la identidad PWA de quien la tenga (número de empleado, estado de
  PIN).
- **V2 `/equipos`** — Residentes ↔ sus empleados (`jefe_user_id`): asignar /
  re-asignar / des-asignar.
- **V3 `/roles`** — Gestión de identidad: ficha 360 (roles, vistas,
  permisos, área, jefe, PIN, sesiones) + acciones de mesa de ayuda
  (desbloquear, reiniciar PIN, cerrar sesiones) + CRUD de roles (sub-fase 3b).

## Hallazgos del análisis (verificados contra BD y código)

- **La BD ya está lista**: `users` tiene `numero_empleado`, `pin_*`,
  `jefe_user_id`, `torre`; `sessions`/`refresh_tokens` completas; el enum de
  auditoría ya tiene las acciones necesarias. **Cero migraciones de dominio**.
- **El backend de identidad ya existe y se reusa**: el alta de Trabajadores
  genera número + PIN temporal (con anti-carrera por sufijo máximo), y
  `auth/pin` ya expone reinicio y desbloqueo admin con permiso
  `sistema.usuarios.editar` — las acciones de mesa de ayuda de V3 no se
  duplican.
- **Los permisos ya existen** (`sistema.usuarios/roles/permisos.*`, 11) y
  **solo el rol Administrador los tiene** — no se crean permisos nuevos
  (regla anti-duplicado). Solo falta la migración seed de las 3 vistas del
  sidebar + `role_vistas` para admin.
- Lo que sí se construye: módulo `usuarios` en la API (no existe), 3 vistas,
  endpoint de jefe, cierre masivo de sesiones y CRUD de roles.
- Decisión D5: la asignación de jefe audita con `USUARIO_ACTUALIZADO` +
  metadata (sin migración de enum); D2: jefe y PIN = `sistema.usuarios.editar`.

## Orden acordado

Fase 1 (migración + módulo usuarios + `/usuarios`) → Fase 2 (`/equipos`) →
Fase 3 (`/roles`) → 3b (CRUD roles). Preguntas abiertas al cliente en §7
(no bloquean Fase 1).

## Verificación

- Cambio de docs únicamente; datos levantados con psql + grep del código
  real (schema, auth/pin, trabajadores.service, role_permissions).

## Pendientes / riesgos

- El plan queda en espera de autorización de Fase 1 para escribir código.
- Riesgo documentado en §8 del plan: listado de usuarios sensible
  (paginado, sin hashes), cierre de sesiones propio del admin, nombres de
  rutas definitivos solo hasta la migración.
