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

## 1. ÍNDICE DE TRABAJO — arrancable SIN respuestas (2026-11-12)

> **ALCANCE ESTRICTO — solo se corrigen estas 15 vistas:**
> **Operaciones:** `/reportes` · `/operaciones` (bitácoras de operación) ·
> `/criba` · `/inventario` · `/proyectos`
> **Comercial:** `/clientes` · `/cotizaciones` · `/finanzas` · `/proveedores` ·
> `/ventas` · `/cobranza` · `/ventas/corte` · `/facturas`
>
> ⚠️ Las tareas de ficha de máquina, checklist, despachos, patio y horómetro
> viven físicamente en el módulo **Maquinaria** (`/maquinaria`) — FUERA de este
> alcance (ver §4). Nada de este índice requiere las dudas de
> `docs-svr/docs-svr-dudas/` (decisiones por defecto: §10 del análisis docs-svr).

### A. Confirmadas y ya implementadas (verificar, no construir)

| # | Tarea | Vista | Estado |
|---|---|---|---|
| A1 | Trabajador en varios proyectos sin fricción (Pr2) | `/proyectos` | ✅ ya implementado (`trabajadores_proyectos`) |
| A2 | Firma del residente gatea la facturación de bitácora (Fa2) | `/facturas` | ✅ ya implementado (workflow 02) — solo verificar |
| A3 | El horómetro JAMÁS genera CxC; cobro solo por bitácora de renta (C1 + O12) | `/operaciones` | ✅ ya implementado — bitácoras-renta es la única vía facturable |

### B. Pendientes dentro del alcance (de IMPLEMENTACIONES-A-FUTURO, sin dependencia de dudas)

| # | Tarea | Vista(s) | Estado |
|---|---|---|---|
| B1 | **P2: partidas de cotización** (`cotizacion_items`) + plantilla según los Word (concepto/cantidad/monto, condiciones precargadas) | `/cotizaciones` | ✅ HECHA completa (B1.1–B1.4, 2026-11-12) — ver §11 |
| B2 | **6.6: obra 1:1 con el proyecto** — el proyecto nace con **UNA** obra en la misma `$transaction` (guard idempotente) + sync de estados; se retira el diseño multi-frente y el botón «Agregar obra». Incluye sembrar la obra faltante de los proyectos activos (BD: 3 obras / 6 proyectos EN_PROCESO) | `/proyectos` → alimenta `/operaciones` y `/inventario` | ✅ HECHA completa (`83fb6198`, `c8423b02`, B2.3/B2.4 2026-11-12) — ver §10 |
| B3 | **FK `ventas.cliente_id`** + mini-modal de alta rápida de cliente en el POS (análisis §9.3 punto 4 — decisión de diseño, no requiere duda) | `/ventas` | ✅ HECHA completa (B3.1–B3.4, 2026-11-13) — ver §12 |
| B4 | **§10: fecha de vencimiento en CxP** — campo en OC → propagación a CxP → UI estado de cuenta | `/proveedores`, `/finanzas` | ✅ HECHA completa (B4.1–B4.4, 2026-11-13) — ver §12 |
| B5 | **F1: notificaciones funcionales** (modelo `notificaciones` + eventos del ERP + centro del Topbar cosido a API) | transversal (las 15 vistas) | ✅ HECHA completa (B5.1–B5.13, 2026-11-13/14) — ver §13 y `NOTIFICACIONES.md` |
| B6 | 6.4: FK `maquina_id`/`proyecto_id` en criba | `/criba` | ✅ HECHA completa (B6.1–B6.4, 2026-11-14) — ver §14 |
| B7 | 6.5: inventario ↔ criba (entradas desde producción) | `/inventario` | ✅ HECHA completa (B7.1–B7.4, 2026-11-14) — ver §15 |
| B8 | P8: metas de progreso con fecha límite (deriva `proyectos.progreso`) | `/proyectos` | ⏳ |
| B9 | P6: `vendedor_id` real | `/cotizaciones` | ⏳ |

> **Decisión del cliente (2026-11-12):** se conserva la tabla `obras` con
> relación **1:1 con el proyecto**: un proyecto crea **UNA** obra (misma
> `$transaction`, `obras.proyecto_id` único) y esa obra es la que alimenta
> `/operaciones`, asistencia (geocerca) y bitácoras. Se **descarta** el diseño
> multi-frente (obra base automática + botón «Agregar obra» + `obras[]`) y
> también la consolidación de `obras` en `proyectos` (**P15 queda descartada**).
> Plan por fases en **§10**.

### Orden de arranque propuesto

**B2** (obra 1:1 con el proyecto — prerrequisito operativo de `/operaciones` y
`/inventario`) → **B1** (partidas — habilita facturación por línea y la
plantilla de cotización) → **B3** (FK cliente en POS — prepara el crédito C3)
→ **B4 → B5 → B6–B7** → **B8 → B9**.

### ⛔ FUERA de este alcance (otro módulo u otra persona)

- **Fichas de máquina, checklists, despachos, patio, operador de lista, foto
  de máquina, horómetro interno** (O1–O13 del plan, antes A1–A4 del índice
  viejo): viven en el módulo **Maquinaria** (`/maquinaria`) — NO son de las
  15 vistas. El fix del checklist (O2) ya está implementado de punta a punta
  con tests (verificado 2026-11-12).
