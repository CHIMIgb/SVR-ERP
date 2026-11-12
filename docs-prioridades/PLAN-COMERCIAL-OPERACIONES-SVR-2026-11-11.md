# PLAN COMERCIAL Y OPERACIONES — decisiones del SVR (11-11-2026) y correcciones

> **Fuentes:**
> 1. Análisis a fondo de `docs_dudas/Dudas del SVR-11-11-2026.docx`
>    (11 secciones con respuestas del cliente).
> 2. Los 12 documentos operativos de `docs-svr/` (procesos reales en Excel/Word —
>    ver `ANALISIS-DOCS-SVR-PROCESOS-EXCEL-2026-11-12.md`).
> 3. Las respuestas del proveedor de GPS (GPS Solutions, Meitrack T399L) — solo
>    sus derivaciones que caen en las 15 vistas.
>
> **Este plan tiene prioridad sobre las series P/F de
> `IMPLEMENTACIONES-A-FUTURO.md`** (ver nota de vínculo al final).
>
> **⚠️ ALCANCE RECORTADO (2026-11-12):** este plan abarca **SOLO el módulo
> Comercial y el módulo Operaciones** (las 15 vistas listadas abajo). Lo que
> vivía fuera — la Fase 0 de vistas admin de Sistema (Vista A/B), la ingesta
> GPS real (fases F3–F5), RRHH/Maquinaria (fases F6–F8) y los errores de
> nómina del §10 — se movió íntegro a
> **`PLAN-FUERA-DE-ALCANCE-SISTEMA-GPS-RRHH-MAQUINARIA-2026-11-12.md`**.
> Nada se eliminó: se separó por módulo.

---

## 1. Vistas en alcance y leyenda

**Comercial:** `/clientes`, `/cotizaciones`, `/finanzas`, `/proveedores`,
`/ventas`, `/cobranza`, `/ventas/corte`, `/facturas`
**Operaciones:** `/reportes`, `/operaciones`, `/criba`, `/inventario`,
`/proyectos`

Leyenda de estado: ✅ confirmado por el cliente · ⚠️ pregunta sin respuesta
(bloquea diseño) · ❌ sin impacto.

---

## 2. COMERCIAL — correspondencia por vista

### 2.1 /finanzas
| # | Punto (sección del doc) | Estado | Implicación |
|---|---|---|---|
| F1 | ¿El diésel y el mantenimiento se cargan al costo de obra? ¿Por máquina, obra o centro de costos? (§8 Costos) | ⚠️ SIN RESPUESTA | Define el modelo de costeo completo (transacciones + `proyectos.finanzas`) |
| F2 | ¿Cómo se reparte una carga de combustible usada en varias obras? (§8) | ⚠️ Sin respuesta | Prorrateo de egresos entre obras |
| F3 | Egresos reales de combustible/mantenimiento (hoy demo — §10 error 4) | ✅ | Ingesta de egresos reales |
| F4 | Renta mensual del GPS: **$350/equipo sin contrato** (proveedor) | ✅ | Egreso recurrente por equipo con GPS — transacción de `/finanzas` |

### 2.2 /proveedores
| # | Punto | Estado | Implicación |
|---|---|---|---|
| P1 | ¿Cómo se concilia cada carga de diésel con la factura del proveedor? (§8) | ✅ RESPONDIDA POR docs-svr | **`PROVEEDORES EXTERNOS 01.xlsx` ES el proceso**: conciliación **semanal** (`CONCILIACION #1–#7`) con `TOTAL CONCILIACION · ABONO A CUENTA · FECHA ABONO · SALDO A FAVOR` — abonos parciales a cuenta, acumulado $261,025 / abonado $172,000 / saldo $89,025 |
| P2 | Refacciones de mantenimiento (§7) | ✅ | Compradas por **orden de compra** → OC + recepción + CxP |
| P3 | Talleres externos: interno/externo + proveedor + garantía (§7) | ✅ | Facturas de taller externo → CxP |
| P4 | ¿Se bloquea la edición/eliminación de una carga de diésel después de conciliarla? (§8) | ⚠️ Sin respuesta | Regla de inmutabilidad post-conciliación en CxP |

