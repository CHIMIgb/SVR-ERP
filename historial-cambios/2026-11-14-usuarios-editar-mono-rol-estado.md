# 2026-11-14 — /usuarios: editar = misma captura, mono-rol y estado como acción

## Qué se hizo (plan autorizado por el cliente)

### 1. Editar = MISMA captura que crear
- **API**: `PATCH /usuarios/:id` ampliado — ahora recibe nombre, apellidos,
  teléfono (actualiza la **persona** vinculada), correo, contraseña opcional
  (vacía = conserva la actual; se re-hash con bcrypt si viene), `rolId`
  (cambia el rol único) y torre. El `activo` salió de este endpoint.
- **Web**: el modal de editar usa el MISMO formulario que crear
  (componente compartido `CapturaUsuario`): Nombre · Apellidos · Teléfono ·
  Correo · Contraseña (opcional en edición) · Rol Principal · Área.
- Para prellenar el formulario, el serializer ahora expone los datos de la
  persona separados (`personaNombre`, `apellidoPaterno`, `apellidoMaterno`,
  `telefono`) además del nombre completo para la tabla — sin endpoint nuevo.

### 2. Mono-rol (sin multi-rol)
- **API**: se eliminaron `POST /usuarios/:id/roles` y
  `DELETE /usuarios/:id/roles/:rolId`; su lugar lo toma
  **`PATCH /usuarios/:id/rol`** (`CambiarRolDto`): en transacción desactiva
  el rol activo y crea el nuevo como principal. Audita `ROL_ASIGNADO` con
  `metadata {modo:'cambio', rolAnterior, rolNuevo}`. El mismo rol →
  `ROL_YA_ASIGNADO`. El update ya delega aquí si el rol cambió (fail-fast
  del rol ANTES de tocar nada).
- **Web**: la sección de chips de roles desapareció — el rol se cambia con
  el select "Rol Principal" del formulario de editar.

### 3. Estado como acción propia
- **API**: nuevo `PATCH /usuarios/:id/estado` (`EstadoUsuarioDto`): activar
  / desactivar. Guards: no desactivarse a sí mismo
  (`NO_PUEDE_DESACTIVARSE_A_SI_MISMO`) y no desactivar al último
  Administrador (`ULTIMO_ADMINISTRADOR` — helper compartido con la baja).
  Al desactivar **cierra sus sesiones activas** (`motivo_cierre
  'cuenta_desactivada'`), como en la baja. Audita `USUARIO_ACTUALIZADO`
  con `metadata {campo:'activo', valor, anterior}`.
- **Web**: en la columna de acciones hay un botón **Desactivar**
  (secundario/ámbar `PowerOff`) o **Activar** (verde `Power`) con **modal
  de confirmación**; el select "Estado" salió del formulario.

## Verificación

- `npx tsc --noEmit` (web y api) limpio; `npx jest src/usuarios`:
  **31/31 unitarios**; integración BD real: **16/16** (rol único cambia con
  auditoría y metadata, desactivar cierra sesiones reales y queda en
  `registro_auditoria`, guards de self/último admin).
- Smoke real contra :3001: crear usuario → editar con captura completa
  (persona editada, teléfono nuevo, torre cambiada) → cambiar rol a
  Cobrador → desactivar con sesión activa previa (cerrada, 0 activas,
  cuenta `activo=f`) → auditoría: `USUARIO_ACTUALIZADO` (activo),
  `ROL_ASIGNADO` (modo cambio) — el smoke se limpió con soft delete.
- eslint: solo el error patrón preexistente (`set-state-in-effect`).
- Smoke visual en navegador pendiente (sin navegador).

## Pendientes / riesgos

- Los usuarios de demo sin rol activo ("PinInt...") al editar no traen rol
  preseleccionado — el submit exige elegir uno (comportamiento deseado).
- La desactivación de cuentas con identidad PWA no toca el PIN (solo
  sesiones) — el PIN/bloqueo lo sigue gestionando auth/pin.
- Fase 3 (`/roles` — gestión de identidad) sigue pendiente.
