# 2026-11-13 — Revert de datos demo: trabajadores con cuentas y reportes de humo

## Qué se hizo (a petición del cliente)

**Se revirtieron en la BD los datos demo de este hilo** (el código/commit de
la mecánica queda intacto):

- **Los 9 trabajadores demo** con sus cuentas (personas, users, users_roles,
  contactos, lecturas y notificaciones personales) — creados ese día para
  probar las notificaciones de reportes.
- **Los 2 reportes de humo** (INC0065 "SMOKE cierre", INC0067 "SMOKE
  reasignación") con sus actividades, adjuntos y las 7 notificaciones que
  generaron.

Se conservaron: los reportes del propio cliente (INC0063, INC0064, INC0066)
con sus notificaciones, las filas de `registro_auditoria` (inmutables) y todo
el esquema/código (B5.11/B5.12: FK `trabajadores.usuario_id`,
`reportes_campo.asignado_user_id`, el alta que enlaza la cuenta, y el filtro
anti-elevación corregido).

## Verificación

- `trabajadores` vivos: **8** (los originales del seed).
- Cuentas demo (`RES-015`, `ADM-003/004`, `TEC-019…022`, `TRA-99416/99417`):
  **0 restantes**.
- Reportes con "SMOKE": **0 restantes**; INC0063/64/66 del cliente intactos.
- El rollback de las filas de `registro_auditoria` es imposible por diseño
  (inmutable) — quedan como historial.

## Pendientes / riesgos

- El README se actualizó: la tabla de trabajadores demo se sustituyó por una
  nota de que fueron retirados y que la mecánica (alta enlaza cuenta) sigue
  vigente.
- Queda pendiente la decisión/autorización del cliente sobre el acceso de
  escritorio para trabajadores (correo + contraseña) — antes de
  implementarlo se explicaron las repercusiones (ver conversación).