### 2.3 /facturas
| # | Punto | Estado | Implicación |
|---|---|---|---|
| Fa1 | ¿Para facturar, qué dato manda: proyecto, cliente u obra? (§5 Despachos) | ⚠️ parcialmente respondida (§6) | La lectura de renta se asocia a **combinación cliente+obra** ("un cliente puede tener distintas obras") — la trazabilidad despacho→factura sigue abierta |
| Fa2 | **"SI CADA NOTA DEBE ESTAR FIRMADA PARA RESPALDO DEL CLIENTE"** (§6) | ✅ | Regla dura: no se factura una bitácora de renta sin firma del residente |
| Fa3 | **Traslados de máquinas de terceros = otro servicio que brindamos** (§4) | ✅ | Servicio facturable NUEVO (concepto en factura; cotización si aplica). docs-svr lo ejemplifica: COTIZACION 47 cobra traslado de vibrocompactador como renglón propio |

### 2.4 /cobranza
| # | Punto | Estado | Implicación |
|---|---|---|---|
| C1 | **El horómetro del operador es SOLO información interna; el cobro EXCLUSIVAMENTE por bitácora de renta** (§6) | ✅ | Blindar anti-doble-cobro: horómetro jamás genera CxC |
| C2 | **Tarifa por TIPO DE MÁQUINA y CLIENTE**, distinta en nocturno/festivo/extra (§6) | ✅ | Cambia el monto de la CxC nacida de bitácora (tarifas reales pendientes en §5 entregables) |
| C3 | **El tiempo detenido en obra SE COBRA; el traslado NO** (salvo grúa/oruga baja) (§6) | ✅ | Define conceptos cobrables de la bitácora |
| C4 | La lectura de renta se asocia a **combinación cliente + obra** (§6) | ✅ | Modelo de CxC: cliente y obra como dimensiones separadas, no una sola |

*(la mecánica de abonos/cobro revertido de `/cobranza` no cambia; docs-svr añade
el formato del estado de cuenta que se le entrega al cliente — ver §2.6)*

### 2.5 /clientes
| # | Punto | Estado | Implicación |
|---|---|---|---|
| Cl1 | **El cliente NO ve la ubicación de su máquina rentada** (§4) | ✅ | Decisión de alcance: la ubicación queda excluida de cualquier acceso cliente, para siempre |
| Cl2 | ¿Reporte del recorrido para el dueño? (§4) | ⚠️ Sin respuesta | Si algún día sí: entregable ligado a `/clientes` |
| Cl3 | Estados de cuenta de retiros de material al cliente (docs-svr) | ✅ | Los 2 ESTADOS DE CUENTA de `docs-svr/` definen el formato: SOLO MATERIAL y MATERIAL Y FLETE, con retiros acumulados por folio |

### 2.6 /cotizaciones, /ventas, /ventas/corte
**El doc de dudas (§1–§11) no las menciona — cero impacto por esa vía.**
**PERO `docs-svr/` SÍ las define** (corrección 2026-11-12 al análisis original):

| Vista | Documento fuente | Qué aporta |
|---|---|---|
| `/cotizaciones` | COTIZACION 37/50 (Word) | Plantilla formal: folio, fecha, cliente, tabla concepto/cantidad/monto, condiciones fijas (**sin IVA · vigencia 8 días · turno 8 h/día · anticipar 1 semana**) y firma de la representante legal |
| `/ventas` | PRODUCTIVIDAD.xlsx | El **retiro/viaje** es la transacción de venta real: folio, fecha, camión, obra, material, m³, precio, total; LISTA DE PRECIOS.xlsx es el tabulador por material × destino × presentación (14m³/30m³/m³/7m) |
| `/ventas/corte` | REGISTRO DE VENTAS.xlsx | El corte de caja real: totales por día y por material, "NO HUBO EFECTIVO", efectivo "ENTREGADO [fecha]" a oficina |

---

## 3. OPERACIONES — correspondencia por vista

### 3.1 /operaciones (flota: máquinas, checklists, despachos, horómetro interno)
La sección con más correspondencia del documento:

