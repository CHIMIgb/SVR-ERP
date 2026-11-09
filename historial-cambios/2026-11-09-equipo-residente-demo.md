# Equipo demo del Residente (varios trabajadores a su cargo) + doc P10

**Fecha:** 2026-11-09
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

1. **Vinculación de un Residente a VARIOS trabajadores (demo):** migración
   `20261109010000_equipo_residente_demo` — crea `pedro.chofer@` y
   `luis.operador@svr-constructora.com` (rol Trabajador, password
   `trabajador123`) **ambos con `users.jefe_user_id` = residente@**. El equipo
   del residente queda con 3 trabajadores: Juan Trabajador, Pedro Chofer y Luis
   Operador. README pendiente de lista si se requiere; la relación es la ya
   documentada (usuario↔usuario).
2. **Reportes de ejemplo de cada trabajador** (creados via API, con auditoría
   SUCCESS real): INC0052 (Juan, Mantenimiento), INC0053 (Pedro, Mecanico),
   INC0054 (Luis, Diesel) — se dejan en la BD como data demo para la vista del
   residente.
3. **Doc en IMPLEMENTACIONES-A-FUTURO.md — nueva sección "P10 Equipos por
   residente"**: qué existe (columna `jefe_user_id` + scope de /reportes), qué
   falta (UI/endpoint para asignar el jefe — hoy SQL; el vínculo es
   usuario↔usuario, no por trabajadores/proyectos; variante B por proyecto
   pendiente de confirmar; fallback implementado para sin-jefe; mecanismo
   reutilizable para cualquier rol con subordinados).

## Archivos tocados

- `apps/api/prisma/migrations/20261109010000_equipo_residente_demo/migration.sql` (nuevo)
- `docs-planes/IMPLEMENTACIONES-A-FUTURO.md` (sección P10)

## Pruebas / verificación

- `migrate deploy` OK.
- E2E real: login trabajadores (3 cuentas) + crear reporte cada uno con
  auditoría → residente ve **3/3** reportes de su equipo en su listado con
  su usuario/área/estado.
- Confirmación pedida sí: la estructura si existe en la DB
  (`users.jefe_user_id`).

## Pendientes y riesgos

- Laการ asignación de jefe sigue por SQL — panel de usuarios pendiente.
- Los usuarios demo de esta migración no viven en la tabla `trabajadores`
  (perdión de flota/pagos); si el cliente los quiere catalogados, alta norma
  en /trabajadores + vincular persona si se binancees.
