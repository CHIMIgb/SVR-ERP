# /reportes — flujo de incidentes v2 (backend): NUEVO→EN_CURSO→CERRADO, subcategorías, actividades, adjuntos, GPS

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

Reescritura del módulo `reportes-campo` al flujo ServiceNow-like autorizado:
la tabla(/vista) ahora es de **incidentes** (el "anterior flujo" se elimina).

1. **Estados → 3** (`EstadoIncidente`: NUEVO/EN_CURSO/CERRADO). Migración re-mapea
   los 23 demo (PENDIENTE→NUEVO, VISTO/ATENDIDO/EN_REVISION→EN_CURSO,
   RESUELTO/FACTURADO→CERRADO) y el enum viejo `EstadoReporteCampo` se elimina de
   la BD. `resuelto_en` → `cerrado_en`. Transiciones: NUEVO→EN_CURSO/CERRADO,
   EN_CURSO→CERRADO; CERRADO terminal (no reabre, no edita, no comenta, no
   reasigna). Fuera el gateo RESPONSABLE_REQUERIDO.
2. **Subcategorías por torre**: tabla `subcategorias_reporte`
   (`categoria`+`nombre` únicos) con seed de 9 (incluye "150 litros de diésel"
   para Diesel y "Cubeta de aceite" para Administrativo). El create/update
   valida que la subcategoría pertenezca a la torre (SUBCATEGORIA_INVALIDA /
   SUBCATEGORIA_NO_ENCONTRADA auditado). Endpoint `GET /subcategorias`
   (catálogo maestro, sin paginar).
3. **Actividades**: `reportes_actividades` (texto + autor) — `POST /:id/actividades`,
   audita `REPORTE_COMENTADO`; bloqueado en CERRADO.
4. **Adjuntos (imágenes)**: `reportes_adjuntos` (base64 en BD, sin dependencias)
   — `POST /:id/adjuntos`; límites: imagen (jpeg/png/webp/gif), 2 MB real
   (verifica tamaño decodificado, no solo el declarado), 4 por incidente;
   audita `REPORTE_ADJUNTO`; bloqueado en CERRADO.
5. **Ubicación GPS**: `latitud/longitud` (Decimal 10,7) — ambos o ninguno
   (GPS_INCOMPLETO auditado para el create).
6. **Borrado del flujo anterior**: `DROP COLUMN cliente_id/proyecto_id/
   monto_servicio` y **endpoint/método `facturar` eliminado** (el formato de
   ingreso tipo factura de cotización queda cubierto; CxC demo intacta).
   AuditActions: fuera `REPORTE_CAMPO_FACTURADO` del enum/code, dentro
   `REPORTE_COMENTADO` + `REPORTE_ADJUNTO`.
7. `GET /:id` ahora es **detalle compuesto**: `{ reporte, actividades, adjuntos }`.

## Cosas nuevas

- Migraciones `20261108153000_flujo_incidentes_v2` + `20261108153100_reporte_subcategoria_fk`.
  Nota: la primera falló 2 veces en deploy (default `PENDIENTE` no casteable y un
  paso a medias por intento fallido) — se restauró el estado con SQL manual
  (`ALTER TYPE` back + `DROP TYPE` del nuevo) antes del deploy OK; la migración
  quedó aplicada limpia.
- Modelos nuevos en schema.prisma: `subcategorias_reporte`, `reportes_actividades`,
  `reportes_adjuntos` (+ enum EstadoIncidente; relaciones inversas limpias).
- DTOs: create (categoria requerida + subcategoriaId/GPS), update,
  CambiarEstado (solo EN_CURSO|CERRADO), ActividadDto, AdjuntoDto.

## Archivos tocados

- `apps/api/prisma/schema.prisma` + 2 migraciones nuevas
- `apps/api/src/reportes-campo/*` (service reescrito, controller, 5 DTOs, 3 specs)
- `apps/api/src/audit/audit.constants.ts` (severidades de actions nuevas)

## Pruebas / verificación

- `prisma validate` OK; `migrate deploy` aplicado; verificación en BD:
  10 NUEVO / 11 EN_CURSO / 3 CERRADO, 9 subcategorías, columnas GPS, `cerrado_en`.
- Unitarios módulo: **71/71** (service/controller/DTOs).
- Integración real: **24/24** — flujo completo, cierre con `cerrado_en`,
  actividades/adjuntos insertados y auditados, límite 4 imágenes real,
  mime rechazado, subcategoría ajena rechazada, unicidad de `codigo`,
  trigger inmutable de registro_auditoria.
- `tsc --noEmit` OK.

## Pendientes y riesgos

- El frontend (`/reportes` web) sigue con el flujo viejo: se corrige en el
  commit `feat(web)` inmediato — entre ambos commits la app queda inconsistente.
- El folio `INC` ya existente (con backfill anterior) sigue el mismo esquema.
- `getTipoIcon/getTipoColor` residuo no se tocó aquí (vida en el front).