| # | Punto | Estado | Implicación |
|---|---|---|---|
| O1 | Checklist: qué puntos se revisan, qué marca "Con Falla", ¿bloquea despacho/facturación?, ¿quién autoriza re-operación?, ¿firma/foto?, ¿a quién se avisa? (§5) | ⚠️ Mayoría sin respuesta | Rediseño del checklist |
| O2 | **"El checklist guarda 'luces y alarmas' como correcto sin preguntarlo"** (§10, error 3) | ✅ | **FIX directo** |
| O3 | Despachos: ¿a quién notificar al asignar? ¿cómo modificar/cancelar si la obra se adelanta o cancela? (§5) | ⚠️ Sin respuesta | Flujo de despachos |
| O4 | **Traslados de máquinas de terceros** (§4) | ✅ | Se operan como despachos especiales en `/operaciones` (+ facturación en `/facturas`, Fa3) |
| O5 | **Ubicación inicial de cada máquina: el patio** (§5) | ✅ | Alta con ubicación inicial patio |
| O6 | **Operador seleccionado de lista obligatoria** (§5) | ✅ | Select sin texto libre en alta/edición (equivalencia apodo↔persona de NÓMINA.xlsx pendiente) |
| O7 | **Baja de máquina incorporando los documentos entregados con la baja** (§5) | ✅ | Baja con adjuntos |
| O8 | **Foto de cada máquina: SI** + placas, serie, año, modelo (§5) | ✅ foto / ⚠️ resto | Ficha de máquina |
| O9 | **Estado de la máquina lo actualiza el operador: "OPERADOR ES RESPONSABLE DE SU UNIDAD"** (§5) | ✅ | Reglas de permisos sobre el estado |
| O10 | **Hilda (administrativo) controla licencias y pólizas con el vencimiento** (§5) | ✅ | Recordatorios de vencimiento — funcionalidad NUEVA. docs-svr lo confirma: PROYECTO AILIN lleva fechas de placas y servicios por unidad |
| O11 | ¿Componentes y vida útil? ¿historial de operadores por máquina? (§5) | ⚠️ Sin respuesta | Si dicen no, se cortan módulos ya maquetados |
| O12 | **Horómetro = registro del operador, interno; cobro solo por bitácora de renta**; la lectura sí actualiza la ficha (§6) | ✅ | Horómetro no-facturable, con actualización de ficha |
| O13 | **Solo camiones tienen GPS hoy; maquinaria se monitorea con horómetro manual** (§4 + proveedor) | ✅ | GPS real por IMEI solo para camiones; horómetro manual para el resto |
| O14 | **Solo GERENCIA puede corregir o borrar una lectura de horómetro** (§6) | ✅ | Permisos del horómetro: corrección/eliminación exclusiva de gerencia |
| O15 | ¿El estado de la máquina debe impedir que se despache o facture? (§5) | ⚠️ El cliente respondió "NO ENTIENDO LA PREGUNTA" — reformular | Gate de despacho/factura por estado de máquina |

### 3.2 /inventario
| # | Punto | Estado | Implicación |
|---|---|---|---|
| I1 | **"¿Las refacciones deben descontarse del inventario? SI"** (§7) | ✅ | Movimiento de SALIDA automático al consumir refacción en mantenimiento (cruza mantenimiento↔inventario) |
| I2 | ¿Pipa o tanque propio de diésel? ¿existencias, entradas y mermas? (§8) | ⚠️ Sin respuesta | Si sí: diésel como artículo con movimientos en `/inventario` |
| I3 | **Foto del ticket o del horómetro: SI** (§8) | ✅ | Evidencia en el registro de carga (anclable a inventario si hay tanque) |

### 3.3 /proyectos
| # | Punto | Estado | Implicación |
|---|---|---|---|
| Pr1 | Costo por obra (diésel + mantenimiento) — el modelo ya existe, falta F1 | ⚠️/✅ | `finanzas{ingresoCobrado, gastado}` |
| Pr2 | **Trabajador asignado a varias obras al mismo tiempo: SI es posible** (§1) | ✅ | `trabajadores_proyectos` multi-obra sin fricción (no tratarla como caso que bloquea) |
| Pr3 | **"¿Quién levantará las coordenadas y definirá el radio de cada obra? NECESITARIA EXPLICACION PARA PODERLO REALIZAR NOSOTROS MISMOS"** (§3) | ✅ | El cliente pide herramienta/guía para capturar coordenadas y radio por obra — vive donde se administran las obras (tras P15 = `/proyectos` o módulo GPS) |
| Pr4 | **El radio de obra DEBE VARIAR según el tipo de obra** (§3, asistencia) | ✅ | Radio ya no es valor fijo global: campo por obra/proyecto |
| Pr5 | Expediente del proyecto real (docs-svr: PROYECTO AILIN) | ✅ | Plantilla de obra con plantilla de trabajadores (RFC, domicilio, horario) y control de servicios por unidad — referencia funcional para `/proyectos` y `/operaciones` |