- **6.2 incidente→deriva** (`/incidentes` no está en las 15 vistas).
- **F5 config POS**: la pantalla vive en `/configuracion` (módulo Sistema) —
  solo el gate de `/ventas` sería de este alcance; queda pendiente de acuerdo.
- **F3 motor de retiros**: espera la regla del precio (CLAVE 1) y el amarrado
  del retiro al proyecto (CLAVE 2) — y toca `/ventas`+`/operaciones` (dentro de alcance, pero
  bloqueado).
- **Crédito en POS — validación de límite**: espera CLAVE 6 (la parte no
  bloqueante es B3).
- **Conciliación semanal de proveedores**: espera CLAVE 8 y 9.
- **Formatos de estado de cuenta (flete)**: espera CLAVE 4.
- **Desgloses de costo por proyecto**: espera el costeo F1 (CLAVE 3).

---

## 2. Vistas en alcance y leyenda

**Comercial:** `/clientes`, `/cotizaciones`, `/finanzas`, `/proveedores`,
`/ventas`, `/cobranza`, `/ventas/corte`, `/facturas`
**Operaciones:** `/reportes`, `/operaciones`, `/criba`, `/inventario`,
`/proyectos`

Leyenda de estado: ✅ confirmado por el cliente · ⚠️ pregunta sin respuesta
(bloquea diseño) · ❌ sin impacto.

---

## 3. COMERCIAL — correspondencia por vista

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
| Fa1 | ¿Para facturar, qué dato manda: proyecto, cliente u obra? (§5 Despachos) | ⚠️ parcialmente respondida (§6) | La lectura de renta se asocia a **combinación cliente+proyecto** ("un cliente puede tener distintos proyectos") — la trazabilidad despacho→factura sigue abierta |
| Fa2 | **"SI CADA NOTA DEBE ESTAR FIRMADA PARA RESPALDO DEL CLIENTE"** (§6) | ✅ | Regla dura: no se factura una bitácora de renta sin firma del residente |
| Fa3 | **Traslados de máquinas de terceros = otro servicio que brindamos** (§4) | ✅ | Servicio facturable NUEVO (concepto en factura; cotización si aplica). docs-svr lo ejemplifica: COTIZACION 47 cobra traslado de vibrocompactador como renglón propio |

### 2.4 /cobranza
| # | Punto | Estado | Implicación |
|---|---|---|---|
| C1 | **El horómetro del operador es SOLO información interna; el cobro EXCLUSIVAMENTE por bitácora de renta** (§6) | ✅ | Blindar anti-doble-cobro: horómetro jamás genera CxC |
| C2 | **Tarifa por TIPO DE MÁQUINA y CLIENTE**, distinta en nocturno/festivo/extra (§6) | ✅ | Cambia el monto de la CxC nacida de bitácora (tarifas reales pendientes en §5 entregables) |
| C3 | **El tiempo detenido en obra SE COBRA; el traslado NO** (salvo grúa/oruga baja) (§6) | ✅ | Define conceptos cobrables de la bitácora |
| C4 | La lectura de renta se asocia a **combinación cliente + proyecto** (§6) | ✅ | Modelo de CxC: cliente y proyecto como dimensiones separadas, no una sola |

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
| `/ventas` | Requisito de crédito (análisis §9.3) | **Alta de cliente en el momento de la venta**: NO se necesita vista nueva — `/clientes` ya crea/edita clientes; lo que falta es (1) FK `ventas.cliente_id` (hoy `cliente` es texto libre "Público en general", verificado en schema — el POS no vincula la venta a un cliente real, prerrequisito del crédito C3) y (2) un mini-modal de **alta rápida de cliente dentro de `/ventas`** (nombre + teléfono mínimo, editable después en `/clientes`) para el cliente que llega sin estar registrado |
| `/ventas/corte` | REGISTRO DE VENTAS.xlsx | El corte de caja real: totales por día y por material, "NO HUBO EFECTIVO", efectivo "ENTREGADO [fecha]" a oficina |

---

## 4. OPERACIONES — correspondencia por vista

> ⚠️ **ACLARACIÓN DE UBICACIÓN FÍSICA (2026-11-12):** la vista `/operaciones`
> es **solo bitácoras de operación** (horas por máquina/proyecto, `bitacoraApi`).
> Los puntos O1–O13 de la ficha de máquina, checklist, despachos, patio,
> operador, foto y horómetro **viven físicamente en el módulo Maquinaria
> (`/maquinaria`)** — no son de este alcance. De esta tabla, lo que toca
> directamente las vistas del dueño es: bitácoras (6.1 ya implementada),
> `Pr2` (`/proyectos`) y los reglajes de la Sección A del índice (§1).

### 3.1 /operaciones (flota: máquinas, checklists, despachos, horómetro interno)
La sección con más correspondencia del documento:

