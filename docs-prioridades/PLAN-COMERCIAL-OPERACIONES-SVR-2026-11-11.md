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
| B1 | **P2: partidas de cotización** (`cotizacion_items`) + plantilla según los Word (concepto/cantidad/monto, condiciones precargadas) | `/cotizaciones` | ⏳ |
| B2 | **P15: el proyecto ES la obra** — se ELIMINA el flujo proyecto→obra (6.6: obra base, multi-frente, botón «Agregar obra», `obras[]`); se consolida la tabla `obras` en `proyectos` (`/operaciones`, `/asistencia`, bitácoras y reportes-campo pasan a `proyecto_id` + `/catalogos/proyectos`) | `/proyectos` → alimenta `/operaciones` y `/inventario` | ⏳ |
| B3 | **FK `ventas.cliente_id`** + mini-modal de alta rápida de cliente en el POS (análisis §9.3 punto 4 — decisión de diseño, no requiere duda) | `/ventas` | ⏳ |
| B4 | **§10: fecha de vencimiento en CxP** — campo en OC → propagación a CxP → UI estado de cuenta | `/proveedores`, `/finanzas` | ⏳ |
| B5 | **F1: notificaciones funcionales** (modelo `notificaciones` + eventos del ERP + centro del Topbar cosido a API) | transversal (las 15 vistas) | ⏳ |
| B6 | 6.4: FK `maquina_id`/`proyecto_id` en criba | `/criba` | ⏳ |
| B7 | 6.5: inventario ↔ criba (entradas desde producción) | `/inventario` | ⏳ |
| B8 | P8: metas de progreso con fecha límite (deriva `proyectos.progreso`) | `/proyectos` | ⏳ |
| B9 | P6: `vendedor_id` real | `/cotizaciones` | ⏳ |

> **Decisión del cliente (2026-11-12):** el sistema maneja **un solo nivel:
> `proyectos`** — **el proyecto ES la obra**. Se elimina todo el diseño de "un
> proyecto con una o varias obras" (obra base automática, multi-frente, botón
> «Agregar obra», `obras[]`, sync de estados obra↔proyecto). Lo que antes era
> B2 "flujo proyecto→obra" ahora es **P15** (consolidar `obras` en
> `proyectos`).

### Orden de arranque propuesto

**B2** (consolidar `obras` en `proyectos` — el proyecto ES la obra;
prerrequisito operativo de `/operaciones` y `/inventario`) → **B1** (partidas —
habilita facturación por línea y la
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
| Pr3 | **"¿Quién levantará las coordenadas y definirá el radio de cada obra? NECESITARIA EXPLICACION PARA PODERLO REALIZAR NOSOTROS MISMOS"** (§3) | ✅ | El cliente pide herramienta/guía para capturar coordenadas y radio — vive en `/proyectos` (el proyecto ES la obra; P15 elimina la tabla `obras`) |
| Pr4 | **El radio DEBE VARIAR según el tipo de proyecto** (§3, asistencia) | ✅ | Radio ya no es valor fijo global: campo por proyecto |
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
- **Coordenadas y radio de cada proyecto** (alimenta Pr3/Pr4).
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
      · el resto (6.2–6.6, P8, F1, F5, P13–P15) sin dependencia del hilo —
        según el orden interno de ese documento
```

**Regla del hilo:** terminar una fase de este plan libera el bloque
correspondiente de `IMPLEMENTACIONES-A-FUTURO.md` — no se arranca esa serie
antes de que su habilitador de este plan exista (ej.: no construir P2 sin la
plantilla de cotización que define QUÉ renglones lleva).
