# PLAN PRINCIPAL — Comercial y Operaciones: decisiones del SVR (11-11-2026) y correcciones

> **Fuente:** análisis a fondo de `docs_dudas/Dudas del SVR-11-11-2026.docx`
> (11 secciones con respuestas del cliente) + las **9 preguntas con respuesta del
> proveedor de GPS** (GPS Solutions, Meitrack T399L).
> **Este plan tiene prioridad sobre las series P/F de `IMPLEMENTACIONES-A-FUTURO.md`**
> (ver nota de vínculo al final de este documento): corrige errores confirmados,
> aplica decisiones ya dadas por el cliente y lista lo que queda bloqueado por
> preguntas sin respuesta.

---

## 1. Alcance y método

Barrido pregunta por pregunta de las dos fuentes, clasificando cada punto según la
vista donde vive. Vistas mapeadas:

- **Comercial:** `/clientes`, `/cotizaciones`, `/finanzas`, `/proveedores`, `/ventas`,
  `/cobranza`, `/ventas/corte`, `/facturas`
- **Operaciones:** `/reportes`, `/operaciones`, `/criba`, `/inventario`, `/proyectos`

Leyenda de estado: ✅ confirmado por el cliente · ⚠️ pregunta sin respuesta (bloquea
diseño) · ❌ sin impacto.

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
| P1 | ¿Cómo se concilia cada carga de diésel con la factura del proveedor? (§8) | ⚠️ Sin respuesta | Es la conciliación carga↔CxP/estados de cuenta — se diseña aquí |
| P2 | Refacciones de mantenimiento (§7) | ✅ | Compradas por **orden de compra** → OC + recepción + CxP |
| P3 | Talleres externos: interno/externo + proveedor + garantía (§7) | ✅ | Facturas de taller externo → CxP |

### 2.3 /facturas
| # | Punto | Estado | Implicación |
|---|---|---|---|
| Fa1 | ¿Para facturar, qué dato manda: proyecto, cliente u obra? (§5 Despachos) | ⚠️ Sin respuesta | Trazabilidad despacho→factura |
| Fa2 | **"SI CADA NOTA DEBE ESTAR FIRMADA PARA RESPALDO DEL CLIENTE"** (§6) | ✅ | Regla dura: no se factura una bitácora de renta sin firma del residente |
| Fa3 | **Traslados de máquinas de terceros = otro servicio que brindamos** (§4) | ✅ | Servicio facturable NUEVO (concepto en factura; cotización si aplica) |

### 2.4 /cobranza
| # | Punto | Estado | Implicación |
|---|---|---|---|
| C1 | **El horómetro del operador es SOLO información interna; el cobro EXCLUSIVAMENTE por bitácora de renta** (§6) | ✅ | Blindar anti-doble-cobro: horómetro jamás genera CxC |
| C2 | **Tarifa por TIPO DE MÁQUINA y CLIENTE**, distinta en nocturno/festivo/extra (§6) | ✅ | Cambia el monto de la CxC nacida de bitácora |
| C3 | **El tiempo detenido en obra SE COBRA; el traslado NO** (salvo grúa/oruga baja) (§6) | ✅ | Define conceptos cobrables de la bitácora |

*(la mecánica de abonos/cobro revertido de `/cobranza` no cambia)*

### 2.5 /clientes
| # | Punto | Estado | Implicación |
|---|---|---|---|
| Cl1 | **El cliente NO ve la ubicación de su máquina rentada** (§4) | ✅ | Decisión de alcance: la ubicación queda excluida de cualquier acceso cliente, para siempre |
| Cl2 | ¿Reporte del recorrido para el dueño? (§4) | ⚠️ Sin respuesta | Si algún día sí: entregable ligado a `/clientes` |

### 2.6 /cotizaciones, /ventas, /ventas/corte
**Barrido completo: las 11 secciones del doc + las 9 Q&A del proveedor no contienen
ninguna pregunta ni respuesta sobre cotizaciones, POS ni cortes de caja. Cero impacto.**

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
| O6 | **Operador seleccionado de lista obligatoria** (§5) | ✅ | Select sin texto libre en alta/edición |
| O7 | **Baja de máquina incorporando los documentos entregados con la baja** (§5) | ✅ | Baja con adjuntos |
| O8 | **Foto de cada máquina: SI** + placas, serie, año, modelo (§5) | ✅ foto / ⚠️ resto | Ficha de máquina |
| O9 | **Estado de la máquina lo actualiza el operador: "OPERADOR ES RESPONSABLE DE SU UNIDAD"** (§5) | ✅ | Reglas de permisos sobre el estado |
| O10 | **Hilda (administrativo) controla licencias y pólizas con el vencimiento** (§5) | ✅ | Recordatorios de vencimiento — funcionalidad NUEVA |
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
| Pr1 | Costo por obra (diésel + mantenimiento) — el modelo ya existe, falta F1 | ⚠️/✅ | `finanzas{ingresoCobrado, gastado}` |
| Pr2 | **Trabajador asignado a varias obras al mismo tiempo: SI es posible** (§1) | ✅ | `trabajadores_proyectos` multi-obra sin fricción (no tratarla como caso que bloquea) |
| Pr3 | **"¿Quién levantará las coordenadas y definirá el radio de cada obra? NECESITARIA EXPLICACION PARA PODERLO REALIZAR NOSOTROS MISMOS"** (§3) | ✅ | El cliente pide herramienta/guía para capturar coordenadas y radio por obra — vive donde se administran las obras (tras P15 = `/proyectos` o módulo GPS) |
| Pr4 | **El radio de obra DEBE VARIAR según el tipo de obra** (§3, asistencia) | ✅ | Radio ya no es valor fijo global: campo por obra/proyecto |

