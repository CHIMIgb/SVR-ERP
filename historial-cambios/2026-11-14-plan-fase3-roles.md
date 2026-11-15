# 2026-11-14 — Análisis y planeación de la Fase 3 (/roles) agregada al plan

## Qué se hizo

Análisis de la vista `/roles` (Gestión de Identidad) y su plan detallado
agregado como **§9** de
`docs-prioridades/PLAN-VISTAS-SISTEMA-USUARIOS-ROLES-EQUIPOS-2026-11-14.md`
(sin código — espera autorización).

## Hallazgos del análisis (verificados contra BD y código)

- `role_permissions` (178 filas, PK compuesta sin timestamps) y
  `role_vistas` (99 filas con los 5 flags) existen — agregar/quitar es
  insert/delete directo. 107 permisos, 39 vistas, 168 sesiones activas.
- **El enum de auditoría NO tiene acciones de catálogo de roles** (solo
  `ROL_ASIGNADO`/`ROL_REVOCADO`, que son de usuarios↔roles) — el CRUD de
  roles necesita valores nuevos. Propuestos 5: `ROL_CREADO`,
  `ROL_ACTUALIZADO`, `ROL_ELIMINADO`, `VISTAS_ROL_ACTUALIZADAS`,
  `PERMISOS_ROL_ACTUALIZADOS` (alternativa lean de 3 con metadata).
- **Los endpoints de PIN ya sirven tal cual**: `POST /auth/pin/reinicio`
  devuelve `{message, pinTemporal}` (el PIN temporal se muestra UNA VEZ
  — ya viene del backend) y `POST /auth/pin/desbloqueo`; ambos con
  `sistema.usuarios.editar`. El estado del PIN se deriva de `users`
  (intentos ≥ 5 / `pin_temporal_hasta`) — la ficha no necesita llamar a
  `pin.service`.
- Permisos `sistema.roles.*` y `sistema.permisos.{ver,editar}` existen y
  son exclusivos del rol Administrador — sin permisos nuevos.
- Guard transversal propuesto: el rol `es_sistema` (Administrador) es
  solo lectura en TODO (campos, vistas, permisos, eliminar).

## La propuesta (§9 del plan)

- Tab `/roles`: CRUD de roles (nombre/nivel/área/descripción, ROL_EN_USO
  al eliminar, es_sistema con candado) + por rol: gestión de **Vistas**
  (checkboxes con los 5 flags) y **Permisos** (matriz por módulo).
- Tab `/roles` → Usuarios: **ficha 360** por usuario (rol único, vistas y
  permisos heredados, área, jefe, estado de PIN, sesiones activas) +
  mesa de ayuda: Reiniciar PIN (muestra el temporal una vez), Desbloquear,
  Cerrar todas las sesiones (endpoint nuevo, con guard de no cerrar las
  propias).
- 3 preguntas al cliente en §9.3 antes de arrancar.

## Verificación

- Cambio de docs únicamente (§9 agregado al plan); datos con psql + grep
  del código real.

## Pendientes / riesgos

- Espera autorización + respuestas de §9.3 para escribir código.
- Riesgo mayor del diseño: editar vistas/permisos de un rol cambia lo que
  ese rol puede hacer en TODO el sistema — por eso los cambios van
  auditados con acción literal y el Administrador es intocable.
