# 2026-11-12 — docs: NOMINA.txt retirado de docs-svr-dudas — decisión A27 (nombre completo en todo el sistema)

## Qué se decidió

El usuario decidió retirar el archivo `NOMINA.txt` de `docs-svr/docs-svr-dudas/`
por lógica: en la aplicación la persona lleva **nombre completo en todo**
(nómina, despachos, proyectos) y el apodo queda como sobrenombre — no hace
falta preguntarle al cliente la equivalencia apodo↔persona, porque se resuelve
al cargar los datos reales comparando nómina vs plantillas de proyecto.

## Qué se tocó

1. **`docs-svr/docs-svr-dudas/NOMINA.txt`** — eliminado (carpeta ignorada por
   git; el archivo no estaba versionado en su nueva ubicación).
2. **`docs-svr/docs-svr-dudas/INDEX.txt`** — fuera la fila de NOMINA y fuera
   la clave #10 (equivalencia apodo); las claves quedaron en 9. Nota de la
   retirada y su motivo.
3. **`docs-prioridades/ANALISIS-DOCS-SVR-PROCESOS-EXCEL-2026-11-12.md`** —
   nueva decisión **A27** en §10: identidad del operador con nombre completo
   + apodo como sobrenombre; equivalencia se resuelve al migrar datos, no se
   pregunta.
4. **`docs-prioridades/PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md`** — la
   fila O6 ya no dice "equivalencia apodo↔persona pendiente": ahora remite a
   A27 (select sin texto libre, nombre completo).

## Verificación / pruebas

- Solo docs — sin código.
- NOMINA.txt confirmado eliminado; INDEX renumerado a 9 claves.

## Pendientes / riesgos

- Al migrar los datos reales habrá que hacer la equivalencia apodo→persona
  una sola vez (los apodos de NÓMINA.xlsx vs nombres de PROYECTO AILIN) — es
  trabajo de seed/migración, no de pregunta al cliente.
- Riesgo bajo: si dos personas comparten el mismo apodo, se descubre al
  cargar los datos y se desambigua ahí.