### 3.4 /reportes y /criba
**Barrido completo: el doc de dudas y los 12 documentos de `docs-svr/` no
mencionan reportes de campo ni criba. Cero impacto (por ahora).**

---

## 4. Corrección confirmada dentro de este alcance

| # | Error detectado | Respuesta del cliente | Vista |
|---|---|---|---|
| 3 | Checklist guarda "luces y alarmas" sin preguntarlo (§10, error 3) | (implícito) | **`/operaciones`** — checklists |

*(El error 6 del doc — responsive global — aplica a las 15 vistas también, pero
es regla global del repo. Los errores 1, 2, 4 y 5 de §10 son de RRHH y
Maquinaria: viven en el doc fuera-de-alcance.)*

---

## 5. Entregables del cliente que este alcance necesita (§11 filtrado)

- **Tarifas de renta por hora**, por máquina o tipo de máquina (alimenta C2).
- **Coordenadas y radio de cada obra** (alimenta Pr3/Pr4).
- **Lista de máquinas y sus operadores** (alimenta O6/O8).
- **Lista de máquinas con y sin GPS** (alimenta O13 y el egreso F4).
- **Datos de contacto del proveedor de GPS** (para la renta F4 y Cl1).

*(los entregables de nómina/RRHH — tabulador, dispersión, cuentas, carta de
finiquito — viven en el doc fuera-de-alcance)*

---

## 6. Orden de trabajo de este alcance

| Fase | Qué | Dependencia |
|---|---|---|
| **F1 — Fixes y reglas confirmadas de las 15 vistas** | Error 3 (checklist luces/alarmas en `/operaciones`), horómetro interno (O12 + O14), operador de lista obligatoria (O6), patio (O5), foto de máquina (O8), firma residente obligatoria (Fa2), cobro solo por bitácora (C1), multi-obra sin fricción (Pr2) | Ninguna — arrancable ya |
| **F2 — Preguntas de seguimiento** | Enviar al cliente: F1, F2, Fa1, O1, O3, O11, O15, I2, Cl2, P4 + el tabulador/tarifas de renta del §5 | Ninguna — puede ir en paralelo |
| **F3 — Cotizaciones/ventas según docs-svr** | Plantilla de cotización (condiciones de los Word), motor de retiros para `/ventas`, corte de `/ventas/corte`, estados de cuenta para `/cobranza` | Respuestas de docs-svr §5 del análisis (folio, precio, serie) |

*(las fases de GPS (F3–F5 originales), Nómina/Asistencia (F6), Finiquitos (F7)
y Mantenimiento/llantas/diésel (F8) viven en
`PLAN-FUERA-DE-ALCANCE-SISTEMA-GPS-RRHH-MAQUINARIA-2026-11-12.md`)*

---

## 7. Vínculo con IMPLEMENTACIONES-A-FUTURO.md y el doc fuera-de-alcance

> **NOTA de prioridad:** las series **P** (P2 partidas, P6 vendedor, P8 metas…)
> y **F** de `IMPLEMENTACIONES-A-FUTURO.md` siguen vigentes como hoja de ruta,
> pero **este plan las pospone**: primero se ejecutan las correcciones y
> decisiones de las 15 vistas (§2–§6 de este documento).
>
> **Lo que vive fuera de este plan** (Vista A/B de Sistema = P11/P12, ingesta
> GPS, geocercas/alertas, RRHH/nómina/finiquitos, mantenimiento/llantas/diésel)
> está completo y con la misma numeración en
> `PLAN-FUERA-DE-ALCANCE-SISTEMA-GPS-RRHH-MAQUINARIA-2026-11-12.md` — ese
> documento conserva la nota de que la Fase 0 (Sistema) arrancaba primero.
