# 2026-11-12 — docs: dudas asumibles retiradas de docs-svr-dudas y planteadas como decisiones por defecto (análisis §10)

## Qué se hizo

1. **`docs-svr/docs-svr-dudas/*.txt`** — se retiraron las dudas ASUMIBLES
   (las que la app resuelve por lógica) de los 10 archivos y se renumeraron
   las que quedan. Quedaron solo las 🔴 necesarias y 🟡 medias:
   - PRODUCTIVIDAD: 9 → 6 (quitaron folio-qué-es, operador fijo, tanque)
   - ESTADO DE CUENTA: 7 → 3 (quitaron frecuencia, entrega, disputa, alcance)
   - LISTA DE PRECIOS: 4 → 2 (quitaron presentaciones, quién cambia precios)
   - COTIZACIONES: 5 → 2 (quitaron revisión interna, vigencia, anticipar)
   - NOMINA: 2 → 1 (quedó solo la equivalencia apodo↔persona)
   - CONTROL DE GASTOS: 5 → 2 (quitaron caja chica, sobre de AILYN, sin factura)
   - PROVEEDORES: 4 → 1 (quedó solo ¿proveedores con crédito?)
   - EXTERNOS 01: 5 → 3 (quitaron saldo a favor, mínimo de abono)
   - PROYECTO AILIN: 5 → 3 (quitaron horario, datos obligatorios)
   - REGISTRO DE VENTAS: 6 → 3 (quitaron quién entrega, NO HUBO EFECTIVO,
     alcance del POS)
2. **`ANALISIS-DOCS-SVR-PROCESOS-EXCEL-2026-11-12.md`** — nuevo **§10
   "Decisiones asumidas por la aplicación"**: las 26 dudas retiradas quedan
   como decisiones por defecto (A1–A26) con su archivo de origen; nota de que
   ninguna toca el schema de fondo y que se ajustan si el cliente contradice.
3. **`PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md`** — la fila F2 ahora
   apunta a la carpeta de dudas y al §10 del análisis (decisiones por
   defecto).
4. **`docs-svr/docs-svr-dudas/INDEX.txt`** — reescrito: secciones CLAVES (las
   10 necesarias, numeradas), nota de que las asumibles viven en §10, y las
   reglas ya adoptadas por la app.

## Archivos tocados

- `docs-svr/docs-svr-dudas/*.txt` (10 reescritos + INDEX) — carpeta ignorada
  por git (decisión del usuario), no versionados
- `docs-prioridades/ANALISIS-DOCS-SVR-PROCESOS-EXCEL-2026-11-12.md` (§10 nuevo)
- `docs-prioridades/PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md` (F2 apuntador)
- `historial-cambios/2026-11-12-dudas-asumibles-retiradas.md` (este registro)

## Verificación / pruebas

- Solo docs — sin código.
- Cobertura: 26 dudas retiradas (A1–A26) revisadas contra el análisis por
  archivo de la conversación; las 🔴/🟡 conservadas coinciden con la
  clasificación de niveles.

## Pendientes / riesgos

- Las decisiones por defecto (A1–A26) viven SOLO en el análisis versionado;
  si el cliente contradice alguna, se ajusta ahí y en la vista que aplique.
- Las dudas clave requieren respuesta antes de F3 (motor de retiros, crédito,
  conciliación) — el resto del hilo sigue arrancable sin ellas.
