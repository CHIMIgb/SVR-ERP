# 2026-11-12 — docs: dudas de docs-svr-dudas reescritas (aterrizadas al proceso observado)

## Qué cambió

Reescritura de los 11 `.txt` de `docs-svr-dudas/` por retroalimentación del
usuario: cada duda ahora (1) cita lo que se VIO en el documento como
evidencia, (2) apunta al proceso y a cómo lo implementará la aplicación, y
(3) las reglas que la app ya adopta van como SUGERENCIAS/AVISOS, no como
pregunta. Lenguaje simple para el personal de la empresa.

**Cambios puntuales pedidos:**
- COTIZACIONES: se eliminó la pregunta "¿qué numeración usan de verdad?"
  (37 vs 47 — no iba al proceso). Ahora el archivo abre explicando que el
  folio saldrá automático y único en la app (el nombre del archivo y el
  folio impreso hoy no coinciden), y las preguntas van sobre revisión
  interna, qué sigue al aceptar, vigencia, qué se cotiza y anticipar 1 semana.
- NOMINA: la pregunta de apodos quedó aterrizada como observación (apodos en
  nómina vs nombres completos en proyecto) + SUGERENCIA dura: nombre completo
  en todo el sistema con el apodo como sobrenombre.
- PRODUCTIVIDAD: la de folios repetidos quedó aterrizada con el ejemplo real
  (59515 dos veces) y el aviso de que en la app el folio será ÚNICO; solo se
  pregunta qué es el folio (ticket de báscula / número interno).
- PRODUCTIVIDAD: la de precios quedó aterrizada ($35–$450 el mismo material
  el mismo día) y la pregunta reducida a: ¿el precio es FIJO para todos o
  VARÍA entre cliente y otro? ¿quién puede cambiarlo?
- Todos los archivos abren con: qué es el documento, qué se vio, qué hará la
  app. INDEX.txt actualizado con la lista de reglas que la app ya adopta.

## Archivos tocados

- `docs-svr-dudas/*.txt` (11 reescritos: 10 documentos + INDEX)
- `historial-cambios/2026-11-12-dudas-aterrizadas-proceso.md` (este registro)

## Verificación / pruebas

- Solo docs — sin código.
- Revisión una a una: ninguna pregunta queda sin evidencia del documento o
  sin propósito de implementación; las reglas de la app (folio único, nombre
  completo, numeración automática, precios desde lista) viven en SUGERENCIAS.

## Pendientes / riesgos

- Si el cliente confirma en PRODUCTIVIDAD que el precio SÍ varía por cliente,
  la lista de precios necesita una dimensión "por cliente" (afecta F3 y P7).
