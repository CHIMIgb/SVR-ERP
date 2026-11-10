# Documentos fuente del cliente (nueva-info) versionados

**Fecha:** 2026-11-09
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

Se versiona la carpeta `nueva-info/` con los documentos de referencia que
orientaron el flujo de reportes/incidentes y los roles por torre de la PWA:

- `info.md` — notas de requerimientos (flujo móvil, roles, fotos+GPS,
  asistencia).
- `INFORMACION DE EMPLEADOS.xlsx` — datos/estructura de empleados usada para el
  plantel de usuarios demo por torre.
- `PREGUNTAS SISTEMA.docx` — dudas abiertas al equipo/cliente.

Decisión del usuario: versionarlos en el repo (en lugar de .gitignore) para
que el equipo tenga el material fuente de la feature de móviles.

## Archivos tocados

- `nueva-info/info.md`
- `nueva-info/INFORMACION DE EMPLEADOS.xlsx`
- `nueva-info/PREGUNTAS SISTEMA.docx`

## Pruebas / verificación

- No aplica: documentación fuente, sin código.

## Pendientes y riesgos

- Los .xlsx/.docx son binarios: no hay diffs legibles entre versiones; si
  cambian con frecuencia conviene LFS más adelante.
- Contienen datos de personas reales/plantilla del cliente: el repo es
  público — **si activamente hay datos personales sensibles, avisar al equipo
  e ir a repo privado o anonimizarlos.**