| # | Punto | Estado | Implicación |
|---|---|---|---|
| O1 | Checklist: qué puntos se revisan, qué marca "Con Falla", ¿bloquea despacho/facturación?, ¿quién autoriza re-operación?, ¿firma/foto?, ¿a quién se avisa? (§5) | ⚠️ Mayoría sin respuesta | Rediseño del checklist |
| O2 | **"El checklist guarda 'luces y alarmas' como correcto sin preguntarlo"** (§10, error 3) | ✅ | **FIX directo** |
| O3 | Despachos: ¿a quién notificar al asignar? ¿cómo modificar/cancelar si la obra se adelanta o cancela? (§5) | ⚠️ Sin respuesta | Flujo de despachos |
| O4 | **Traslados de máquinas de terceros** (§4) | ✅ | Se operan como despachos especiales en `/operaciones` (+ facturación en `/facturas`, Fa3) |
| O5 | **Ubicación inicial de cada máquina: el patio** (§5) | ✅ | Alta con ubicación inicial patio |
| O6 | **Operador seleccionado de lista obligatoria** (§5) | ✅ | Select sin texto libre en alta/edición — con nombre completo de la persona (apodo como sobrenombre, decisión A27 del análisis docs-svr) |
| O7 | **Baja de máquina incorporando los documentos entregados con la baja** (§5) | ✅ | Baja con adjuntos |
| O8 | **Foto de cada máquina: SI** + placas, serie, año, modelo (§5) | ✅ foto / ⚠️ resto | Ficha de máquina |
| O9 | **Estado de la máquina lo actualiza el operador: "OPERADOR ES RESPONSABLE DE SU UNIDAD"** (§5) | ✅ | Reglas de permisos sobre el estado |
| O10 | **Hilda (administrativo) controla licencias y pólizas con el vencimiento** (§5) | ✅ | Recordatorios de vencimiento — funcionalidad NUEVA. docs-svr lo confirma: PROYECTO AILIN lleva fechas de placas y servicios por unidad |
| O11 | ¿Componentes y vida útil? ¿historial de operadores por máquina? (§5) | ⚠️ Sin respuesta | Si dicen no, se cortan módulos ya maquetados |
| O12 | **Horómetro = registro del operador, interno; cobro solo por bitácora de renta**; la lectura sí actualiza la ficha (§6) | ✅ | Horómetro no-facturable, con actualización de ficha |
| O13 | **Solo camiones tienen GPS hoy; maquinaria se monitorea con horómetro manual** (§4 + proveedor) | ✅ | GPS real por IMEI solo para camiones; horómetro manual para el resto |

### 3.2 /inventario
| # | Punto | Estado | Implicación |
|---|---|---|---|
| I1 | **"¿Las refacciones deben descontarse del inventario? SI"** (§7) | ✅ | Movimiento de SALIDA automático al consumir refacción en mantenimiento (cruza mantenimiento↔inventario) |
| I2 | ¿Pipa o tanque propio de diésel? ¿existencias, entradas y mermas? (§8) | ⚠️ Sin respuesta | Si sí: diésel como artículo con movimientos en `/inventario` |
| I3 | **Foto del ticket o del horómetro: SI** (§8) | ✅ | Evidencia en el registro de carga (anclable a inventario si hay tanque) |

### 3.3 /proyectos
| # | Punto | Estado | Implicación |
|---|---|---|---|
| Pr1 | Costo por proyecto (diésel + mantenimiento) — el modelo ya existe, falta F1 | ⚠️/✅ | `finanzas{ingresoCobrado, gastado}` |
| Pr2 | **Trabajador asignado a varios proyectos al mismo tiempo: SI es posible** (§1) | ✅ | `trabajadores_proyectos` multi-proyecto sin fricción (no tratarla como caso que bloquea) |
| Pr3 | **"¿Quién levantará las coordenadas y definirá el radio de cada obra? NECESITARIA EXPLICACION PARA PODERLO REALIZAR NOSOTROS MISMOS"** (§3) | ✅ | El cliente pide herramienta/guía para capturar coordenadas y radio — vive en la **obra 1:1 del proyecto** (`obras.lat/lng/radio_permitido_metros`, capturados desde `/proyectos` o `/asistencia`) |
| Pr4 | **El radio DEBE VARIAR según el tipo de proyecto** (§3, asistencia) | ✅ | Radio ya no es valor fijo global: campo por **obra** (1:1 con su proyecto) |
| Pr5 | Expediente del proyecto real (docs-svr: PROYECTO AILIN) | ✅ | Plantilla del proyecto con plantilla de trabajadores (RFC, domicilio, horario) y control de servicios por unidad — referencia funcional para `/proyectos` y `/operaciones` |

### 3.4 /reportes y /criba
**Barrido completo: el doc de dudas y los 12 documentos de `docs-svr/` no
mencionan reportes de campo ni criba. Cero impacto (por ahora).**

---

## 5. Corrección confirmada dentro de este alcance

| # | Error detectado | Respuesta del cliente | Vista |
|---|---|---|---|
| 3 | Checklist guarda "luces y alarmas" sin preguntarlo (§10, error 3) | (implícito) | **`/operaciones`** — checklists |

*(El error 6 del doc — responsive global — aplica a las 15 vistas también, pero
es regla global del repo. Los errores 1, 2, 4 y 5 de §10 son de RRHH y
Maquinaria: viven en el doc fuera-de-alcance.)*

---

## 6. Entregables del cliente que este alcance necesita (§11 filtrado)

