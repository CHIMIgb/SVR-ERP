# CI/CD completo verificado — los 3 workflows en verde

**Fecha:** 2026-11-18
**Autor:** Agente (autorizado por el usuario — "Arreglarlo completo")

## Contexto

Cierre de la fase de corrección del workflow `integration`, que quedó rojo al
probar los 3 workflows de extremo a extremo en GitHub. Los otros dos (`ci` y
`build-web`) ya estaban verdes; el trabajo se concentró en el dump y en los
specs de integración.

## Commits de esta fase

1. `28894257` — `test(api): corregir specs de integración y hacerlos deterministas`
2. `74508586` — `test(ci): regenerar dump de integración con el esquema vigente`
3. `2bdd372d` — `fix(api): secretos JWT de prueba para integración en CI`
4. `2bdd372d` (este registro) — cierre y trazabilidad de corridas

## Corridas verificadas en GitHub

| Workflow | Run | Resultado |
|---|---|---|
| `ci` | `44412424027` | ✅ 93 suites / **1417 tests**, `tsc --noEmit`, `prisma generate`, `nest build`, `prisma validate` |
| `integration` | `44412424878` | ✅ 26 suites / **292 tests**, restore del dump + BD efímera (41 s de tests) |
| `build-web` | `44405584912` | ✅ imagen `ghcr.io/chimigb/svr-erp-web` publicada con smoke del contenedor |

`build-web` no se volvió a disparar en esta fase: los cambios fueron de API,
dump y documentación; el bundle web no cambió, así que la imagen publicada
sigue siendo la del run `44405584912` (digest
`sha256:222efb49b22947f50f2e5a31f265486ced6e8eb6c434e4cefd425ef53080f3e1`).

Corridas fallidas intermedias, para trazabilidad: `44405827213` (dump viejo),
`44411690109` (sin secretos JWT en CI).

## Archivos tocados

- `historial-cambios/2026-11-18-cicd-integration-verde.md` (creado)

## Pendientes y riesgos

- **Deploy a Railway manual**: el usuario debe apretar Redeploy en el servicio
  Web. No hay `RAILWAY_TOKEN` ni secretos de GitHub. Al redeployear, anotar el
  SHA y el digest que imprimió `build-web`.
- `npm run lint` sigue con 21 errores conocidos y fuera del CI, por decisión
  del usuario (deuda documentada en `2026-11-18-cierre-fase4-lint-deuda.md`).
- Queda el aviso de `worker process failed to exit gracefully` al terminar la
  suite de integración; no falla ningún test pero indica un handle sin cerrar.
- El dump de integración incluye datos de negocio de desarrollo; anonimizar si
  el repo llega a ser público.
