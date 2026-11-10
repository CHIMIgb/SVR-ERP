# Retiro del paquete del ticket de soporte fuera de la rama (cierre bloqueante 1)

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

La revisión del PR #17 (bloque 1 de segunda revisión) señala que el
**documento del ticket que se commiteó en el commit anterior** describe por
sí solo el asunto del dato sensible (repo público) — hay que sacarlo de la
rama para que no llegue a `main`, y guardar las notas FUERA del repositorio.

**Hecho:**
1. Las notas completas del ticket** viven AHORA FUERA del repo** en
   `%USERPROFILE%\Documents\SVR-ERP-notas\ticket-github-support.md`
   (formulario, texto en inglés listo para pegar, los 2 SHA a purgar y el
   checklist de cierre).
2. El commit del doc + su registro **retirado de la rama** — la punta
   vuelve a `fdbcf76e` (+ force push, aprobado por el revisor).
3. El ticket queda **PENDIENTE de acción humana**: solo el dueño del repo
   puede enviarlo desde
   https://support.github.com/contact/remove-data .
4. Este registro se reescribe SIN reproducir los detalles del asunto
   (SHA/rutas/nombres de archivos) para no volver a procurar la fuga.

## Archivos tocados

- Retiro de `docs-planes/pendiente-purga-github-support.md` + su registro
  (commit previo; fuerza y revisión del reviewer).
- Notas fuera del repo (sin trazar).

## Pruebas / verificación

- La rama ya no necesita más limpiezas: su punta es `fdbcf76e`
  (proyectos sin columna Progreso) y los registros previos que viven en la
  rama no contienen referencias directas del asunto (los divalor
  referencias profundas fueron retiradas con la reescritura previa).
- Force push hecho con `--force-with-lease` (ningún cambio con remoto).

## Pendientes y riesgos

- EL REMOTO aún contiene copias en caché de ambos commits (el del dato y el
  del ticket) hasta que GitHub Support purge sus objetos de inalmacén
  interno — el ticket ya lleva los 2 SHAs.
- Cuando respondan, aplicar el checklist de cierre con las notas (fuera del
  repo) y avisar al reviewer para su revisión (verificar 404 en los SHAs).
- LA rama LOCAL de rescate `backup-plataforma-pre-purga-20261110` sigue
  existiendo en la máquina local y AÚN tiene el archivo del asunto —
  **NO pushearlo nunca**; se eliminará al cierre confirmado.
