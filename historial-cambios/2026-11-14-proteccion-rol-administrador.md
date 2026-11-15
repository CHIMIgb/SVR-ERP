# 2026-11-14 — El rol Administrador no se reasigna ni se toca desde la app

## Los huecos que encontró el cliente

1. **Ficha 360 del admin**: el select de rol mostraba "Seleccionar..." (el
   rol `es_sistema` no está en las opciones) y permitía asignarle otro rol
   → el backend `cambiarRol` no validaba el rol ACTUAL del usuario →
   **degradar al único Administrador dejaba el ERP sin gobierno**.
2. **/usuarios**: los botones Desactivar/Eliminar aparecían en la propia
   fila del admin (fallarían con toast: guards self + último admin), ruido
   de UX.
3. "Cerrar sesiones (139)" en la propia ficha: el guard self lo bloquearía
   — trampa de UX.

## Qué se hizo

### API (`5b83ed28`)
- **`cambiarRol`**: si el rol ACTIVO del usuario es `es_sistema` →
  **`ROL_SISTEMA_PROTEGIDO`** (ForbiddenException + auditoría FAIL) — el
  rol Administrador jamás se reasigna ni se quita desde la app, ni a uno
  mismo ni a nadie. Cubre la ficha 360 Y el editar de /usuarios (que
  delega en cambiarRol). Nota: no impedir editar el PROPIO perfil (correo,
  contraseña) — solo el rol.
- Tests: unitario nuevo + integración real (cambiar el rol del admin seed →
  FAIL, el rol queda intacto con `es_sistema`, auditoría registrada).

### Web
- **Ficha 360**: si el rol actual es `es_sistema` → el rol se muestra como
  **texto con candado** (no select); el flag `esSistema` ahora viaja en la
  ficha (`GET /usuarios/:id/identidad`).
- **Ficha 360**: el botón "Cerrar sesiones" se oculta en la propia cuenta
  (usar "Cerrar sesión" del menú).
- **/usuarios**: los botones Desactivar/Activar y Eliminar se ocultan en la
  propia fila (solo para ti mismo; sobre otros usuarios todo sigue).

## Verificación

- `npx tsc --noEmit` (web y api) limpio. Unit **54/54**; integración
  **24/24** (incluye el guard nuevo contra la BD real: el rol del admin
  seed queda intacto tras el intento).
- Smoke visual en navegador pendiente (sin navegador).

## Pendientes / riesgos

- Si el cliente algún día quiere 2+ administradores, cambiar el rol de un
  no-es_sistema a Administrador también está bloqueado (nunca se ASIGNA el
  rol es_sistema desde la app — el alta de un segundo admin sería una
  decisión de producto aparte, p. ej. por SQL o un flujo dedicado).
