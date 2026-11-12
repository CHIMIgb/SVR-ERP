# 2026-11-12 — El botón "Eliminar" de /reportes respeta el permiso real (solo Administrador)

## Problema (detectado en la app por el SVR)

Tras retirar `reportes_campo.eliminar` al rol Administrativo, María López
(Administrativo) seguía viendo el botón **Eliminar** en `/reportes`. Causa:
el front gateaba el botón por `vista.puedeEliminar` (tabla `role_vistas`,
que seguía en `true` para Administrativo), mientras el API se gatea por el
**permiso** — dos fuentes que se desalinean cuando un permiso se revoca.

## Cambios

- **Front** `apps/web/src/app/(dashboard)/reportes/page.tsx`: `puedeEliminar`
  ahora sale del **permiso real** (`user.permisos`: operaciones /
  reportes_campo / eliminar) — misma fuente que el API, patrón del botón
  "Reiniciar PIN". `puedeCrear`/`puedeEditar` siguen por vistas (sin cambios).
- **BD — migración `20261112020000_reportes_eliminar_solo_admin`
  (idempotente):** `role_vistas.puede_eliminar = false` para Administrativo
  en `/reportes` — ambas capas quedan alineadas. (Incidente: la primera
  corrida falló por una columna `actualizado_en` inexistente en
  `role_vistas` — corregido, `migrate resolve --rolled-back` + re-deploy.)

## Verificación / pruebas

- BD verificada: `/reportes` → `puede_eliminar` solo en Administrador (f en
  los otros 9 roles, incluidos los desactivados).
- `npx tsc --noEmit` y eslint limpios en el archivo tocado.
- API: el DELETE ya respondía 403 al rol Administrativo desde la migración
  anterior (el permiso se le retiró); el fix es el gate del botón.

## Pendientes / riesgos

- **Re-login necesario**: los permisos/vistas viajan en la sesión (login /
  profile). María López debe volver a entrar (o refrescar el perfil) para
  que el botón desaparezca.
- Los demás botones de la vista (crear/editar) siguen gateados por vistas —
  si mañana se revoca alguno de esos permisos por SQL, el mismo
  desalineamiento aparecerá; se corrige al tocar cada vista (patrón:
  gatear por permiso cuando el botón implica una acción puntual).
