# Análisis — Flujos de datos de la app según las respuestas del cliente (dudas respondidas)

**Fecha:** 2026-11-20
**Fuentes:**
1. `docs-svr/respuestas_dudas/` — 6 respuestas del cliente (análisis +
   correspondencia en `docs-prioridades/REVISION-CRUZADA-RESPUESTAS-DUDAS-2026-11-20.md`).
2. **`docs-prioridades/PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md`** — el
   plan maestro: tenía **5 items EN ESPERA de estas mismas claves** (L84-91).
3. `docs-prioridades/IMPLEMENTACIONES-A-FUTURO.md` — P1-P4 (proveedores
   externos) y P7 (lista de precios como tabulador) ya contemplados.
4. `docs-prioridades/ANALISIS-DOCS-SVR-...2026-11-12.md` §10 — decisiones
   por defecto A1-A27 (varias quedaron confirmadas o ajustadas).

**Respuesta a la pregunta «¿ya hay plan que contemple estas respuestas?»:**
**SÍ — el plan maestro Comercial/Operaciones tenía 5 items bloqueados
esperando estas claves (L84-91). Con las respuestas, 4 quedan
desbloqueados y 1 se AJUSTA (el costeo por proyecto cambia).** Además
`IMPLEMENTACIONES-A-FUTURO.md` ya contemplaba P1-P4 (conciliación de
proveedores externos) y P7 (lista de precios como tabulador).

---

## 1. Flujo de RETIROS/VENTAS — motor F3 (desbloqueado: claves 1 y 2)

**El flujo hoy en el cliente:** nota de retiro con folio → el chofer la
lleva a firma → **primero llegan al banco las notas del encargado, después
las del chofer** → ORIGINAL = la que se procesa a pago → al llegar a
oficina se registran.

**Qué se AJUSTA en la app (flujo de venta):**
- **Precio:** se toma de la **lista de precios** (tabulador por material ×
  destino × presentación 7m³/14m³/30m³/m³ — ya contemplado como P7) con
  **precio especial por cliente** atado a **obras activas** (respuesta L1/L2).
  Ya no se teclea a mano; el cambio de precio es de **encargados** en
  negociación (ajusta A9).
- **Folio:** ÚNICO (dedupe del diseño confirmado) — pero el flujo
  ORIGINAL/COPIA del papel se RESUELVE así: **una sola captura** del viaje
  y el procesamiento a pago es una fase posterior del mismo registro (no
  dos capturas del mismo folio).
- **Retiro amarrado a proyecto/obra:** cada viaje va a UNA obra; el camión
  puede hacer múltiples viajes (respuesta P4, interpretada — confirmar en
  la visita pendiente).

**Qué es NUEVO:** el motor de retiros F3 no existía — es la pieza central
de `/ventas` + `/operaciones`.

## 2. POS con crédito — validación de límite (parcialmente desbloqueado: clave 6)

**Respuesta:** «hay clientes que tienen crédito y van abonando» (E2) —
confirma el modelo POS-crédito + abonos que la app ya tiene.
**Falta la mitad de la clave 6:** la asignación del límite y el rebase
(respondida en `REGISTRO DE VENTAS.txt`, aún sin respuesta del cliente).
**Ajuste:** validación de límite en el POS (la parte no bloqueante ya era
B3); el límite/rebase llega cuando respondan.

## 3. ESTADO DE CUENTA — formatos por decisión del cliente (desbloqueado: clave 4)

**Respuesta:** «el CLIENTE decide si necesita solo material o material y
flete»; todo sale de las notas del banco, se clasifican al llegar; el
estado de cuenta se arma con los folios capturados y los repetidos se
rechazan; para facturar, el cliente manda su **razón social**.

**Qué se AJUSTA/AÑADE:**
- **Bandera por CLIENTE** (no por obra): `flete_incluido` → decide el
  formato del estado de cuenta (SOLO MATERIAL / MATERIAL Y FLETE — los dos
  formatos de docs-svr ya definidos en el plan maestro Cl3).
- **Armado automático** con los folios capturados + **dedupe de folios**
  al generar (ya diseñado).
- **Razón social de facturación:** el cliente la envía — campo en cliente
  (ya hay `rfc` + `direccion_fiscal`) o por factura.

## 4. CONCILIACIÓN SEMANAL DE PROVEEDORES EXTERNOS — flujo NUEVO (desbloqueado: claves 8 y 9)