- **Tarifas de renta por hora**, por máquina o tipo de máquina (alimenta C2).
- **Coordenadas y radio de cada obra** (alimenta Pr3/Pr4; la obra es 1:1 con su proyecto).
- **Lista de máquinas y sus operadores** (alimenta O6/O8).
- **Lista de máquinas con y sin GPS** (alimenta O13 y el egreso F4).
- **Datos de contacto del proveedor de GPS** (para la renta F4 y Cl1).

*(los entregables de nómina/RRHH — tabulador, dispersión, cuentas, carta de
finiquito — viven en el doc fuera-de-alcance)*

---

## 7. Orden de trabajo de este alcance

| Fase | Qué | Dependencia |
|---|---|---|
| **F1 — Fixes y reglas confirmadas de las 15 vistas** | Error 3 (checklist luces/alarmas en `/operaciones`), horómetro interno (O12), operador de lista obligatoria (O6), patio (O5), foto de máquina (O8), firma residente obligatoria (Fa2), cobro solo por bitácora (C1), multi-proyecto sin fricción (Pr2) | Ninguna — arrancable ya |
| **F2 — Preguntas de seguimiento** | Enviar al cliente: F1, F2, Fa1, O1, O3, O11, I2, Cl2, P4 + el tabulador/tarifas de renta del §5. **Las dudas por documento viven en `docs-svr/docs-svr-dudas/` (solo necesarias y medias — las asumibles se retiraron y quedaron como decisiones por defecto en el §10 del análisis docs-svr)** | Ninguna — puede ir en paralelo |
| **F3 — Cotizaciones/ventas según docs-svr** | Plantilla de cotización (condiciones de los Word), motor de retiros para `/ventas`, corte de `/ventas/corte`, estados de cuenta para `/cobranza` | Respuestas de docs-svr §5 del análisis (folio, precio, serie) |

*(las fases de GPS (F3–F5 originales), Nómina/Asistencia (F6), Finiquitos (F7)
y Mantenimiento/llantas/diésel (F8) viven en
`PLAN-FUERA-DE-ALCANCE-SISTEMA-GPS-RRHH-MAQUINARIA-2026-11-12.md`)*

---

## 8. Vínculo con IMPLEMENTACIONES-A-FUTURO.md y el doc fuera-de-alcance

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

---

## 9. Hilo conductor — orden de ejecución de los 3 documentos

```
[0] ANALISIS-DOCS-SVR-PROCESOS-EXCEL-2026-11-12.md   (TERMINADO — insumo)
      │ reglas de negocio + 4 dudas bloqueantes
      ▼
[1] ESTE PLAN  (vigente — se ejecuta ahora)
      F1 fixes/reglas confirmadas ──► F2 preguntas (paralelo) ──► F3 retiros/cotizaciones/corte
      │                                                              │
      │ cuando F3 termina o entrega sus primeros módulos             │
      ▼                                                              ▼
[2] IMPLEMENTACIONES-A-FUTURO.md  (después)          ENLACES PUNTUALES (se construyen juntos):
      · P2 partidas de cotización  ◄────────────────── la plantilla de cotización de F3
        (los Word definen concepto/cantidad/monto = cotizacion_items)
      · P7 precios por medida  ◄───────────────────── LISTA DE PRECIOS.xlsx como tabulador
      · C3 venta a crédito → CxC  ◄────────────────── el motor de retiros (un retiro ES venta
        de material — este plan define si nace CxC directo o pasa por /ventas)
      · §9/§10 (conciliación bancaria / vencimiento CxP) ◄── conciliación semanal de
        proveedores externos + P4 (bloqueo de carga conciliada) de este plan
      · el resto (6.2–6.6, P8, F1, F5, P13–P14) sin dependencia del hilo —
        según el orden interno de ese documento
```

**Regla del hilo:** terminar una fase de este plan libera el bloque
correspondiente de `IMPLEMENTACIONES-A-FUTURO.md` — no se arranca esa serie
antes de que su habilitador de este plan exista (ej.: no construir P2 sin la
plantilla de cotización que define QUÉ renglones lleva).

---

## 10. Plan de implementación B2 — la obra nace 1:1 con el proyecto (fases separadas)

> **Diseño:** se conserva la tabla `obras`. Cada proyecto tiene **exactamente
> una** obra (`obras.proyecto_id` único). No hay botón «Agregar obra», ni
> multi-frente, ni `obras[]`, ni consolidación de `obras` en `proyectos`
> (**P15 queda descartada**). La obra se crea sola junto con el proyecto y
> hereda su nombre y su ubicación; la geocerca (`lat/lng/radio_permitido_metros`)
> se captura después con el endpoint que **ya existe**
> (`PATCH /asistencia/obras/:id/ubicacion`, permiso `rrhh.asistencia.editar`).
>
> **Por qué en fases:** el cambio toca datos, backend y UI. Cada fase se
> verifica y se commitea sola para que un error no arrastre a la siguiente.

**Avance (2026-11-12):** **B2 completa** — las 4 fases hechas y verificadas.

| Fase | Estado | Evidencia |
|---|---|---|
| B2.1 Datos | ✅ HECHA | `83fb6198` — índice único `obras_proyecto_id_key`, 6 obras de backfill, 9 proyectos / 9 obras / 0 huérfanas |
| B2.2 Backend | ✅ HECHA | `c8423b02` — `$transaction` en create/update/remove, sync de estados, auditoría con `obraId`/`estadoObra`; unit 31/31, integración 14/14 |
| B2.3 UI | ✅ HECHA | texto visible de `/proyectos` y del detalle pasa a "Obra"; sidebar renombrado con la migración `20261112050000_vista_obras`; `/operaciones` y `/asistencia` sin cambios de código |
| B2.4 Gates | ✅ HECHA | `test` 1324/1326 (2 fallos preexistentes de `cobranza`), `tsc` limpio, `lint` con el baseline de 56, smoke real de las 3 vistas |

