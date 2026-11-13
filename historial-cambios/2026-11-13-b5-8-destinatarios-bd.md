# 2026-11-13 — B5.8: destinatarios explícitos (usuario/torre) y fin del filtro por vista

## Qué se hizo

Rediseño del modelo de audiencia (decisión del cliente): **las notificaciones
se dirigen explícitamente al emitir** (a un usuario, a un área/torre, a un rol
o a todos) y se **desacoplan del menú** — recibir no exige acceso a la vista.

- **`apps/api/prisma/schema.prisma`** — `notificaciones` gana:
  - `destinatario_user_id` (FK users, ON DELETE SET NULL): destinatario
    PERSONAL (ej. "te asignaron el reporte").
  - `audiencia_torre` (`CategoriaReporte`, el enum de `users.torre`):
    audiencia por ÁREA (ej. "se creó un reporte de tu área").
  - Índices por ambas columnas y back-relation en `users`.
- **Migración `20261113050000_notificaciones_destinatarios`** — columnas,
  índices, FK + **revert de 20261113041000** (DELETE del acceso a
  /proveedores del rol Administrativo, que solo existió para el filtro por
  vista ya retirado).
- El filtro por ACCESO A VISTA (mapa `referencia_tipo → ruta` y la consulta a
  `role_vistas`) se retira del backend en B5.9 (siguiente commit) — el where
  nuevo usa los destinatarios explícitos + el rol + el actor.

## Verificación

- `npx prisma validate` OK; `migrate diff` tras aplicar solo muestra el drift
  preexistente documentado.
- `psql`: 2 columnas nuevas presentes; el grant de /proveedores a
  Administrativo eliminado (0 filas).
- Migración registrada; cliente regenerado.

## Pendientes / riesgos

- El service sigue filtrando por vista (código viejo): **el buzón está
  parcialmente roto hasta B5.9** — no probar notificaciones en el navegador
  antes de ese commit.
