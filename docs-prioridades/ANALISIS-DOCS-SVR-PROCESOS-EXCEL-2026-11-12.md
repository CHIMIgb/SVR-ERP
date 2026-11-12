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