**Desviaciones respecto al plan:** `prisma migrate dev` no puede replayar el
historial reconstruido de esta BD, así que la migración se aplicó con
`prisma db execute` + `migrate resolve --applied`. El backfill dejó 9/9 (no 7
obras en el catálogo) y, por acuerdo posterior, el catálogo de obras de
`/operaciones` pasó a filtrar **estrictamente `EN_PROCESO`** (`230c2d60`), no
"todo menos FINALIZADA".

**Ajustes posteriores de `/proyectos`** (fuera de B2, ya commiteados):
`230c2d60` presupuesto con comas + alta sin fecha de hoy · `6e1196de` estado sin
badge · `6ca8c740` fecha de inicio sin días pasados · `353c03f1` columna
`municipio` · `78aebb8a` ubicación 2×3, editar sin progreso, finanzas con comas ·
`9515a1d1` acción "Estado" con modal · `3d65d73d` editar sin select de estado.

**Estado ANTES de B2.1 (2026-11-12):** 9 proyectos vivos (6 EN_PROCESO) ·
3 obras, las 3 ya 1:1 con un proyecto del mismo nombre, sin geocerca capturada ·
3 `registros_asistencia` con `obra_id` · 0 bitácoras de operación/renta y 0
reportes de campo con `obra_id`. **Faltan 6 obras** — incluidos 4 de los 6
proyectos EN_PROCESO, que son la causa del catálogo cojo de `/operaciones`
(no es un bug de filtro).

**Estado DESPUÉS de B2.1/B2.2 (verificado 2026-11-12):** **16 proyectos vivos /
16 obras vivas / 0 proyectos sin obra** — la relación 1:1 ya la garantiza el
índice único. Las obras nuevas nacen **sin geocerca** (`lat/lng/radio` NULL):
se ubican después desde `/asistencia` ("Ubicar obra").

### B2.1 — Datos (una sola migración, idempotente) — ✅ HECHA (`83fb6198`)

**`apps/api/prisma/schema.prisma`:** en `model obras`, `proyecto_id` pasa a
`@@unique([proyecto_id])` (una obra por proyecto, garantizado por la BD). Sin
columnas nuevas — la geocerca ya vive en `obras`.

**Migración** (`npx prisma migrate dev --name obras_1a1 --create-only`, SQL a
mano, todo en una transacción):

1. `CREATE UNIQUE INDEX "obras_proyecto_id_key" ON "obras"("proyecto_id");`
2. **Backfill** — una obra por cada proyecto vivo sin obra:
   ```sql
   INSERT INTO obras (id, nombre, estado, proyecto_id, ubicacion, activo,
                      creado_en, actualizado_en)
   SELECT gen_random_uuid(),
          p.nombre,
          CASE p.estado WHEN 'FINALIZADO' THEN 'FINALIZADA' ELSE 'EN_PROCESO' END,
          p.id,
          NULLIF(concat_ws(', ', p.calle, p.colonia, p.ciudad, p.estado_ubicacion), ''),
          true, now(), now()
   FROM proyectos p
   WHERE p.eliminado_en IS NULL
     AND NOT EXISTS (SELECT 1 FROM obras o WHERE o.proyecto_id = p.id);
   ```
   (`codigo` y `creado_por` quedan NULL; el nombre es el del proyecto, igual
   que las 3 obras que ya existen.)
3. **Normalización de estados** (caso "Puente Atizapán", obra EN_PROCESO con
   proyecto FINALIZADO): las obras de proyectos FINALIZADO pasan a FINALIZADA.

**Verificación:** `count(*)` de proyectos vivos = `count(*)` de obras (9) ·
`npx prisma migrate diff` vacío · `GET /bitacora/catalogos` devuelve 7 obras
(los 6 EN_PROCESO + el PAUSADO; excluye FINALIZADA).

**Riesgo:** la migración **inserta datos** — correr con respaldo previo
(`pg_dump svr_erp`) y en el servidor vía `migrate deploy`, nunca re-replays del
historial.

### B2.2 — Backend (`apps/api/src/proyectos/`) — ✅ HECHA (`c8423b02`)

| Archivo | Cambio |
|---|---|
| `proyectos.service.ts` → `create()` | Envolver en `this.prisma.$transaction`: `proyectos.create` + `obras.create` (mismo `nombre`, `proyecto_id`, estado mapeado, `ubicacion` compuesta con calle/colonia/ciudad/estado, `creado_por`). Si la obra falla, el proyecto no queda creado. |
| `proyectos.service.ts` → `update()` | Misma transacción: si viene `estado`, sincronizar la obra — `FINALIZADO → FINALIZADA`, `EN_PROCESO → EN_PROCESO`, **`PAUSADO` sin cambio** (`EstadoObra` no tiene PAUSADA; si el cliente quiere ocultarla del catálogo, se agrega el valor en otra fase). |
| `proyectos.service.ts` → `remove()` | Misma transacción: soft-delete de la obra (`eliminado_en`, `activo: false`) junto con el proyecto — sin obras huérfanas en catálogos. |
| Auditoría | Sin acciones nuevas (`AuditAction` es enum de BD): `PROYECTO_CREADO` incluye `obraId` en `newValue` y `PROYECTO_ACTUALIZADO` incluye el estado de la obra en `previous/newValue`. No hay FAIL nuevo que auditar: no existe regla de negocio que falle (la 1:1 la garantiza el índice único). |

