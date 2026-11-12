# 2026-11-12 — docs: hilo conductor entre los 3 documentos de prioridades (análisis + vinculación)

## Qué se hizo

Análisis de los 3 documentos de `docs-prioridades/` y su vinculación con orden
de ejecución explícito:

1. **`ANALISIS-DOCS-SVR-PROCESOS-EXCEL-2026-11-12.md`** — nuevo §8 "Hilo
   conductor": se declara PASO 0 (terminado, insumo), con el diagrama de
   entrega hacia el plan comercial (reglas + 4 dudas bloqueantes) y hacia
   IMPLEMENTACIONES (P2/P7/C3/§9/§10).
2. **`PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md`** — nuevo §8 "Hilo
   conductor — orden de ejecución de los 3 documentos": diagrama
   [0]análisis → [1]este plan (F1→F2→F3) → [2]IMPLEMENTACIONES, con los
   enlaces puntuales de co-construcción: P2 partidas + plantilla de
   cotización (los Word definen concepto/cantidad/monto), P7 precios +
   LISTA DE PRECIOS, C3 venta a crédito + motor de retiros, §9/§10 +
   conciliación semanal/P4. Regla: no arrancar una serie de
   IMPLEMENTACIONES antes de que su habilitador de este plan exista.
3. **`IMPLEMENTACIONES-A-FUTURO.md`** — el bloque de prioridad del encabezado
   se amplió con el hilo (3 pasos con links + qué series se tocan primero y
   con qué se construyen juntas), remitiendo al §8 del plan comercial.

## Conclusión del análisis (prioridad)

1. **ANALISIS-DOCS-SVR** — listo; es insumo, no tareas.
2. **PLAN-COMERCIAL-OPERACIONES** — vigente: F1 (arrancable ya) → F2
   (paralelo) → F3 (consume las reglas del análisis).
3. **IMPLEMENTACIONES-A-FUTURO** — después, arrancando por las series que F3
   desbloquea (P2, P7, C3, §9/§10); el resto según su orden interno.

## Archivos tocados

- `docs-prioridades/ANALISIS-DOCS-SVR-PROCESOS-EXCEL-2026-11-12.md` (§8 nuevo)
- `docs-prioridades/PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md` (§8 nuevo)
- `docs-prioridades/IMPLEMENTACIONES-A-FUTURO.md` (encabezado ampliado)
- `historial-cambios/2026-11-12-hilo-conductor-documentos.md` (este registro)

## Verificación / pruebas

- Solo docs — sin código.
- Los 3 documentos leídos completos (IMPLEMENTACIONES 1,191 líneas) antes de
  vincular; las dependencias cruzadas salen del contenido real (P2 = renglones
  de los Word; retiro = venta de material para C3; etc.).

## Pendientes / riesgos

- La Fase 0 (Sistema) sigue sin decidirse su arranque — vive en el doc
  fuera-de-alcance y no entra al hilo por decisión de alcance del cliente.
- Si el cliente responde las dudas de F2 con reglas que contradigan el
  análisis de docs-svr, el hilo debe re-sincronizarse (los enlaces apuntan a
  documentos, no a versiones congeladas).
