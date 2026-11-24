# Migración de auditoría push idempotente (IF NOT EXISTS)

**Fecha:** 2026-11-21
**Autor:** SVR-ERP Dev (agente)

## Cambios realizados
- Punto M1 de la segunda revisión del PR #23: los dos `ADD VALUE` de
  `20261120020000_audit_push_suscripcion` van ahora con `IF NOT EXISTS`.
  Antes, re-correr la migración manualmente en el servidor
  (`db execute`, flujo del día del despliegue) truena con "already exists".

## Cosas nuevas
- Ninguna — dos palabras por línea en SQL ya aplicado localmente; el efecto
  es el mismo, solo idempotente.

## Archivos tocados
- apps/api/prisma/migrations/20261120020000_audit_push_suscripcion/migration.sql (modificado)

## Pruebas / verificación
- `npx prisma validate` (apps/api): schema válido.
- `psql` sobre `svr_erp` local: `PWA_PUSH_SUSCRITO` y `PWA_PUSH_BAJA` ya
  existen en `AuditAction` (la migración está aplicada; editar el SQL no la
  re-corrre localmente, que es el comportamiento correcto).
- `git diff --check`: limpio.

## Pendientes y riesgos
- No se re-corrió la migración en una BD limpia para probar el `IF NOT
  EXISTS` en vivo; el flujo `migrate deploy` no la re-ejecuta de todos modos.
- En entornos donde ya corrió (local), la edición del SQL es solo documental;
  el beneficio real es la primera vez que corra en el servidor.