**Respuesta:** el proveedor **envía su conciliación de los VIAJES
realizados** → la persona encargada **confirma que estuvieron en esas
obras** → se cierra el saldo → **se abona o liquida cada semana** (o al
cierre de obra, según cliente). Si hay error **se corrige al momento**; la
conciliación **cerrada queda como estado de cuenta del proveedor** y sobre
ella se hacen abonos y pagos. **NO son compras nuestras: son camiones
contratados** (transporte externo).

**Qué es NUEVO (no cabe en OCs):**
1. **Conciliación de viajes** del proveedor externo: cabecera (número,
   periodo, proveedor externo) + renglones de viajes confirmados por obra.
2. **Cierre de saldo** → queda como estado de cuenta del proveedor
   (inmutable) **con abonos y pagos posteriores** (los pagos de proveedor
   ya existen — se enlazan a la conciliación).
3. **Confirmación de viajes:** el proveedor propone, el encargado confirma
   contra las obras (los viajes ya existen en el sistema como
   despachos/retiros de flota propia... **ojo:** los viajes del proveedor
   externo NO pasan por nuestros despachos — se confirman contra las notas
   de las obras; aclarar en la visita que pide el cliente).
4. **P4 del plan maestro** (bloqueo de carga de diésel post-conciliación):
   la respuesta de EX3 habla de la conciliación de VIAJES — por analogía la
   regla de inmutabilidad post-cierre aplica, pero el caso concreto de
   cargas de diésel quedó **sin respuesta directa** (parcial).

**⚠️ El cliente pide una VISITA** para ver y entender el proceso de
proveedores externos antes de diseñarlo — recomendación: agendarla antes
de la fase de implementación de este flujo.

## 5. DESGLOSES DE COSTO POR PROYECTO — se AJUSTA (clave 3 respondida)

**Respuesta (P6):** los gastos de camión **NO se cargan a la obra — se
cargan a PARTE (por camión)** para los rendimientos internos.
**Ajuste:** el «desglose de costo por proyecto» que esperaba el costeo F1
**NO repartirá diésel/insumos/operativo de flota entre obras** — el costo
por obra solo incluirá costos directos, y el **rendimiento por camión**
(viaje vs gasto semanal: diésel de la encargada, insumos de proveedores,
operativo = sueldo) se reporta aparte por camión. El módulo combustible ya
lo modela por máquina ✓.

## 6. COTIZACIONES — ajustes (respuestas C1/C2)

- **Separación material/equipo:** las cotizaciones de **material** y de
  **servicio de equipo** (vibro, traslados, pipa) son **documentos
  separados** — la cotización actual con `items` mixtos necesita un
  **tipo/clasificación** (impacta plantilla y facturación). El traslado de
  máquinas de terceros ya era facturable (Fa3 del plan maestro).
- **Condiciones precargadas:** sin IVA, vigencia 8 días, turno 8 horas,
  anticipar 1 semana — default al crear (A11/A12 ya las marcaban).
- **Folio automático y único:** ya implementado (`codigo @unique`).
- **Tras aceptar → se hace el trabajo; factura opcional por cliente, pero
  siempre se relaciona en notas:** confirma el flujo — la facturación no
  bloquea; conecta con notas/estado de cuenta.
- **Precio desde la lista** (no tecleado) — mismo ajuste del flujo 1.

## 7. GASTOS — confirmado sin cambio

Gastos generales de la empresa **ligados a camiones y maquinaria, NO a
obras** (G1/G2 + P6) → `/finanzas` registra gasto de flota a nivel
empresa/camión; **NO construir el reparto de diésel a obra**. Fuentes del
gasto semanal: diésel (encargada del área, semanal), insumos
(proveedores), operativo (sueldo) — alimenta el rendimiento por camión.

---

## Orden sugerido (dependencias)

1. **Lista de precios** (público + especial por cliente/obras activas) —
   alimenta `ventas`, `cotizaciones`, POS y el motor de retiros F3.
2. **Motor de retiros F3** (precio de lista + retiro→obra + folio único).
3. **Bandera flete por cliente + armado del estado de cuenta** (barato,
   depende de folios).
4. **Conciliación de proveedores externos** (NUEVO — agendar la visita que
   pide el cliente primero).
5. **C6 crédito (límite/rebase)** — esperar respuesta de REGISTRO DE
   VENTAS.
6. **Desgloses por proyecto** — diseñar con costos directos + rendimiento
   por camión aparte (según P6).
