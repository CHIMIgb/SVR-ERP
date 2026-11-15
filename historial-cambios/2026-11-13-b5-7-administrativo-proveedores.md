# 2026-11-13 — B5.7: acceso a /proveedores para el rol Administrativo

## Qué se hizo

Decisión RBAC del cliente (opción "a" del hallazgo de B5.7): dar acceso a la
vista **/proveedores** al rol **Administrativo** para que las notificaciones
de órdenes aprobadas y abonos tengan receptor (con el filtro por vista, sin
ese acceso nadie las veía).

- **Migración `20261113041000_administrativo_proveedores_vista`** — INSERT
  idempotente en `role_vistas` (`puede_ver = true`, único
  `[rol_id, vista_id]`). Sin permisos CRUD extra: solo ver la vista (y con
  ella, su buzón de notificaciones de proveedores).
- **`docs-prioridades/NOTIFICACIONES.md`** — matriz §2 actualizada
  (Administrativo ahora ve órdenes aprobadas, abonos y nómina pagada).

## Verificación

- `psql`: la fila `Administrativo + /proveedores` existe con `puede_ver = t`.
- Migración registrada en `_prisma_migrations`.
- **Smoke real** con `rrhh@svr-constructora.com`: el buzón muestra las 5
  notificaciones de proveedores (OC-2026-049/051/043/039 aprobadas y el abono
  a OC-2026-044) y NO el cierre de caja (audiencia Administrador) — el filtro
  por vista funciona en ambos sentidos ✓.

## Pendientes / riesgos

- La vista aparece en el menú del sidebar para Administrativo: si se quiere
  ocultar del menú pero dejar el buzón, requiere cambiar el diseño del filtro
  (hoy "puede ver la vista" = "aparece en el menú"). Preguntar al cliente si
  eso le conviene.
- Smoke visual del sidebar pendiente (sin navegador).