Sin DTOs nuevos, sin endpoints nuevos, sin permisos nuevos (los `proyectos.*`
ya existen).

**Tests:**
- Unit `proyectos.service.spec.ts`: `create` usa `$transaction` y crea la obra
  con nombre/estado/ubicación heredados; `update` con `FINALIZADO` sincroniza
  `FINALIZADA`; `PAUSADO` no toca la obra; `remove` soft-deletea la obra.
- Integración `proyectos.integration.spec.ts` (BD real): el proyecto nace con
  su obra; **un segundo `obras.create` con el mismo `proyecto_id` es rechazado
  por el índice único (P2002)**; estado sincronizado; soft-delete en cascada;
  `registro_auditoria` conserva `PROYECTO_CREADO` SUCCESS y el DELETE contra la
  auditoría sigue rechazado por el trigger.

### B2.3 — UI: el cliente llama "obra" al proyecto — ✅ HECHA (2026-11-12)

| Archivo | Cambio |
|---|---|
| `apps/web/src/app/(dashboard)/proyectos/page.tsx` | **Todos los textos visibles** pasan de "Proyecto" a "Obra": título de la vista ("Gestión de Obras"), botón ("Nueva Obra"), KPI ("Total Obras"), buscador, `emptyText`, columna ("Obra / Cliente"), títulos y `submitLabel` de los modales (Nueva Obra / Editar Obra / Eliminar Obra / Cambiar Estado), labels ("Nombre de la obra", "Estado de la obra"), subtítulo del modal y los toasts de crear/editar/eliminar/cargar. |
| `apps/web/src/components/projects/ProjectDetailsModal.tsx` | Los 3 subtítulos vacíos ("Este proyecto aún no tiene hitos…", "No hay trabajadores asignados a este proyecto", "No hay despachos activos hacia este proyecto") pasan a "obra". |
| `apps/api/prisma/migrations/20261112050000_vista_obras` | `UPDATE vistas SET nombre = 'Obras' WHERE ruta = '/proyectos'` — el sidebar toma la etiqueta de `vistas.nombre`, así que el menú dice **Obras**. |
| `/operaciones` y `/asistencia` | **Sin cambios de código**: los selects ya leen `GET /bitacora/catalogos` y `GET /catalogos/obras`; el modal "Ubicar obra" ya escribe la geocerca de la obra 1:1. |

> **Corrección al plan original:** la primera versión de B2.3 decía renombrar
> "obra" → "proyecto". El cliente decidió lo contrario (2026-11-12): en la UI
> el término de negocio es **obra**; "proyecto" queda solo en la API, la BD y
> los permisos (`proyectos.*`), sin renombrar tablas ni endpoints.

**Verificación manual:** crear una obra → aparece en el catálogo de
`/operaciones` sin pasos extra; marcarla FINALIZADA → desaparece del catálogo.

### B2.4 — Gates y cierre — ✅ HECHA (2026-11-12)

`npx prisma validate` + `migrate diff` vacío · `npm run test` ·
`npm run test:integration` · `npx tsc --noEmit` (web) · `npm run lint` · smoke
manual de `/proyectos`, `/operaciones` y `/asistencia` documentado en
`historial-cambios/`.

**Resultado de los gates:** `npm run test` (api) **1324 passed / 2 failed** —
los 2 fallos son los preexistentes de `cobranza.service.spec.ts`
(`ATRASO_GRAVE` en el CSV, ajenos a B2) · `tsc --noEmit` web limpio ·
`npm run lint` **56 problemas (18 errores, 38 warnings)**, el mismo baseline
preexistente; los archivos tocados solo arrastran sus 2 avisos de antes.
**Smoke real con la API en :3001:** `/catalogos/obras` → 13 obras ·
`/bitacora/catalogos` → 13 obras, todas `EN_PROCESO` · `/proyectos` → 16
registros · `/auth/profile` devuelve la vista `/proyectos` con
`nombre: "Obras"`.

**Fuera de B2 (no se construye aquí):** captura de coordenadas/radio desde la
UI de `/proyectos` (hoy se hace desde `/asistencia` — Pr3) · P8 metas/progreso ·
P3 cotización→proyecto · la PWA (`/m/flota-obras` sigue en pausa y no se toca).

---

## 11. Plan de implementación B1 — partidas de cotización (EJECUTADO 2026-11-12)

> **Diseño:** la cotización deja de ser `descripcion + monto` plano y gana
> renglones (`cotizacion_items`: descripción / cantidad / unidad / precio
> unitario → importe calculado en servidor) con las condiciones precargadas de
> los Word (`docs-svr/COTIZACION 37/50.docx`). El `monto` de la cabecera se
> **recalcula** como Σ importes cuando hay partidas; las cotizaciones viejas
> (sin partidas) siguen funcionando igual. Al facturar, la factura hereda un
> concepto por renglón con IVA por partida.

