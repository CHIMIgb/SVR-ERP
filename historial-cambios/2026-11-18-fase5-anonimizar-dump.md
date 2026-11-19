# Fase 5: anonimizar el dump de integración

**Fecha:** 2026-11-18
**Autor:** Agente (Fase 5 autorizada; el usuario eligió "anonimizar" sobre
"artefacto privado" al confirmarse que el repo es público)

## Contexto

`svr_erp_export/svr_erp_sin_postgis.sql` —el dump que restaura
`integration.yml`— contenía datos de negocio reales de demo en un repo
**público**: 14 clientes con nombre/empresa/correo/teléfono/RFC, 90
proveedores, 427 personas, 79 usuarios y 18 proyectos, además de firmas y
reportes de campo con nombres de residentes. El plan dejaba la decisión al
usuario; se eligió anonimizar para no introducir secretos ni artefactos
externos en el CI.

## Cambios realizados

- **Nuevo** `apps/api/scripts/anonimizar-dump.cjs`: recorre solo los bloques
  `COPY` del dump y reemplaza columnas de identidad por valores `DEMO...` o
  `@ejemplo.invalid`, de forma determinista por fila e idempotente. Respeta
  `\N`, UUID, fechas y todos los identificadores. Conserva los 17 correos
  `@svr-constructora.com` que los specs de integración usan como usuarios
  semilla. Tablas cubiertas: `clientes`, `personas`, `proveedores`,
  `proyectos`, `obras`, `trabajadores`, `users` (solo correos no semilla),
  `reportes_campo` y `firmas_cliente`.
- `apps/api/scripts/regenerar-dump-integracion.ps1`: llama al anonimizador
  justo después de `pg_dump`, antes de las validaciones. Toda regeneración
  futura produce el dump anonimizado.
- `svr_erp_export/svr_erp_sin_postgis.sql`: 638 líneas anonimizadas. Ya no
  quedan correos reales (`@gmail`, `@arco`, `@gob.mx`) ni nombres con
  tratamiento (`Ing.`, `Lic.`, `Arq.`).

## Cosas nuevas

- Script de anonimización reutilizable e idempotente (segunda pasada: sin
  reemplazos).

## Archivos tocados

- `apps/api/scripts/anonimizar-dump.cjs` (creado)
- `apps/api/scripts/regenerar-dump-integracion.ps1` (modificado)
- `svr_erp_export/svr_erp_sin_postgis.sql` (modificado)
- `historial-cambios/2026-11-18-fase5-anonimizar-dump.md` (creado)

## Pruebas / verificación

- Dump restaurado en BD efímera `svr_erp_anon_check` (93 tablas); la BD se
  borró al terminar. **No se tocó la BD de desarrollo `svr_erp`.**
- `npx prisma migrate diff --from-config-datasource --to-schema=prisma/schema.prisma --exit-code`
  contra esa BD: "No difference detected", exit 0.
- `npm run test:integration` con `DATABASE_URL` apuntando a la BD efímera:
  **26 suites, 292/292 tests**, exit 0.
- Idempotencia: segunda ejecución del anonimizador sin reemplazos y mismo
  hash del archivo.
- `git diff --check`: exit 0.

## Pendientes y riesgos

- **Los otros dos export siguen con datos originales**: `svr_erp.sql` y
  `svr_erp.dump` (binario) están en el repo público y no se tocaron —el plan
  solo cubría el dump de integración. Además, el historial de git conserva
  las versiones anteriores de todos ellos. Limpiar eso requiere otro
  cambio autorizado que incluya reescritura de historial; no se hizo.
- Campos de texto libre (`descripcion`, `detalles`, notas) pueden seguir
  mencionando nombres; no se anonimizaron para no alterar el significado de
  los datos de prueba.
- El workflow de CI no cambió: sigue restaurando el mismo archivo, ahora
  anonimizado. Falta confirmar en remoto tras el push autorizado.
- No se hizo push ni PR (no ordenados).
