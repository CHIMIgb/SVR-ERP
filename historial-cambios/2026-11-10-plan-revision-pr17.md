# Plan de correcciones de la review del PR #17

**Fecha:** 2026-11-10
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados
Se crea `docs-planes/plan-revision-pr17.md`: plan completo de correcciones de
la review del PR #17, con cada punto verificado contra el codigo real (scope
por area, adjuntos, migraciones no idempotentes, acento del rol Tecnico, hora
1970, json 15mb, races del front, menores) — cada uno con confirmacion de
codigo, que se hara, que se decidira y el orden de ejecucion. Nada se ha
ejecutado: queda esperando las 4 autorizaciones listadas al final del plan.

## Archivos tocados
- `docs-planes/plan-revision-pr17.md` (nuevo)

## Pruebas / verificacion
- Diagnostico de solo lectura (grep/read) en reportes-campo servicio, DTOs,
  migraciones y sidebar. Sin cambios de codigo.

## Pendientes y riesgos
- Pendiente la ejecucion por bloques tras autorizacion (purga de historial
  con force push hace falta confirmacion explicita).
