# Sincronización schema.prisma ↔ BD local (drift de 9 items)

**Fecha:** 2026-11-15
**Autor:** Agente
**Tipo:** fix(db) — verificación pedida por el usuario ("revisar que las tablas de la BD y las migraciones coincidan") + autorización para corregir el drift encontrado.

## Diagnóstico previo (todo verificado contra el árbol real)

1. **Tablas:** 92 tablas en `svr_erp` = 92 models en `schema.prisma` — 1:1 exacto, ni una de más ni de menos. Las 22 tablas que crean migraciones existen; las 3 borradas por migraciones (`materiales_precio`, `materiales_venta`, `incidentes`) no existen. `migrate status`: up to date (100 migraciones).
2. **Contenido (schema ↔ BD, `prisma migrate diff`):** NO vacío — 9 items de drift acumulado desde el baseline del 8-sep (48 migraciones entraron sin resincronizar el schema):
   - `AuditAction` sin `REPORTE_CAMPO_FACTURADO` (mig 20260923000000; valor muerto, el código no lo usa) ni `PERMISOS_ROL_ACTUALIZADOS` (mig 20261114030000; la BD tiene AMBOS — `...ADAS` usado por `roles.service.ts` y `...ADOS` que es plural equivocado de la migración del 14-nov, peso muerto en BD, no removible de un enum PG sin recrear el tipo).
   - 4 índices en BD sin `@@index` en schema: `reportes_campo(proyecto_id)`, `registros_criba(inventario_en)`, `subcategorias_reporte(categoria)`, `users(jefe_user_id)`.
   - `users.pin_historial`/`intentos_pin`: BD nullable (mig 20261111120000), schema los declaraba no nulos.
   - FK `categorias_puesto.rol_id`: ON UPDATE difiere (BD `NO ACTION`, schema heredaba `CASCADE` default de Prisma).
   - FK `trabajadores`: nombre de constraint renombrado en BD (`fk_trabajadores_usuario`) — NO expresable en Prisma → ruido permanente del diff (cosmético, queda documentado).
3. **Dirección del arreglo:** la BD estaba bien; el que estaba atrás era el schema. Aplicar el SQL del diff tal cual habría BORRADO los 4 índices y puesto NOT NULL en pin — no se hizo.

## Cambios realizados

- `apps/api/prisma/schema.prisma`:
  - Enum `AuditAction`: agregados `PERMISOS_ROL_ACTUALIZADOS` y `REPORTE_CAMPO_FACTURADO`.
  - `@@index` agregados: `users(jefe_user_id)`, `reportes_campo(proyecto_id)`, `registros_criba(inventario_en)`, `subcategorias_reporte(categoria)`.
  - `pin_historial Json?` / `intentos_pin Int?` (opcionales, igual que la BD).
  - `categorias_puesto.rol`: `onUpdate: NoAction` explícito (alinea con la BD).
- `apps/api/src/audit/audit.constants.ts`: entradas de severity para los 2 valores nuevos del enum (`...ADOS: 'WARNING'` como su hermana `...ADAS`, `REPORTE_CAMPO_FACTURADO: 'INFO'` como los demás facturados).
- `apps/api/src/auth/pin/pin.service.ts` (líneas 129/238): `r.intentos_pin ?? 0` — conserva el comportamiento exacto de runtime (null ya se comportaba como 0).
- `apps/api/src/usuarios/usuarios.service.ts` (líneas 720/1057): `(intentos_pin ?? 0) >= MAX_INTENTOS_PIN` — ídem.
- Cliente Prisma regenerado (`npx prisma generate`).

## Verificación

- `npx prisma validate` ✓ · `npx tsc --noEmit` (apps/api) ✓ tras los ajustes.
- **Diff final schema ↔ BD: solo queda el ruido del rename de la FK `trabajadores`** (no expresable en Prisma). Todo lo demás vacío.
- `npm run test` (api): 1415/1417 — las 2 fallas son la bomba de tiempo preexistente de `cobranza.service.spec.ts` (fixture `2026-10-01`, incidente conocido, sin relación con este cambio). Cero fallas nuevas.
- No se tocó la BD ni el historial de migraciones: el drift se cerró por el lado del schema (ninguna migración nueva necesaria).

## Pendientes / riesgos

- `PERMISOS_ROL_ACTUALIZADOS` en BD es valor muerto (el código usa `...ADAS`); los enums PG no admiten quitar valores sin recrear el tipo — queda como deuda cosmética documentada.
- El replay de migraciones desde vacío sigue imposible (no hay migración init; `seed_rbac` asume tablas base del dump) — deuda estructural conocida; por eso las verificaciones de este lote se hicieron con `migrate diff --from-schema --to-config-datasource` (y una config temporal con `shadowDatabaseUrl` para los diffs con migraciones, eliminada después).
- Otros cambios de hoy (config temporal para `migrate diff`) no tocaron código del repo: `prisma.config.ts` NO se modificó (el `shadowDatabaseUrl` falta ahí si algún día se quiere `migrate diff --from-migrations` en el repo — candidato a 1 línea si se autoriza).
