# 2026-11-12 — B2.2: backend de la obra 1:1 (nace, se sincroniza y se elimina con el proyecto)

## Qué se hizo

Segunda fase de **B2** (plan comercial/operaciones §10). Solo
`apps/api/src/proyectos/`; sin DTOs, endpoints, permisos ni UI nuevos.

1. **`proyectos.service.ts` → `create()`** — `proyectos.create` + `obras.create`
   dentro de un `$transaction`: si la obra falla, el proyecto no queda. La obra
   hereda `nombre`, estado mapeado (`FINALIZADO → FINALIZADA`, resto
   `EN_PROCESO`), `ubicacion` compuesta (`calle, colonia, ciudad, estado`) y
   `creado_por`. `PROYECTO_CREADO` ahora guarda `obraId` en `newValue`.
2. **`update()`** — misma transacción: si el proyecto se renombra, la obra
   también (D1 = sí, autorizado); si cambia de estado, la obra se sincroniza.
   `PAUSADO` no toca la obra (`EstadoObra` no tiene PAUSADA). Si el proyecto no
   tiene obra (datos viejos), el update no falla: solo no hay espejo.
   `PROYECTO_ACTUALIZADO` incluye `estadoObra` en `previousValue`/`newValue`.
3. **`remove()`** — misma transacción: soft-delete del proyecto **y** de su obra
   (`eliminado_en`, `activo: false`), así no quedan obras huérfanas en catálogos.
4. **Helpers privados** — `estadoObraDe()` y `ubicacionDe()` (una sola fuente del
   mapeo/compuesto, mismos criterios que el backfill de B2.1).

**Auditoría:** sin `AuditAction` nuevo (es enum de BD). No hay FAIL nuevo que
auditar: la 1:1 la garantiza el índice único, no una regla de negocio.

## Verificación

- `npx jest src/proyectos/proyectos.service.spec.ts`: **31/31** (5 tests nuevos:
  obra heredada, mapeo FINALIZADO, `obraId` en el audit, sync nombre/estado,
  PAUSADO intacto, proyecto sin obra, soft-delete de la obra).
- `npx jest --config jest.integration.config.js src/proyectos`: **14/14** (BD
  real; 4 nuevos: obra nace 1:1 con nombre/estado/ubicación, **segunda obra con
  el mismo `proyecto_id` rechazada con P2002**, sync nombre→FINALIZADA con
  `estadoObra` en `registro_auditoria`, PAUSADO no toca la obra, soft-delete de
  la obra en `PROYECTO_ELIMINADO`).
- `npx tsc --noEmit`: sin errores.
- `npm run test`: **1324 passed / 2 failed** — los 2 fallos son los preexistentes
  de `cobranza.service.spec.ts` (CSV `ATRASO_GRAVE`), no de B2.
- BD tras la suite: 9 proyectos vivos / 9 obras vivas / 0 restos de test.

## Pendientes / riesgos

- **La dirección editada no se propaga a la obra** (no estaba en el plan
  autorizado): `update()` sincroniza nombre y estado, no `calle/colonia/ciudad/
  estado`. `/catalogos/proyectos` arma `ubicacion` desde `obras[0].ubicacion`, así
  que tras editar la dirección del proyecto el catálogo sigue mostrando la vieja
  hasta que se toque la geocerca desde `/asistencia`. Si se quiere, son ~5 líneas
  en el mismo `update()` (recomputar `ubicacionDe` con los valores fusionados).
- **`seed-proyectos-demo.sql`** inserta proyectos por SQL directo: si se vuelve a
  correr, creará proyectos **sin obra** (el service no participa).
- Las obras nacidas por API quedan **sin geocerca** (`lat/lng/radio` NULL) hasta
  que se capture con `PATCH /asistencia/obras/:id/ubicacion` — igual que B2.1.
- B2.3 (labels de la UI) y B2.4 (gates + smoke) siguen pendientes de autorización.
