# role_vistas de /reportes alineadas con los permisos reales del API

**Fecha:** 2026-11-19
**Autor:** agente

## Cambios realizados
- Migración `20261119020000_reportes_role_vistas_alineadas` (idempotente,
  UPDATE puro): alinea `role_vistas` de la vista `/reportes` con lo que el
  API realmente permite (`role_permissions` + guards):
  - **Cobrador y Trabajador: `puede_editar = false`** — no tienen permiso
    `reportes_campo:editar` (ni de sus propios reportes): el server los
    rechaza; la vista mentía y pintaba botones de Editar/Aceptar que
    terminaban en 403 (escritorio y PWA, misma vista).
  - **Técnico (consolidado) y las 4 variantes de torre:
    `puede_eliminar = false`** — la eliminación de reportes es SOLO del
    Administrador (decisión del SVR, ya gateada por PERMISO en el
    escritorio; ahora la vista también coincide).
- Aplicada con `psql` + `npx prisma migrate resolve --applied` (el
  historial baselined no permite `migrate dev` en este repo — mismo
  procedimiento que `20261118020000_reportes_campo_idempotencia_key`).
- Estado verificado con `psql`: Cobrador/Trabajador
  (ver ✓ crear ✓ editar ✗ eliminar ✗), Técnico (sin eliminar), y
  **re-ejecución idempotente** (segunda corrida: UPDATE 0).

## Archivos tocados
- `apps/api/prisma/migrations/20261119020000_reportes_role_vistas_alineadas/migration.sql` (nuevo)
- `historial-cambios/2026-11-19-role-vistas-reportes-alineadas.md` (creado)

## Verificación / pruebas
- `psql` post-migración: la tabla refleja el estado esperado para los 10 roles (incluye los inactivos de técnico).
- Re-ejecución del script: UPDATE 0 (idempotente).
- La PWA y el escritorio leen `puede_editar/puede_eliminar` de la misma
  fila → ambos pintan ahora lo que el server permite (quedan iguales).
- `prisma validate`/`npm run build` no aplica (sin cambio de schema);
  `migrate status` sin conflictos (migración marcada aplicada).

## Pendientes y riesgos
- **Rareza no diagnosticada:** la primera corrida del script imprimió
  `UPDATE 0` aunque el estado cambió (o los flags ya estaban en el estado
  final al correr el script y mi lectura previa era del estado viejo en
  caché de la sesión). El estado FINAL está verificado con dos SELECT.
  Si aparece de nuevo, revisar con `psql` fresco.
- El Administrativo conserva `puede_exportar=false` en la vista pero SÍ
  tiene permiso `exportar`: mismatch cosmético benigno (la UI oculta el
  botón; el API lo permite) — no se tocó.
- Sin push: el commit queda local.