| Fase | Estado | Evidencia |
|---|---|---|
| B1.1 Datos | ✅ HECHA | `a2a527ff` — tabla `cotizacion_items` (FK cascade) + `cotizaciones.condiciones`; migración `20261112060000` aplicada con `db execute` + `migrate resolve` |
| B1.2 Backend | ✅ HECHA | `5ec239f7` — DTOs anidados, create/update transaccional con reemplazo de partidas, `facturar` por renglón (IVA por partida); unit 83/83, integración 262/263 |
| B1.3 UI | ✅ HECHA | `2c43917d` (editor de partidas + condiciones + subtotal bloqueado) + cierre — detalle con tabla de renglones y condiciones; "Creada por" en el detalle |
| B1.4 Gates | ✅ HECHA | `jest` 1328/1330 (2 fallos preexistentes de cobranza), `tsc` limpio, lint 56 baseline, smoke real: cotización de 3 partidas → monto 30,500 → factura FAC-2026-0003 con 3 conceptos y total 35,380 (IVA 4,880) |

**Ajustes posteriores pedidos por el cliente (mismo día):** estado de
cotización como texto plano (sin badges de color) y área de condiciones más
grande (`2c43917d`) · **"Creada por"** en el detalle · subtotal con comas
automáticas, fecha capturada sola (se quita el input de crear/editar) y
modales Nueva/Editar/Ver más anchos (`59340c62`) · compensación del scrollbar
al abrir modales para que la página no salte — cambio en el kit `Modal`,
aplica a toda la app (`f13e9679`).

**Deuda anotada:** el spec de integración de PIN acumula fallos a nivel IP
entre corridas (bloqueo automático por IP a los 10 intentos en 15 min) → 423
LOCKED donde espera 401; flake preexistente de auth, fuera de B1.

**Fuera de B1 (no se construye aquí):** P4 bajada de inventario desde partidas
· P3 cotización→proyecto · precios por medida (P7, tabulador LISTA DE PRECIOS).

---

## 12. Plan de implementación B3 — cliente real en el POS (EJECUTADO 2026-11-13)

> **Diseño:** el POS deja de mandar "Público en general" fijo: puede elegir un
> cliente del catálogo y dar de alta uno nuevo sin salir de la venta. La FK
> `ventas.cliente_id` es **nullable** — las ventas sin cliente siguen naciendo
> igual. El nombre en `ventas.cliente` es un **snapshot** (empresa || nombre):
> los tickets no cambian ni se rompen si el cliente se edita después.

| Fase | Estado | Evidencia |
|---|---|---|
| Prerrequisito: empresa opcional | ✅ HECHA | `8f0bfd40` — migración `20261112130000_clientes_empresa_opcional` + DTO/service/web (clientes sin empresa) |
| B3.1 Datos | ✅ HECHA | `12d05ca6` — `ventas.cliente_id` FK nullable + índice, migración `20261112140000` |
| B3.2 Backend | ✅ HECHA | `5c9085fe` — `clienteId?` en el DTO, validación con `fallir`/`CLIENTE_NO_ENCONTRADO`, snapshot del nombre, `clienteId` en el serializer; unit 57/57, integración 12/12 |
| B3.3 UI POS | ✅ HECHA | selector de cliente en el carrito + mini-modal de alta rápida (nombre/empresa opcional/teléfono/correo); el cobro manda `clienteId` |
| B3.4 Gates | ✅ HECHA | `jest` 1330/1332 (2 fallos preexistentes de cobranza), `tsc` limpio, lint 56 baseline, smoke real: venta con cliente → `cliente_id` poblado en BD y snapshot "Peluqueria Smoke"; venta sin cliente → "Público en general" NULL |

**Hallazgo ambiental:** el suite de integración de ventas y el smoke dependen
del horario de atención en BD (07:00–02:00 real). Se corrió con 00:00–23:59
temporal y **restaurado** al terminar (verificado). Deuda: los specs de
integración deberían fijar su propio horario (como los unit con `TURNO_*`).

**Fuera de B3 (no se construye aquí):** C3 venta a crédito → CxC desde el POS ·
historial de compras por cliente en /clientes (depende de este `cliente_id`).

---

## 13. Plan de implementación B5 — notificaciones funcionales (EJECUTADO 2026-11-13/14)

> **Diseño final (con los ajustes del cliente durante la prueba):** una fila
> por evento con **destinatarios explícitos elegidos al emitir** (usuario /
> torre(área) / rol / todos) — sin depender de menús ni vistas; lectura y
> descarte **por persona** en la tabla puente `notificaciones_lecturas`;
> el actor no recibe su propio aviso. Documentación completa de uso y
> prueba: `docs-prioridades/NOTIFICACIONES.md`.

| Fase | Estado | Evidencia |
|---|---|---|
| B5.1 BD | ✅ HECHA | `0009d0ed` — tabla `notificaciones` (enum ALERTA/INFO, audiencia por rol) |
| B5.2 Backend | ✅ HECHA | `4c3f7bc8` — módulo con `emitir` best-effort + buzón paginado + permiso #107 `sistema.notificaciones.ver` (los 6 roles) + `AuditAction.NOTIFICACION_LEIDA` |
| B5.3 Eventos | ✅ HECHA | `e251ceca` — OC aprobada, abono registrado, cierre de caja pendiente, nómina pagada |
| B5.4 Frontend | ✅ HECHA | `01b584a5` — centro del Topbar cosido al API (polling 60s, badge, marcar leídas); mock eliminado |

