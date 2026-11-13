# Análisis de `docs-svr/` — procesos reales en Excel/Word y su impacto en Comercial y Operaciones

> **Fuente:** los 12 documentos de `docs-svr/` (10 Excel + 2 Word) que el cliente
> entregó como la definición de sus procesos actuales. La aplicación debe seguir
> estos procesos: las hojas de Excel son los flujos operativos y las cartas de
> Word son el formato de las solicitudes (cotizaciones).
> **Este documento es insumo de `PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md`**:
> responde la pregunta P1 (conciliación de proveedores) y aporta evidencia al
> punto O10 (vencimientos de placas controlados por administrativo). No lo
> sustituye: prioriza lo que ese plan ya decidió.

---

## 1. Inventario de los documentos

| # | Documento | Qué es | Periodo |
|---|---|---|---|
| 1 | **PRODUCTIVIDAD.xlsx** (253 KB) | Bitácora maestra de RETIROS (viajes de camiones con material): 1 hoja `GENERAL` + 1 hoja por camión (33, 39, 41, 54, 91, 107, 134, 135, 472) con corte semanal por unidad | ago–nov 2026 |
| 2 | **ESTADO DE CUENTA SOLO MATERIAL.xlsx** | Estado de cuenta al **cliente** con sus retiros de material (2 hojas: 52 viajes $53,599.84 + 16 viajes $23,399.88) | oct 2026 |
| 3 | **ESTADO DE CUENTA MATERIAL Y FLETE.xlsx** | Igual, incluyendo camión/placas (44 viajes = **$118,800**). Placas resueltas con XLOOKUP contra catálogo externo `DATOS UNIDADES` (no enviado) | nov 2026 |
| 4 | **LISTA DE PRECIOS.xlsx** | Catálogo de precios por material × **destino** (DESEMBOCADA / PLAYA GRANDE) × presentación (14m³, 30m³, m³, 7m) | vigente |
| 5 | **COTIZACION 37.docx** (folio impreso 47) | Cotización formal de **servicios de equipo** (vibrocompactador BOMAG $5,500, traslado ida/vuelta $9,000, pipa 20,000 lts $8,000) | 08-sep-2026 |
| 6 | **COTIZACION 50.docx** | Cotización formal de **materiales** (tabla m³ y 14m³: BANCO $181.42/m³, PIEDRA HOMBRE $514.28, CRIBADO $200, GRAVA $285.71, GRAVON $300, BASE $307.14, PEDRAPLEN $514.28) | 10-sep-2026 |
| 7 | **NOMINA.xlsx** | Pago semanal real: trabajadores con apodos operativos + horas extra/festivos/descuentos, y **pagos a proveedores en la misma hoja** (totales: nómina $103,993 vs proveedores $267,911 en la semana) | semana del 30-oct-2026 |
| 8 | **CONTROL DE GASTOS.xlsx** | Caja chica por fuente: `GASTOS DE CAJA` / `GASTOS DE BANCO` / `SOLVENTADOS POR OFICINA` / `SOBRE DE AILYN`, con responsables y notas ("CORTE DE CAJA AL 15/11/2025", "VALES DE CAJA") | nov 2025 |
| 9 | **PROVEEDORES.xlsx** | Estado de cuenta con un proveedor (refaccionaria): `SUBTOTAL 7,795 · ABONE 4,355 · RESTAN 3,440`, notas "PAGADAS"/"PENDIENTE DE PAGO" | ene 2026 |
| 10 | **PROVEEDORES EXTERNOS 01.xlsx** | Conciliaciones **semanales** con proveedores externos (`CONCILIACION #1–#7`): `TOTAL CONCILIACION · ABONO A CUENTA · FECHA ABONO · SALDO A FAVOR` — acumulado $261,025 / abonado $172,000 / saldo $89,025 | ago–nov 2026 |
| 11 | **PROYECTO AILIN 2026 PROGRAMA EMPRESA.xlsx** | Expediente completo del proyecto AILIN (13 hojas): plantilla de trabajadores (RFC, domicilio, horario), camiones/operadores/años/placas, **servicios por tipo de unidad con fechas de placas y servicios**, consumo de diésel por máquina, maquinaria con/sin GPS | 2026 |
| 12 | **REGISTRO DE VENTAS.xlsx** | Corte diario de venta de material por banco con folio, subtotal por día y semana ($20,425), notas "NO HUBO EFECTIVO" / "ENTREGADO 14/10/2026" | oct 2026 |