### 3.4 /reportes y /criba
**Barrido completo: el documento y las Q&A del proveedor no mencionan reportes de
campo ni criba. Cero impacto (por ahora).**

---

## 4. Correcciones confirmadas (§10 del doc) — lista de fixes

| # | Error detectado | Respuesta del cliente | Módulo/vista |
|---|---|---|---|
| 1 | **Horas extra rechazadas se pagan** | Solo se pagan las APROBADAS | RRHH — nómina/asistencia (fuera de las 15 vistas) |
| 2 | **Turnos que cruzan medianoche = 0 horas** | "SI HAY TURNOS NOCTURNOS" | RRHH — asistencia |
| 3 | Checklist guarda "luces y alarmas" sin preguntarlo | (implícito) | **`/operaciones`** — checklists |
| 4 | Alerta "posible ordeña +96%" es texto fijo | Debe calcularse con datos reales (y de la **varilla/GPS**) | Maquinaria — combustible |
| 5 | Archivo bancario con misma cuenta/CLABE inventada para todos | Dispersiones reales; hay **DOS bancos: BBVA y Banorte** (documento aparte con cuentas) | RRHH — nómina |
| 6 | Campos que se salen / pantallas mal en celular | (implícito) | Global — responsive, incluidas las 15 vistas |

---

## 5. Ficha del proveedor de GPS (GPS Solutions — Meitrack T399L)

| Respuesta del proveedor | Implicación técnica |
|---|---|
| Meitrack T399L, identificado por **IMEI** | Vinculación dispositivo↔máquina por IMEI; alta/baja = reasignar IMEI |
| **API disponible** + comparten usuario | ✅ Integración propia posible. **BLOQUEANTE: pedir documentación de la API** (auth, push vs pull, webhooks, límites) + usuario de prueba |
| **Encendido cada 30 s / Apagado cada 50 min** | ~2,880 posiciones/día/máquina encendida → ingesta con dedupe + decidir muestreo |
| **Todo menos temperatura de motor** | La "temperatura" demo del módulo GPS NO tiene fuente real → quitar o redefinir; encendido, horómetro, odómetro, velocidad y combustible sí llegan |
| **Historial 3 meses, Excel/PDF del portal** | Guardar desde el día 1 lo que llega en vivo; NO contar con la API para histórico viejo (confirmar en la doc) |
| **$350/mes por equipo, sin contrato** | Solo **camiones** con GPS hoy; maquinaria con horómetro manual; planean comprar más equipos |
| Alertas "si lo requiere el cliente" | Las alertas (velocidad/geocercas) las construimos NOSOTROS sobre la API |
| **Memoria interna + reenvío al recuperar señal** | El sistema debe aceptar posiciones atrasadas y fuera de orden (idempotencia por timestamp del dispositivo) |

**Del documento (§4) que complementa al proveedor:**
- Geocercas: **SOLO CON CÍRCULOS** → no se necesitan polígonos ni PostGIS (centro + radio + Haversine, el diseño actual es correcto).
- "Si una zona es pequeña y se cruza entre dos reportes, no pasa nada" → tolera el muestreo.
- El cliente **NO** ve la ubicación de su máquina rentada (Cl1).
- **Mapa real: el cliente pide PROPUESTAS con costo antes de decidir** (Google Maps vs alternativas con tiles, ej. MapLibre + MapTiler/OSM) — bloqueante del visual.
- Alertas de geocerca: aviso por **WhatsApp**; salida de obra fuera de horario: SI; gerencia crea/borra geocercas; zona pequeña entre reportes: no importa.

---

## 6. Decisiones del doc que viven FUERA de las 15 vistas (referencia)

