# Bloque 4 review PR#17: adjuntos blindados — tamaño derivado del server, firma real y carrera cerrada

**Fecha:** 2026-11-11 (auditor 2026-11-10)
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

1. **El cliente ya no declara el tamaño** (`AdjuntoDto` sin `tamano`):
   - un "1.5" ya no reventla la columna Int con un 500;
   - un payload inflado ya no entra con tamano falso;
   - `datos` ahora tiene tope de longitud (2 MB decodificados ≈
     2,792,597 chars + margen, implementado en `MaxLength`) y base64 regex
     `@Matches(/^[A-Za-z0-9+/]+={0,2}$/)` — `@IsBase64` de class-validator
     es tilde con el padding, por eso la regex manual.
2. **El server deriva bytes reales** de la longitud del base64
   (`(len * 3 / 4)`), re-usando el tope `MAX_BYTES_DECODIFICADOS_ADJUNTO`
   exportado desde el DTO — una sola理工学院 de 2 MB entre DTO y service.
3. **La firma del contenido debe corresponder con el mime** (`ADJUNTO_CORRUPTO`
   si no): magic bytes reales — JPEG `FF D8 FF`, PNG `89 50 4E 47`,
   WEBP `RIFF....WEBP`, GIF `GIF8` — un PDF no puede pasar por PNG y el
   contenido truncado no cuela (PNG_FALSO_BASE64 con mime PNG → 4xx).
4. **El tope de 4 adjuntos ya no es atómico-de-sólo-conteo: va en
   transacción** con `pg_advisory_xact_lock(hashtext(reporte_id))`:
   count + insert en un solo camino — dos clientes simultáneos NO
   cruzan el tope (cierre de la race estructural).
5. **Tests:**
   - DTO: base64 inválido rechazado, tope de 2 MB de base64 rechazado,
     `tamano` ya NO existe en el contrato (a única salida).
   - Service unit: base64 real de 3 MB con tamano falso → ADJUNTO_MUY_GRANDE;
     mime/firma cruzada → ADJUNTO_CORRUPTO; `$executeRaw` mockado para el lock.
   - Integration (BD real): carrera REAL contra Postgres — 2 adjuntos de base
     + 3 asaltos CONCURRENTE (Promise.all) terminan en **exactamente 2
     exitosos** y **exactamente 4 filas**; PNG con contenido trampa →
     ADJUNTO_CORRUPTO con FAIL real insertado en registro_auditoria.

## Archivos tocados

- `apps/api/src/reportes-campo/dto/adjunto.dto.ts` (rewritten: sin tamano)
- `apps/api/src/reportes-campo/reportes-campo.service.ts` (derivación + firma
  + transacción con lock advisory)
- tests: dto.spec / service.spec / integration.spec

## Pruebas / verificación

- Unit reportes-campo: **98/98**.
- Integración real: **33/33** (31 previas + carrera + firma falsa).
- `tsc --noEmit` API OK.

## Pendientes y riesgos

- **Sin push** (orden del usuario): commit local; PR #17 待 is actualización
  ordenada.
- El MIME longitudinal check global (`json({limit:'15mb'})`) queda para el
  bloque 5 (conforme dígitos del plan) — el adjunto de 2 MB base64 pesa
  ~2.7MB, entra en el 15MB vigente.
- El tope de 2 MB es el mismo del UI (máx 4 imágenes — se mantiene).