**Ajustes posteriores durante la prueba (cada uno su commit):**
- `2c43917d`/`59340c62` estado sin badges, condiciones más amplias, subtotal
  con comas, fecha automática, modales anchos (cotizaciones) · `f13e9679`
  compensación del scrollbar en todos los modales.
- `30c14f50`+`f4a667ca` **lectura/descarte por persona** (`notificaciones_lecturas`)
  y **buzón por destinatario explícito** (usuario/torre/rol/todos, sin role_vistas)
  — el actor no recibe su propio aviso (B5.9).
- `5ca3a547`+`c8923f9a` **FK `trabajadores.usuario_id`** (exacto para el
  asignado; backfill por nombre único enlazó las cuentas existentes) ·
  `b605288a` los **5 flujos de reportes** (creación→área, aceptación→creador,
  reasignación→anterior+`8a7fbee8`→nuevo, cierre→asignado, actividades→la otra
  parte) · `b42653f6` fix del cierre (el asignado por texto ahora notifica vía
  `reportes_campo.asignado_user_id`) + limpieza del rate limiting (límite de
  login hardcodeado que pisaba el .env; throttler `long` muerto).
- `35c40d42` (revertido por `ca071464`): acceso a /proveedores para
  Administrativo — sustituido por los destinatarios explícitos.

**Pendiente de decisiones del SVR** (dudas #34/#7/#5 de
`DUDAS-VISTAS-SVR.txt`): evento de CxP/CxC por vencer/vencidas (alertas y
estado "VENCIDA") — la tubería está lista (`emitirARol` + cron pendiente).

---

## 14. Plan de implementación B6 — máquina y proyecto en criba (EJECUTADO 2026-11-14)

> **Diseño (6.4 de IMPLEMENTACIONES-A-FUTURO):** los registros de criba
> atribuyen su producción a una **máquina** y a un **proyecto** (ambos
> opcionales — los registros previos quedan intactos). El proyecto debe estar
> **EN_PROCESO** (mismo criterio que reportes/obras). La máquina se envía por
> **CÓDIGO** (`M001`) — el patrón que despachos ya usa — y el backend la
> resuelve al UUID real para el FK.

| Fase | Estado | Evidencia |
|---|---|---|
| B6.1 BD | ✅ HECHA | `29ec23e6` — `maquina_id` + `proyecto_id` (FKs SET NULL, índices, back-relations) |
| B6.2 Backend | ✅ HECHA | `43dd394d` + fix `90791f75` — DTOs, validadores con audit FAIL (`MAQUINA_NO_ENCONTRADA`, `PROYECTO_NO_EN_PROCESO`), filtros, serialize |
| B6.3 UI | ✅ HECHA | `b4e0d4b2` — selects en alta/edición, columnas en la tabla, filtros con chips |
| B6.4 Gates | ✅ HECHA | unit **39/39** + integración **6/6**, `tsc` limpio, smoke real: registro con `M001` → FK UUID en BD y filtros por código/proyecto ✓ |

**Fuera de B6 (no se construye aquí):** B7 (entradas de criba → inventario,
transacción) · KPIs de producción por máquina (el listado filtrable ya
responde).

---

## 15. Plan de implementación B7 — criba → inventario (EJECUTADO 2026-11-14)

> **Diseño (6.5 + propuesta del cliente):** un **catálogo de materiales de
> criba** (`materiales_criba`: Criba fina / Criba gruesa / Arena lavada) —
> cada material enlaza a su **artículo de inventario** por id. El registro de
> criba enlaza al material (`material_criba_id`) y el envío a inventario usa
> ese id (exacto, sin match por nombre). La cantidad que entra = **material
> al banco** (el producido incluye merma). El envío es un **botón explícito
> por registro**, con guard anti-doble-envío en la misma transacción.

| Fase | Estado | Evidencia |
|---|---|---|
| B7.1 BD | ✅ HECHA | `dd06efeb` — tabla `materiales_criba` (seed 3 materiales + artículo "Arena de río" renombrado a "Arena lavada"), `material_criba_id` FK + `inventario_en`, backfill 8/8 registros |
| B7.2 Backend | ✅ HECHA | `e5fdaebb` — `materialId` en DTOs (snapshot `tipo_material`), **`POST /criba/:id/inventario`** con transacción (`aplicarEntrada` + guard anti-doble) y auditoría; unit 40/40, integración 9/9 |
| B7.3 UI | ✅ HECHA | `141042f3` — select "Material" del catálogo (con stock), botón "A inventario" con confirmación, columna "Inventario", filtro por material |
| B7.4 Gates | ✅ HECHA | `tsc` limpio, smoke real: enviar → **stock sube 118 → 173**, movimiento trazable, segundo envío rechazado (CONFLICT), filtro `materialId` ✓ |

**Fuera de B7 (no se construye aquí):** CRUD de materiales de criba (agregar
material nuevo = fila del catálogo) · KPIs por material ya existentes ·
salidas de inventario por cotizaciones (P4).
