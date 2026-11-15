# 2026-11-14 — /usuarios: editar el Administrador con correo y rol bloqueados

## Qué se hizo

Al editar un usuario cuyo rol es `es_sistema` (Administrador):

- **Correo Electrónico en solo lectura** (`readOnly`) — la identidad de
  acceso del admin no se toca.
- **Rol Principal deshabilitado** — mostraba "Seleccionar..." (el rol
  `es_sistema` no está en el catálogo del select); ahora muestra el rol
  actual ("Administrador") fijo vía prop `rolActual`.
- El resto del formulario sigue editable (nombre, apellidos, teléfono,
  contraseña opcional, área).
- La muralla final sigue siendo el backend: `cambiarRol` rechaza el cambio
  de rol `es_sistema` (`ROL_SISTEMA_PROTEGIDO`, commit `5b83ed28`).

Cambios de soporte: `UsuarioRoleDTO` ahora expone `esSistema` (el
serializer de la lista de usuarios lo incluye) y `CapturaUsuario` recibe
las props `bloqueado` y `rolActual`.

## Verificación

- `npx tsc --noEmit` (web y api): limpio; eslint solo el error patrón
  preexistente.
- Unit/integration de usuarios corren sin cambios de comportamiento (el
  serializer agrega un campo).
- Smoke visual en navegador pendiente (sin navegador).
