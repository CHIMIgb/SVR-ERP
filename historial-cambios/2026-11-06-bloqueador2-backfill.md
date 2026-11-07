# Bloqueador 2 del review PR #15 — backfill retirado de la migración

**Fecha:** 2026-11-06
**Autor:** agente OpenCode

## Diagnóstico
`20261104003000_proyectos_ubicacion/migration.sql` escribía direcciones demo
inventadas (Bahía de Banderas/Tepic/Atizapán) sobre los proyectos reales
P001–P003 vía `UPDATE` — contradecía las ubicaciones reales de las obras
(Querétaro, CDMX). Al correr via `migrate deploy` en el servidor corrompía
datos reales.

## Cambios realizados
1. **Migración limpiada** (`migration.sql`): solo permanecen los 5
   `ADD COLUMN` — **sin backfill**. Comentario documentado: columnas NULL,
   captura desde la UI.
2. **Backfill demo movido** a `apps/api/prisma/seed-proyectos-backfill-demo.sql`
   (marcado "NO correr en producción"), junto a los seeds demo existentes.
3. **BD local alineada**: P001–P003 quedaron con ubicación NULL (los proyectos
   demo P004–P008 del seed conservan sus direcciones; son datos demo).
4. **Limpieza de drift pendiente encontrada y aplicada de paso**: la migración
   de GPS del PR #13 (`20260925...`) no estaba reflejada en la BD local
   (columna/enums ya existentes) — aplicada y registrada con
   `migrate resolve --applied`. `migrate status`: **schema up to date** ✔.

## Pruebas / verificación
- `npx tsc --noEmit` api ✔
- Tests de proyectos: 42/42 ✔ (specs con su propia dirección, no dependen
  del backfill)
- `migrate diff` — el único pendiente era el drift del PR13 GPS, cerrado.

## Archivos tocados
- `apps/api/prisma/migrations/20261104003000_proyectos_ubicacion/migration.sql`
- `apps/api/prisma/seed-proyectos-backfill-demo.sql` (nuevo, demo)
- BD local svr_erp (backfill retirado; GPS aplicada solo drift)

## Pendientes y riesgos
- Si se quiere corregir el drift del servidor vs dump pueden verse las notas
  de migraciones aplicadas — pero las migraciones están aplicadas.
- Ubicación real de P001–P003 se puede capturar desde la UI (1 clic).