**Firma de las cotizaciones:** AILYN G. VELASCO ARREOLA, Representante Legal,
RFC VERS810225EQ8, C. Alvaro Obregón 275-A, Las Juntas, Puerto Vallarta, Jalisco.

---

## 2. Mapeo documento ↔ vista (Comercial y Operaciones)

### COMERCIAL

| Documento | Vistas | Qué aporta |
|---|---|---|
| REGISTRO DE VENTAS | `/ventas`, `/ventas/corte` | El **corte de caja real** de venta de material: totales por día y por material, "NO HUBO EFECTIVO", efectivo "ENTREGADO [fecha]" a oficina |
| PRODUCTIVIDAD (log de retiros) | `/ventas`, `/cobranza`, `/facturas`, `/finanzas` | La **transacción de venta real** (retiro): folio, fecha, camión, obra, material, m³, precio, total. De él nacen CxC, facturas e ingresos |
| ESTADO DE CUENTA (ambos) | `/cobranza`, `/clientes`, `/facturas` | El **entregable al cliente** con retiros acumulados. Dos formatos: SOLO MATERIAL y MATERIAL Y FLETE. El "duplicado de folio" se controla hoy con formato condicional — en el ERP es índice único |
| LISTA DE PRECIOS | `/cotizaciones`, `/ventas` | El **tabulador** por material × destino × presentación — elimina teclear precio a mano en cada retiro/cotización |
| COTIZACION 37 y 50 (Word) | `/cotizaciones`, `/facturas` | La **plantilla formal**: folio, fecha, cliente, tabla concepto/cantidad/monto, condiciones fijas y firma. La 47 cotiza servicios de equipo (traslado = Fa3 confirmado en el plan); la 50 cotiza materiales con la lista de precios |
| PROVEEDORES | `/proveedores` | El patrón real de **CxP + abonos parciales** (`SUBTOTAL · ABONE · RESTAN`) con notas de pago por partida |
| PROVEEDORES EXTERNOS 01 | `/proveedores`, `/finanzas` | ⭐ **Responde la P1 del plan**: la conciliación con proveedor externo es **semanal**, con abonos a cuenta y saldo a favor por conciliación. Es el diseño funcional de la conciliación CxP |

### OPERACIONES

| Documento | Vistas | Qué aporta |
|---|---|---|
| PROYECTO AILIN | `/proyectos`, `/operaciones` (borde `/inventario`) | Expediente de una obra real: plantilla del proyecto (trabajadores, RFC, horarios) para `/proyectos`; fichas de camiones (placas/año/serie), **hojas de SERVICIO con fechas de vencimiento de placas y de servicios** (evidencia del O10), consumo de diésel por máquina y maquinaria con/sin GPS (coherente con O13) |
| PRODUCTIVIDAD (lado operativo) | `/operaciones`, `/proyectos` | El viaje también es operativo: qué camión, horas de salida/llegada, obra destino (LA PERLA, SAN ESTEBAN, CANAL FEDERACION…). Los destinos son **obras reales**; el bloque semanal de gasto por camión (diésel/insumos/operativo) alimenta el costo de obra — pendiente de F1 del plan (¿obra o centro de costos?) |
| ESTADO DE CUENTA MATERIAL Y FLETE | `/operaciones` (borde) | Confirma que folio→camión→placa se resuelve contra un catálogo de unidades (hoy Excel externo con XLOOKUP; en el ERP ya es `maquinas`): despacho y retiro comparten catálogo |

### Sin impacto directo en las 15 vistas

- **NOMINA.xlsx** → vive en RRHH (`/trabajadores`, nómina, asistencia). Única
  conexión con Operaciones: la lista de operadores con apodos (PELON, SIRI,
  SATANAS…) — requiere la equivalencia apodo↔persona para los select de
  operador (O6, lista obligatoria sin texto libre).