- **RRHH** (`/trabajadores`, nómina, asistencia): sueldo diario = semanal/**7**; horario oficial **8:00–6 PM**; tolerancia 15 min; **3 retardos = falta**; retardo >15 min descuenta la hora; **horas extra por tabulador del trabajador ($100/$150) que viene en la nómina** (no la tarifa fija $80) y sin límite semanal; prorrateo a media semana; préstamos por abonos semanales; **dispersión en BBVA y Banorte**; **cierre de nómina obligatorio (bloquear re-sync/edición tras pagos)**; sin CFDI de nómina; finiquitos: formatos tipo Ley con cálculo automático + **3 escenarios de liquidación** para negociación; renuncia = solo proporcional; aguinaldo 15 días; fecha de ingreso obligatoria; sueldos precargados $2,500/$3,500 NO son reales (quitar precarga); RFC + CURP + NSS si tiene seguro; vacaciones con formato de firma de días tomados + recordatorio de renovación DC3; incapacidades según seguro; multi-obra permitida (rara); sueldo fiscal solo por transferencia; **HHE autoriza solo GERENCIA**; fuera de radio se rechaza en el momento y justifica RH+Dirección; salida no necesariamente en el mismo sitio; coordenadas manuales solo Dirección; festivo trabajado se paga por Ley, manual; sin señal → residente registra; cuadrilla del cabo vale para nómina; una asistencia por día.
- **Maquinaria**: apartado exclusivo de **LLANTAS** (vida útil, anti-robo) y **apartado por mecánico**; mantenimiento separado en refacciones/mano de obra/taller + interno/externo + garantía + días fuera de servicio; alerta a **50 h** y también programado por **calendario (meses)**; intervalos por marca/modelo (Hilda + mecánicos); diésel: % de alerta desde la **varilla/GPS** (no 35% fijo), **horas desde el GPS** para que nadie se auto-valide, alerta a gerencia como **notificación in-app**, consumo esperado = **historial** editable por gerencia+administración; si GPS vs manual, **prevalece el manual**.
- **Diseño**: azul y naranja + logo; gerencia aprueba pantallas.

---

## 7. Entregables que el cliente ya debe enviar (§11) + los nuestros

**Del cliente:** tabulador de horas extra por trabajador · formato exacto de dispersión BBVA **y Banorte** + cuenta de la empresa · cuentas/CLABE de trabajadores · RFC/razón social/domicilio y firmante de la carta de finiquito (+ ejemplo de carta) · coordenadas y radio de cada obra · lista de máquinas y operadores · lista de máquinas con/sin GPS · horarios oficiales por puesto · consumo esperado de diésel por máquina · intervalos de mantenimiento por marca/modelo · tarifas de renta por hora.

**Nuestros al proveedor (bloqueantes):**
1. Documentación de la **API** + usuario de prueba (mechanismo: push/polling/webhooks; límites).
2. ¿La API entrega **nivel de combustible** (la varilla) en %/litros y **horómetro** en cada reporte?
3. ¿Expone **histórico** o solo lo que llega en vivo?
4. ¿Cuántos **camiones** tienen GPS hoy (dimensionar ingesta)?

---

## 8. Orden de trabajo propuesto

| Fase | Qué | Dependencia |
|---|---|---|
| **F1 — Fixes confirmados** | Error 3 (checklist luces/alarmas en `/operaciones`), reglas ya dadas de las 15 vistas: horómetro interno (O12), operador de lista obligatoria (O6), patio (O5), foto de máquina (O8), firma residente obligatoria (Fa2), cobro solo por bitácora (C1), multi-obra sin fricción (Pr2) | Ninguna — arrancable ya |
| **F2 — Preguntas de seguimiento** | Redactar/enviar al cliente: F1, F2, Fa1, O1, O3, O11, I2, Cl2 + al proveedor: los 4 bloqueantes de §7 | Ninguna — puede ir en paralelo |
| **F3 — Ingesta GPS real** | Posiciones por IMEI, dedupe, tolerancia a atrasados, kill del modo demo | Respuestas del proveedor |
| **F4 — Mapa real** | Presentar 2-3 propuestas de costo y elegir | Decisión del cliente |
| **F5 — Geocercas y alertas** | Círculos, gerencia CRUD, alertas in-app + WhatsApp, fuera de horario | F3 + F4 |
| **F6 — Nómina/asistencia según respuestas** | Tabulador HHE, turnos nocturnos, festivo, cierre de nómina, doble banco | Tabulador + formato de dispersión del cliente |
| **F7 — Finiquitos** | Formatos Ley con cálculo automático + 3 escenarios + carta | Ejemplo de carta + datos fiscales |
| **F8 — Mantenimiento/llantas/diésel** | Apartado llantas, por mecánico, calendario, varilla/GPS | Respuestas pendientes parciales |

---

## 9. Vínculo con IMPLEMENTACIONES-A-FUTURO.md

> **NOTA de prioridad:** las series **P** (P2 partidas, P6 vendedor, P8 metas…) y **F**
> de `IMPLEMENTACIONES-A-FUTURO.md` siguen vigentes como hoja de ruta de flujos, pero
> **este plan las pospone**: primero se ejecutan las correcciones y decisiones del SVR
> (§2–§4 y §8 de este documento). `IMPLEMENTACIONES-A-FUTURO.md` ya apunta aquí.
