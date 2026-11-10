# Plan de la review del PR #17 — cerrado y retiro del documento

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

**El plan de la review del PR #17 quedó 100% ejecutado** — se retira el
documento de trabajo `docs-planes/plan-revision-pr17.md` (era un doc de
trabajo; la trazabilidad viva vive en los registros de `historial-cambios/`
listados abajo).

## Ejecución final (11 bloques, cada uno con commit + registro + verificación)

| Bloque | Estado | Commit | Registro |
|---|---|---|---|
| 1. Excel con datos personales purgado del historial | ✅ | f5896f46 | 2026-11-10-purga-historial-nueva-info.md |
| 2. Usuarios demo fuera de migraciones (seed protegido) | ✅ | ffa68584 | 2026-11-10-demo-users-fuera-migraciones.md |
| 3. Ámbito en accesos directos (6 métodos) + FAIL auditado | ✅ | 4c4e050f | 2026-11-11-ambito-accesos-directos-reportes.md |
| 4. Adjuntos (tamano server-side + firma MIME + race) | ✅ | 9b724362 | 2026-11-11-adjuntos-blindados-tamano-firma-carrera.md |
| 5. Body-limit por ruta + descarte de respuestas viejas + candado de Aceptar | ✅ | 406d4819 + bc08e6c7 | 2026-11-11-body-limit-por-ruta-reales.md + 2026-11-11-reportes-abort-candado-aceptar.md |
| 6. Migración flujo_incidentes_v2 idempotente | ✅ | 7b06f3d3 | 2026-11-11-migracion-incidentes-idempotente.md |
| 7. Acento del rol técnico ('Técnico') + seed alineado | ✅ | a2b47e37 | 2026-11-11-rol-tecnico-acento-seed.md |
| 8. horaDelMomento con ancla UTC + Intl fijo | ✅ | 0b1784db | 2026-11-11-hora-utc-fuente-y-menores.md |
| 9. Prop `lines` en el DataTable (opción b elegida) | ✅ | e4d7ba45 | 2026-11-11-datatable-lines-prop.md |
| 10. Registro retroactivo (opción a elegida, 38 commits mapeados) | ✅ | ca3153f8 | 2026-11-11-registro-retroactivo-commits-sin-registro.md |
| 11. Menores (.turbo gitignored, rotate script fuera, comment limpio) | ✅ | 0b1784db | 2026-11-11-hora-utc-fuente-y-menores.md |

Verificaciones finales: unit reportes-campo **103/103** · integración real
**33/33** (raza de adjuntos, FAIL auditado por ámbito, inmutabilidad de la
auditoría via trigger) · smoke HTTP del límite de body (413/201/413) ·
`tsc` verde en web y api.

## Archivo eliminado

- `docs-planes/plan-revision-pr17.md` — `git rm`; queda accesible en la
  historia de git (commit `32dca833`) si alguien necesita ver el plan original.

## Archivos tocados

- `docs-planes/plan-revision-pr17.md` (eliminado)

## Pendientes y riesgos

- **Sin push** (orden del usuario): el commit del retiro queda local.
- Deuda declarada fuera del alcance del review: lint de 6 pantallas previas
  (clientes, configuracion, cotizaciones, criba, inventario, operaciones) y
  el propuesto P11 (sweeper de `token_blacklist`) — documentados, no invisibles.