- **CONTROL DE GASTOS.xlsx** → mayormente `/finanzas` (egresos de caja/banco =
  transacciones EGRESO). El matiz "CORTE DE CAJA" / "VALES DE CAJA" roza
  `/ventas/corte`, pero la caja chica de gastos es de finanzas, no del POS.

---

## 3. Semántica confirmada contra los archivos (no inferida)

- **PRODUCTIVIDAD, bloque semanal por camión** (verificado en las fórmulas y
  etiquetas del XML): `VIAJES · ($) GENERADO POR VIAJE · GASTO DE DIESEL ·
  LITROS DE DIESEL · GASTO INSUMOS · GASTO OPERATIVO · RENDIMIENTO`, con
  **RENDIMIENTO (utilidad) = generado − gasto diesel − gasto insumos − gasto
  operativo** (fórmula `V=Q-R-T-U` en la hoja). Hay fila de total MENSUAL por
  camión y las hojas por camión son copias filtradas de `GENERAL`.
- **Equivalencias camión→placa inferidas de los valores cacheados del XLOOKUP**
  (el catálogo externo `DATOS UNIDADES` no fue entregado): 33→JX84875,
  135→JX84874, 107→JX84848, 39→JM364467, 41→NA-6285-D, 144→PD-1645-A.
- **Fechas:** seriales Excel; el set cubre ~nov-2025 a nov-2026, con la semana
  activa más reciente en oct–nov 2026 (seriales 46307–46333).

---

## 4. Insight transversal (el más importante)

**PRODUCTIVIDAD + los estados de cuenta + el registro de ventas son el MISMO
negocio visto desde 3 ángulos:**

| Ángulo | Documento | Vista destino |
|---|---|---|
| Operación (quién, cuándo, qué camión) | PRODUCTIVIDAD | `/operaciones`, `/proyectos` |
| Venta/Cx (cuánto se le cobra al cliente) | PRODUCTIVIDAD + ESTADOS DE CUENTA | `/ventas`, `/cobranza`, `/facturas` |
| Caja (cuánto efectivo entró y se entregó) | REGISTRO DE VENTAS | `/ventas/corte`, `/finanzas` |

Si se modela como **una sola entidad "retiro/viaje"** con vistas derivadas, las
tres pantallas salen solas y se eliminan la triple captura y el control manual
de folios duplicados (hoy formato condicional de Excel).

---

## 5. Dudas de negocio abiertas (bloquean diseño fino)

Las 16 preguntas están listadas en la conversación del 12-11-2026; las 4 que
bloquean el modelo de datos desde la primera migración:

1. **Folio de retiro:** se vieron folios repetidos el mismo día con precios
   distintos (59515: $3,600 y $4,399.92). ¿Ticket de báscula que puede
   repetirse, o error? → define si el índice único es folio, folio+camión o
   folio+fecha.
2. **Precio:** mismo material y día con precios distintos (35.71–450/m³).
   ¿Se negocia por cliente/obra o viene de la lista de precios?
3. **Tarifa de hora extra:** varía por persona (100/150) — ¿es fija por
   trabajador (la papeleta de nómina) o por puesto?
4. **Numeración de cotizaciones:** el archivo "COTIZACION 37" imprime folio
   **47** — ¿la serie real por dónde va? (define el generador de folios).

Las demás (frecuencia de estados de cuenta, entrega de efectivo, caja chica,
"SOBRE DE AILYN", conciliación de proveedores externos, equivalencia
apodo↔persona) son detalle fino de cada vista.

---

## 6. Relación con el plan del 11-11

