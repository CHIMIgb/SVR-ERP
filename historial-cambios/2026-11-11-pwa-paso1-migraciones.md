# PWA base — paso 1: migraciones de identidad PIN + RBAC de vistas móviles

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base` (nace de plataforma-experiencia en f8b5b590)

## Cambios realizados

Paso 1 del §8.6 (plan de la BASE de la PWA): solo base de datos + schema —
cero código de app todavía.

### Migración `20261111120000_pwa_identidad_pin`
`users` gana los campos de la identidad móvil (plan §8.1-1):
- `numero_empleado` TEXT + UNIQUE (`users_numero_empleado_key`) — el valor lo
  genera el alta con consecutivo por prefijo (ADM/RES/TEC/COB/TRA), no la
  migración.
- `pin_hash`, `pin_temporal_hasta` (24 h del temporal), `pin_cambiado_en`
  (30 días), `pin_historial` JSONB (últimos 3), `intentos_pin`,
  `cuenta_bloqueada_en`.

### Migración `20261111130000_pwa_vistas_rbac`
- **13 vistas móviles** registradas en `vistas` (rutas `/m/*`, `es_menu=FALSE`
  — no entran al sidebar del escritorio; orden 900+): Inicio, Asistencia,
  Reportes, Contactos, Mi perfil, Obras, Flota y obras, Inventario, Diésel,
  POS, Corte del día, Finanzas, Módulos.
- **Concesiones `role_vistas`** (`puede_ver` por NOT EXISTS) según las
  brechas cuantificadas en §8.8:
  - `/m` universal (8 roles incl. Administrador).
  - `/m/asistencia` universal en los 7 roles de trabajadores (aclaración del
    cliente: asistencia universal).
  - Contactos/Perfil → Trabajador+Residente; Obras → Residente;
    Flota-obras/Inventario → los 4 Técnicos; Diésel → solo Técnico-Diesel;
    POS/Corte → Cobrador; Finanzas/Módulos → Administrador.

### schema.prisma
- `model users` actualizado con los 7 campos + `@@unique([numero_empleado])`
  (`prisma validate` OK) y cliente regenerado.

## Archivos tocados

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20261111120000_pwa_identidad_pin/migration.sql` (nueva)
- `apps/api/prisma/migrations/20261111130000_pwa_vistas_rbac/migration.sql` (nueva)

## Pruebas / verificación

- `prisma migrate deploy` → ambas aplicadas; `migrate status` = up to date.
- Query de verificación de concesiones: 13 rutas `/m*` con los roles EXACTOS
  del spec (tabla en el log de ejecución; 1:1 con §8.8).
- `prisma validate` OK; `tsc --noEmit` API OK (cliente regenerado).

## Pendientes y riesgos

- Sin push (orden del usuario).
- Siguiente paso (§8.6-2): los endpoints de PIN (login-pin, cambio, reinicio,
  desbloqueo, estado) con tests unitarios + integration real.
- `numero_empleado` queda NULL en usuarios existentes (demo) hasta que el
  alta/seed lo asigne — único índice tolera múltiples NULL (PostgreSQL).
