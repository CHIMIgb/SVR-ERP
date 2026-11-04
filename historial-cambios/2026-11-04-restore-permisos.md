# Restauración de la tabla `permisos` (+ enum TipoPermiso)

**Fecha:** 2026-11-04
**Autor:** agente OpenCode (a petición del usuario)

## Cambios realizados
- Por decisión del usuario, **vuelve la tabla `permisos`** (solicitudes de
  vacaciones/permisos/incapacidad de RRHH) y su enum `TipoPermiso`, que se
  dropiaron como fantasmas el mismo día.
- `schema.prisma` re-agregó el modelo EXACTO original (16 columnas, enum,
  relaciones inversas en trabajadores/users ×3) — el FK a `trabajadores` con
  `ON DELETE RESTRICT / ON UPDATE NO ACTION`, tal como el diseño original.
- Migración `20261104002100_restore_permisos` (SQL = salida exacta de
  `prisma migrate diff` BD↔schema), aplicada por psql + `migrate resolve`.
- Verificación: `migrate diff` = vacío (drift cero); 0 filas (tabla nuevamente
  vacía, como nunca dejó registros).

## Estado de las tablas caídas hoy
- `permisos` + `TipoPermiso`: **RESTAURADAS** ✔
- `incidentes` (+ `EstadoIncidente`): permanecen dropiadas — la unificación de
  reportes (`/reportes`) las reemplaDZó y el usuario NO pidió regresarlas.

## Archivos tocados
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20261104002100_restore_permisos/migration.sql`

## Pruebas / verificación
- `prisma validate`, `prisma generate`, `migrate diff` vacío ✔; suite API
  958/960 (mismas 2 fallas de cobranza preexistentes).

## Pendientes y riesgos
- La tabla vuelve sin el trigger de `actualizado_en` que tenían otras tablas
  (en el original tampoco hay evidencia de trigger para esta tabla) — el
  service que algún día la escriba debe setear `actualizado_en` manualmente.