| Punto del plan | Qué aporta este análisis |
|---|---|
| **P1** (¿cómo se concilia cada carga de diésel con la factura del proveedor?) | PROVEEDORES EXTERNOS 01 ES la respuesta: conciliación semanal con abonos a cuenta y saldo a favor |
| **O10** (vencimientos de placas/licencias controlados por administrativo) | PROYECTO AILIN muestra el proceso real: hojas de servicio con fechas de placas por unidad |
| **O13** (solo camiones con GPS) | PROYECTO AILIN confirma: hojas "CAMIONES CON GPS" / "MAQUINARIA SIN GPS" |
| **Fa3** (traslados de terceros facturables) | COTIZACION 37 lo ejemplifica: traslado de vibrocompactador cotizado como renglón propio |
| **F1** (¿diésel/mantenimiento al costo de obra?) | PRODUCTIVIDAD aporta la estructura del gasto (diésel/insumos/operativo por camión-semana) pero NO la regla de reparto — F1 sigue pendiente |
| **/cotizaciones, /ventas, /ventas/corte** (cero impacto según el plan) | Con docs-svr ESTO CAMBIA: los tres documentos (cotizaciones Word, PRODUCTIVIDAD, REGISTRO DE VENTAS) definen justo esos procesos — el plan decía "cero impacto" porque su fuente (doc de dudas) no los tocaba |

---

## 7. Qué NO cubre este análisis

- `DATOS UNIDADES` (catálogo externo de unidades referenciado por los XLOOKUP)
  no fue entregado — las equivalencias camión→placa listadas arriba son
  parciales y provienen de valores cacheados.
- Celdas con fórmulas cuyo valor no estaba cacheado (algunos subtotales de
  PRODUCTIVIDAD y CONTROL DE GASTOS).
- Semántica exacta de columnas sueltas de NÓMINA (`SEGURO DESCUENTO`,
  `SALIDA`, `DIA DESCUENTO`) — la lógica general (sueldo + horas extra × tarifa
  + festivo − descuentos = neto) sí cierra con los totales.

---

## 8. Hilo conductor — lugar de este documento en la secuencia

**Este documento es el PASO 0 de la secuencia de trabajo Comercial/Operaciones
— ya está terminado y es insumo de los otros dos:**

```
[0] ESTE DOC (insumo — reglas de negocio, TERMINADO)
      │ entrega: reglas del retiro/plantilla/conciliación + 4 dudas bloqueantes
      ▼
[1] PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md  (vigente — el que se ejecuta)
      │   · su F2 consume las dudas bloqueantes de este doc (§5)
      │   · su F3 construye lo que este doc describe (retiros, plantilla,
      │     corte, estados de cuenta, conciliación de proveedores)
      ▼
[2] IMPLEMENTACIONES-A-FUTURO.md  (después del plan comercial)
          · P2 partidas ← renglones concepto/cantidad/monto de los Word
          · P7 precios por medida ← LISTA DE PRECIOS.xlsx como tabulador
          · C3 venta a crédito → CxC ← el motor de retiros de F3
          · §9/§10 (proveedores) ← conciliación semanal + P4 (bloqueo carga)
```

**Regla del hilo:** una vez terminado el plan comercial (o su F3), se arranca
con las series de `IMPLEMENTACIONES-A-FUTURO.md` empezando por las que este
análisis ya desbloqueó (P2, P7, C3, §9/§10). Detalle del enlace en §7/§8 de
ese plan.

---

## 9. Requisitos nuevos del cliente (2026-11-12) — estados de cuenta, pagos a proveedores y crédito en el POS

> Información adicional que dio el SVR en lenguaje directo (no viene de un
> Excel): confirma y amplía los procesos que los 4 Excel de `docs-svr/`
> demuestran. Se documenta aquí como requisito formal.

**Textual del cliente:**
1. "Se pueden ver los estados de cuenta de los clientes y proveedores."
2. "También se les paga a los proveedores."
3. "Algunos para pagar usan un crédito que ellos les dan para el punto de
   venta — más que nada la opción de pagar con su crédito."

### 9.1 Estados de cuenta de clientes y proveedores (requisito 1)

**Qué significa:** dos estados de cuenta, uno por cada lado del dinero:

| Lado | Excel que lo demuestra | Contenido |
|---|---|---|
| Cliente (CxC) | ESTADO DE CUENTA SOLO MATERIAL / MATERIAL Y FLETE | Retiros acumulados por folio con subtotal — lo que el cliente debe |
| Proveedor (CxP) | PROVEEDORES.xlsx / PROVEEDORES EXTERNOS 01.xlsx | `SUBTOTAL · ABONE · RESTAN` y conciliaciones semanales #1–7 con saldo a favor |

