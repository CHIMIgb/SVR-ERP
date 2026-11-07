# Re-revisión PR #15 (bloqueador RBAC) — copia de permisos con bool_or ANTES de borrar

**Fecha:** 2026-11-06
**Autor:** agente OpenCode

## Diagnóstico (confirmado contra el archivo real)
El reviewer tenía razón: el `b3877a92` prometía "captura previa" pero el
`migration.sql` **nunca la tuvo** — la corrección con temp table se validó
en sandbox con una copia corregida y nunca se portó al archivo commiteado.
Estado real del archivo: `DELETE role_vistas` ANTES del re-vínculo (copia
0 filas) + `INSERT` de respaldo que daba `puede_ver` a TODOS los roles.

## Cambios realizados
`apps/api/prisma/migrations/20261104000000_unificar_reportes/migration.sql`,
sección 5 reescrita con el SQL del reviewer (validado por él con EXPLAIN):
1. **5a copia ANTES de borrar**: `INSERT ... SELECT ... bool_or(flags)
   GROUP BY ro.l_id, vision_id ON CONFLICT (rol_id, vista_id) DO UPDATE SET
   flag = flag OR EXCLUDED.flag` — un rol con las DOS vistas viejas
   fusiona sin choque de PK; quien ya tenía el mock `/reportes` se queda
   con el mayor de los dos niveles.
2. **5b DELETE** de role_vistas y vistas de `/incidentes` +
   `/reportes-campo` DESPUÉS.
3. **Eliminado el INSERT de respaldo universal** — un rol que no veía
   ninguna de las 3 vistas no gana "Reportes".
4. Pre-flight del header + consulta "quién tiene hoy cada vista" para
   comparar post-deploy.

## Verificación (¡con el archivo commiteado real, no una copia!)
- Script `extrae-seccion5.cjs`: extrae la sección `-- 5) RBAC:` desde el
  bytes del `migration.sql` real → corre sobre sandbox con **3 roles
  del caso descrito por el reviewer**:
  - **Operador de Campo** con las DOS vistas viejas (ver+crear en ambas):
    `INSERT 0 2` (fusion sin PK dup) → `/reportes` **t/t** — conserva
    crear (antes quedaba solo `ver`).
  - **Encargado de RRHH** sin ninguna vista de reportes: **NO gana** la
    vista (el respaldo viejo lo habría metido).
  - **Administrador**: t/t/t intacto.
  - 0 vistas fantasma, 0 permisos legacy de incidentes, `UPDATE 1` del
    repurpose.
- **Idempotencia: run 2 = 0 errores, 0 cambios** (los DELETE no reborran,
  `ON CONFLICT` no duplica).

## Pendientes y riesgos
- El operador del servidor debe capturar la salida del pre-flight #3
  (quién ve qué hoy) y comparar tras el deploy.
- Nadie validó el SQL del reviewer contra las migraciones `20261105*`
  del otro PR (van después de estas) — no tocan vistas.

## ✅ Addendum: verificación contra la BD REAL `svr_erp` (PostgreSQL 18)
Re-run de la sección 5 real contra la BD de producción local, dentro de
transacción (probe sintético con ROLLBACK — la BD queda intacta):
- **`ON CONFLICT (rol_id, vista_id) DO UPDATE` validado contra la tabla
  real** (índice real `role_vistas_rol_id_vista_id_key`): probe A con
  vínculo previo a `/reportes` (ver+editar) y las 2 vistas viejas
  (crear+exportar) → fusionó a **ver/crear/editar/exportar = true,
  eliminar = false** (OR-merge exacto al diseño; no pisó flags altos).
- probe B (solo una vista vieja → insert directo): ver=true, resto false ✔
- run 2 (idempotencia sobre la BD real): 0 errores ✅
- Tras ROLLBACK: roles=2 (igual que antes), 0 vistas viejas,
  vínculos de `/reportes` = 1 (solo admin, intacto) — la BD real no
  cambió ni un byte.

