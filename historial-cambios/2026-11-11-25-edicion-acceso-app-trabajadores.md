# 2026-11-11 — Fix review PR #18 #8: rol y encargado corregibles en edición + dar acceso a trabajadores sin cuenta

## Problema (review del PR #18, punto 8)

Los campos de acceso a la app (rol, encargado) solo aparecían en el ALTA
(bloque `!editando` del `TrabajadorFormModal`). Si se elegía mal el rol no
había cómo cambiarlo, y los trabajadores dados de alta **antes** de P14 no
tenían forma de recibir acceso a la app.

## Cambios

**Backend (`apps/api/src/trabajadores`):**
- `create-trabajador.dto.ts` — DTO anidado nuevo `AccesoPwaDto`
  (`rolId` obligatorio, `encargadoId` opcional; `''` quita al jefe).
  `UpdateTrabajadorDto` += `acceso?: AccesoPwaDto`.
- `trabajadores.service.ts`:
  - `vinculosAcceso()` extendido: trae también **rol principal** y
    **jefe_user_id** de la cuenta (además de usuarioId/numeroEmpleado del #6).
  - `toResponse()` expone `rolAccesoId` / `rolAccesoNombre` / `encargadoUserId`.
  - `update()` con `dto.acceso`:
    - valida el rol contra `ROLES_ASIGNABLES_WHERE` (misma regla del alta —
      nada de Administrador) → `ACCESO_ROL_INVALIDO` audita FAIL;
    - valida el encargado (Residente activo) → `ENCARGADO_INVALIDO`;
    - **cuenta existente**: actualiza la fila `users_roles` principal
      (rol_id) y `jefe_user_id` (solo si el campo viene); audita
      **`ROL_ASIGNADO`** con previousValue/newValue;
    - **sin cuenta**: crea la identidad completa (persona + user con
      numero_empleado por sufijo máximo + PIN temporal 24 h + rol/jefe)
      en transacción con reintento P2002 — helper nuevo
      `otorgarCuentaAcceso()` / `crearFilaCuentaAcceso()`; audita
      **`USUARIO_CREADO`** (el temporal NUNCA en claro, §8.9) y devuelve
      `identidad` en la respuesta;
    - la respuesta re-resuelve el vínculo DESPUÉS de la transacción (el
      rol/jefe nuevos en `rolAccesoId`).

**Front (`apps/web`):**
- `lib/api.ts` — `TrabajadorDTO` += `rolAccesoId/rolAccesoNombre/encargadoUserId`;
  tipo `TrabajadorAccesoInput`; `actualizar()` acepta `acceso` y devuelve
  `TrabajadorDTO & { identidad? }`.
- `TrabajadorFormModal.tsx` — la sección de acceso ahora sale **también en
  edición**:
  - con cuenta: selects precargados (rol actual, encargado actual) + nota
    con su número de empleado; solo se envía `acceso` si cambió algo;
  - sin cuenta: checkbox **"Dar acceso a la app móvil"** + selects (rol
    requerido al activarlo); al guardar crea la cuenta y el temporal sale
    por el MISMO `CredencialesAccesoModal` (vía el `onGuardado` de la vista).

## Verificación / pruebas

- Unit backend: 49/49 — 5 tests nuevos (cambio de rol con ROL_ASIGNADO
  prev/nuevo, jefe tocado solo si viene, otorgamiento con identidad +
  temporal fuera de la auditoría, ACCESO_ROL_INVALIDO, ENCARGADO_INVALIDO).
- Integración BD real: 21/21 — 2 tests nuevos: cambio de rol real (fila
  `users_roles` actualizada + audit SUCCESS) y otorgamiento a un trabajador
  creado directo en BD (persona+user creados, temporal fuera de la
  auditoría, limpieza FK-safe).
- `npx tsc --noEmit` limpio (api y web); eslint limpio en los archivos
  front tocados.

## Pendientes / riesgos

- **Smoke visual pendiente** (no hay infra front): editar un trabajador con
  cuenta → cambiar rol → guardar; y un trabajador sin cuenta → marcar
  "Dar acceso" → elegir rol → guardar → debe abrir el modal de credenciales
  con el temporal.
- El vínculo cuenta↔trabajador sigue siendo el match por persona
  (nombre+teléfono): si el PATCH cambia nombre/teléfono de un trabajador
  con cuenta, el vínculo se resuelve con los valores FINALES y rompería el
  match con la persona del alta (deuda del diseño P14 — vigilar si se
  habilita renombrar). En la práctica el alta usa los mismos datos y el
  select de rol solo cambia el rol, no el nombre.
- Cambiar el rol NO cierra sesiones (el claim de vistas del token viejo
  sigue hasta el refresh — 15 min): si se necesita efecto inmediato, se
  puede cerrar sesión desde la Vista B (P12).
