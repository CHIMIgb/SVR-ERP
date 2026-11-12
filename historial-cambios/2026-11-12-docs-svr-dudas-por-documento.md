# 2026-11-12 — docs: carpeta docs-svr-dudas con dudas simples por documento (solo Comercial/Operaciones)

## Qué se creó

Carpeta **`docs-svr-dudas/`** con un `.txt` por documento de `/docs-svr`:
dudas en lenguaje simple (no técnico) para el SVR, con sugerencias de mejora
cuando aplica. Todo filtrado a los módulos Comercial y Operaciones (las 15
vistas).

**10 archivos + índice:**
- `PRODUCTIVIDAD.txt` (9 dudas: folio repetido, quién decide el precio, ESTATUS
  ORIGINAL/COPIA/$0, quién captura, obra del viaje, operador fijo, gasto
  semanal, **¿gasto cargado a obra?**, tanque de diésel)
- `ESTADO DE CUENTA (CLIENTE).txt` (7 dudas: frecuencia, entrega/firma,
  material vs material+flete, pago por periodo, disputa de viaje, quiénes
  llevan estado de cuenta, **¿qué manda para facturar?**)
- `LISTA DE PRECIOS.txt` (4 dudas)
- `COTIZACIONES (WORD).txt` (6 dudas: numeración 37 vs 47, revisión interna,
  qué sigue al aceptar, vigencia, qué se cotiza, anticipar 1 semana)
- `NOMINA.txt` (2 dudas — solo lo de operadores: equivalencia apodo↔persona,
  operadores externos)
- `CONTROL DE GASTOS.txt` (5 dudas: caja chica, sobre de AILYN, solventados,
  sin factura, gasto a obra)
- `PROVEEDORES.txt` (4 dudas — incluye la **nueva: ¿proveedores con crédito?**
  y en qué situaciones se usa)
- `PROVEEDORES EXTERNOS 01.txt` (5 dudas: qué es conciliación, quién/cada
  cuándo, saldo a favor, corrección post-conciliación, mínimo de abono)
- `PROYECTO AILIN 2026 PROGRAMA EMPRESA.txt` (5 dudas — solo vistas: plantilla
  fija o rotativa, horario, proyecto vs cliente, captura obligatoria, uso del
  expediente)
- `REGISTRO DE VENTAS.txt` (6 dudas — incluye las **2 nuevas del crédito**:
  qué clientes pagan con crédito hoy y cómo se asigna, y qué pasa al rebasarlo)
- `INDEX.txt` (índice con las vistas de cada módulo y de dónde salieron las
  dudas nuevas)

**Decisiones de formato:** los 2 ESTADO DE CUENTA y las 2 COTIZACIONES se
juntaron en un archivo cada par porque son el mismo proceso (dos formatos /
misma plantilla) — evita duplicar las mismas preguntas. Nada del módulo
maquinaria ni RRHH entró (NOMINA y PROYECTO AILIN llevan solo las dudas que
tocan las 15 vistas).

**Origen de las dudas:** las 16 previas de la conversación + las 2 nuevas
del mensaje (crédito cliente en POS / crédito de proveedores) + 3 derivadas
del cruce plan-vs-documentos (gasto a obra, dato para facturar, proveedores
con crédito).

## Archivos tocados

- `docs-svr-dudas/*.txt` (10 + INDEX — nuevos)
- `historial-cambios/2026-11-12-docs-svr-dudas-por-documento.md` (este registro)

## Verificación / pruebas

- Solo docs (preguntas para el cliente) — sin código.
- Cobertura verificada: los 12 documentos de docs-svr están cubiertos (10
  archivos, 2 fusionados); todas las dudas apuntan a vistas de Comercial/
  Operaciones.

## Pendientes / riesgos

- Pendiente de autorización (de la sesión anterior): el §9 con el veredicto
  de cumplimiento para el análisis docs-svr — no se tocó en este cambio.
- Las preguntas están listas para mandar al cliente; sus respuestas van a la
  F2 del plan comercial y algunas desbloquean F3 (folio, precios, crédito).
