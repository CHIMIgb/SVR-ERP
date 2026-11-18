# Script reproducible para regenerar el dump de integración

**Fecha:** 2026-11-18
**Autor:** Agente (autorizado por el usuario — paso 3 de 4)

## Contexto

El dump `svr_erp_export/svr_erp_sin_postgis.sql` se regeneró a mano desde la BD
local al día, con 9 tablas efímeras/sensibles excluidas. El procedimiento vivía
solo en un registro de `historial-cambios/`, así que repetirlo dependía de
recordar los flags exactos de `pg_dump`. El punto 3 del plan acordado lo convierte
en un script.

## Cambios realizados

- `apps/api/scripts/regenerar-dump-integracion.ps1` (nuevo): usa `pg_dump 18`
  con `--no-owner --no-privileges`, excluye el dato de `registro_auditoria`,
  `sessions`, `refresh_tokens`, `token_blacklist`, `intentos_login`,
  `usuarios_bloqueados`, `notificaciones`, `notificaciones_lecturas` y
  `reportes_adjuntos`, y escribe al dump del repo. Exige `PGPASSWORD` en el
  entorno (la contraseña nunca se guarda en el repo). Acepta `-Salida` para
  generar a un archivo temporal. Verifica al final que no quede ningún `COPY`
  de las tablas excluidas ni extensión PostGIS, e imprime el tamaño.
- `AGENTS.md` y `.opencode/agent/svr-erp.md`: la regla de integración apunta al
  script para regenerar el dump.

## Archivos tocados

- `apps/api/scripts/regenerar-dump-integracion.ps1` (creado)
- `AGENTS.md` (modificado)
- `.opencode/agent/svr-erp.md` (modificado)
- `historial-cambios/2026-11-18-dump-script-regeneracion.md` (creado)

## Pruebas / verificación

- Ejecutado con `-Salida` a un temporal contra `svr_erp`: **660,276 bytes**,
  9,578 líneas. Comparado con el dump versionado: solo difieren los tokens
  aleatorios `\restrict`/`\unrestrict` que imprime `pg_dump 18`. El script
  reproduce exactamente el dump que está verde en GitHub.
- `git diff --check`: sin errores.
- No se reemplazó el dump versionado ni se re-disparó `integration` (el dump no
  cambió; los dispatch de los puntos 1 y 2 ya cubrieron el workflow).

## Pendientes y riesgos

- El script depende de `pg_dump 18` en el PATH y de que la BD local `svr_erp`
  esté al día; si el esquema local diverge, generará un dump distinto al que
  valida CI. Siempre correr `npm run test:integration` contra una BD efímera
  antes de reemplazar el dump versionado.
- Sigue pendiente anonimizar los datos de negocio del dump si el repo se vuelve
  público (queda fuera del alcance de estos 4 puntos).