**Estado verificado en código (2026-11-12):** el de **proveedor existe
parcialmente** (`estadosCuenta` en `/proveedores` + abonos; falta el envoltorio
de conciliación semanal #1–7). El de **cliente por retiros NO existe** —
`lib/api.ts` solo expone estado de cuenta para proveedores; el consolidado de
`/clientes` (6.7 ✅) muestra tabs pero no el formato entregable de los Excel.

**A dónde cae:** F3 del plan comercial + Cl3 (formatos SOLO MATERIAL /
MATERIAL Y FLETE) + §9/§10 de IMPLEMENTACIONES (lado proveedor).

### 9.2 Pagos a proveedores (requisito 2)

**Qué significa:** los abonos parciales — `ABONE 4,355 → RESTAN 3,440`
(PROVEEDORES.xlsx) y `ABONO A CUENTA` con fecha por conciliación (EXTERNOS 01).

**Estado verificado:** ✅ **ya construido** — abonos atómicos a CxP con egreso
en `/finanzas` (ciclo de dinero + Fase 7). Solo falta el envoltorio semanal de
conciliación (brecha #4).

**A dónde cae:** ya funciona; el detalle semanal va con P4 + §9/§10.

### 9.3 Crédito para pagar en el punto de venta (requisito 3) — NUEVO, sin Excel

**Qué significa (el dato más importante de esta entrega):** el crédito lo otorga
**SVR al cliente** ("un crédito que **ellos les dan**"). El cliente con crédito
disponible compra material en el POS **sin efectivo** — la venta se le suma a
su cuenta — y el estado de cuenta de §9.1 es el comprobante de ese crédito
acumulado. Esto cierra el círculo: **crédito otorgado → venta a crédito en POS →
CxC → estado de cuenta al cliente → cobranza**.

**Estado verificado en schema (2026-11-12):**
- `clientes` **NO tiene campos de crédito** — sin `limite_credito`, sin `dias
  de crédito`, sin saldo disponible. Es schema nuevo obligatorio.
- La venta POS **no genera CxC** (C3 de IMPLEMENTACIONES, verificado: el
  service de ventas no crea entidad de deuda) — y el POS tampoco ofrece
  "crédito" como método de pago contra el disponible del cliente.

**Lo que exige este requisito (orden sugerido):**
1. **Schema:** campos de crédito en `clientes` (`limite_credito`, `dias de
   crédito` o plazo — negociar con el cliente cuál usa hoy, probablemente
   manual en el Excel que no nos pasaron) + derivado de "disponible" =
   límite − suma de CxC abiertas.
2. **C3:** la venta a crédito del POS → factura/CxC del cliente (transacción,
   idempotencia ya existe en el POS).
3. **POS (`/ventas`):** método de pago **CRÉDITO** que valide disponible
   contra el límite (rechazar si excede, auditar FAIL) — cliente conocido, no
   "Público en general".
4. **Estado de cuenta del cliente** (§9.1) que refleje el consumo del crédito.

**A dónde cae:** **C3 de IMPLEMENTACIONES** (se construye junto con el motor
de retiros de F3, según el hilo) + F3/Cl3 para el estado de cuenta.

> ⚠️ **Pregunta nueva al cliente** (sumar a la F2 del plan): ¿cómo asignan hoy
> el crédito (monto y plazo por cliente), quién lo aprueba y qué pasa cuando
> un cliente lo rebasa — rechazo en el POS o cobro forzado? No viene en los
> Excel.

---

## 10. Decisiones asumidas por la aplicación (dudas retiradas de docs-svr-dudas — 2026-11-12)

> Las dudas **asumibles por lógica** se retiraron de `docs-svr/docs-svr-dudas/`
> para no saturar al cliente. Cada una queda aquí como **decisión por defecto
> de la app** — si el cliente contradice alguna al responder las dudas clave,
> se ajusta (ninguna toca el schema de fondo, salvo indicación en contrario).

| # | Tema | Decisión por defecto de la app | Archivo de duda original |
|---|---|---|---|
| A1 | Folio del retiro | ÚNICO y no repetible; se asume que es el ticket de la báscula (se nombrará así) | PRODUCTIVIDAD d1 |
| A2 | Operador en el viaje | La app lleva operador en cada viaje (fijo o rotante — no cambia el modelo) | PRODUCTIVIDAD d6 |
| A3 | Tanque propio de diésel | Si existe, se agrega luego en inventario/maquinaria; sin respuesta no se construye | PRODUCTIVIDAD d9 |
| A4 | Estado de cuenta: frecuencia | Configurable, semanal por defecto | ESTADO DE CUENTA d1 |
| A5 | Estado de cuenta: entrega | Se registra cada entrega (impreso/WhatsApp); cliente firma o confirma | ESTADO DE CUENTA d2 |
| A6 | Estado de cuenta: disputa de viaje | Corrección con permiso y auditoría (patrón del repo) | ESTADO DE CUENTA d5 |
| A7 | Estado de cuenta: alcance | Se genera para todos los clientes de material | ESTADO DE CUENTA d6 |
| A8 | Lista de precios: presentaciones | 7m / 14m³ / 30m³ / m³ se modelan como medidas de venta | LISTA DE PRECIOS d2 |
| A9 | Lista de precios: cambios | Solo con permiso administrativo | LISTA DE PRECIOS d3 |
| A10 | Cotizaciones: revisión interna | Sin revisión previa — el representante legal envía directo | COTIZACIONES d1 |
| A11 | Cotizaciones: vigencia 8 días | Se marca "vencida" al pasar; no bloquea el flujo | COTIZACIONES d3 |
| A12 | Cotizaciones: anticipar 1 semana | Nota precargada en la plantilla de condiciones | COTIZACIONES d5 |
| A13 | Operadores externos/eventuales | Si existen, se dan de alta como trabajadores | NOMINA d2 |
| A14 | Caja chica | Se registran vales en finanzas; el monto de resurte es dato capturable | CONTROL DE GASTOS d1 |
| A15 | SOBRE DE AILYN | Efectivo de la representante legal para gastos — se registra como fuente de caja | CONTROL DE GASTOS d2 |
| A16 | Gastos sin factura | Se marcan "SIN FACTURA" y quedan pendientes de comprobación | CONTROL DE GASTOS d4 |
| A17 | Estado de cuenta de proveedor | Se genera para TODOS los proveedores | PROVEEDORES d1 |
| A18 | Prioridad de pago a proveedores | Operación humana — la app solo ordena por antigüedad/vencimiento | PROVEEDORES d3 |
| A19 | Notas de pago de proveedor | Pasan a estados por compra (PAGADA / PENDIENTE), no notas sueltas | PROVEEDORES d4 |
| A20 | Saldo a favor del proveedor | Pagado de más — queda a favor para el próximo abono | EXTERNOS d3 |
| A21 | Mínimo de abono a conciliación | Se abona con lo que alcanza; mínimo no requerido | EXTERNOS d5 |
| A22 | Horario de la plantilla del proyecto | Global 8:00–18:00 (ya confirmado por el cliente en RRHH) | PROYECTO AILIN d2 |
| A23 | Datos del expediente del proyecto | Obligatorios al crear: cliente, nombre; RFC/domicilio/horario opcionales después | PROYECTO AILIN d4 |
| A24 | Entrega de efectivo | Se registra con folio y receptor (quiénes son dato capturable) | REGISTRO DE VENTAS d2 |
| A25 | "NO HUBO EFECTIVO" | Nota del corte — día sin venta de contado; no genera registro especial | REGISTRO DE VENTAS d3 |
| A26 | Alcance del POS | Vende lo que el catálogo tenga (no solo material por banco) | REGISTRO DE VENTAS d6 |

**Dudas que SÍ quedaron en `docs-svr/docs-svr-dudas/`** (necesarias y medias):
ver INDEX de esa carpeta — 3-6 por archivo, con las 🔴 clave marcadas por
tema: precio del retiro, viaje↔obra, gasto a obra, flete aparte/incluido,
qué manda para facturar, crédito del cliente (asignación/rebase), crédito de
proveedores, qué es la conciliación, corrección post-conciliación,
equivalencia de apodos.
