# SVR-ERP — Dudas y decisiones por vista

*Documento de trabajo para el cliente. Recopila las dudas, confirmaciones y sugerencias para dejar bien asentado cómo debe comportarse el sistema.*

---

## 📘 Cómo usar este documento

- **Qué es:** una lista de preguntas sobre las pantallas de la aplicación, en palabras sencillas.
- **Para qué sirve:** cada respuesta ayuda a ajustar el sistema a la forma real de trabajar. **No hay respuestas incorrectas.**
- **Cómo se responde:** se recomienda una junta de **30 a 45 minutos**; pueden responderse todas o solo las prioritarias.
- **Formato de respuesta:** junto a cada pregunta anota: **SÍ / NO / se hace así:** (describe tu proceso).
- **Leyenda:**
  - 🟡 **Confirma cómo funciona** — validar si el comportamiento del sistema es el correcto.
  - 💡 **Sugerencia de mejora** — proponemos un cambio para evaluar.
  - 🆕 **Vista nueva** — pantallas que podrían agregarse.
- **Alcance:** solo los módulos **Operaciones** (trabajo en campo) y **Comercial** (clientes, ventas y dinero).

---

## ⭐ Decisiones prioritarias (las 12 más importantes)

*Ordenadas por nivel. **Nivel 1** destraba el resto y su implementación ya está lista; **Nivel 2** afecta datos y dinero y se responde en un minuto; **Nivel 3** son mejoras que no bloquean nada.*

### Nivel 1 — Decidir primero
1. 💡 **Reportes de campo:** ¿se agrega el campo **monto del servicio** para poder facturar desde el reporte? (hoy el sistema lo soporta pero la pantalla no lo muestra).
2. 💡 **Reportes de campo:** ¿la **factura debe generarse sola** cuando el reporte cumple las condiciones, o siempre con confirmación humana?
3. 🟡 **Roles:** ¿qué **roles** necesita la empresa y quién debe **aprobar** cada cosa (cierres, facturas, cancelaciones, reversiones)?

### Nivel 2 — Confirmar en la misma junta
4. 🟡 **Reportes de campo:** ¿la **obra** debe ser opcional? (hoy es obligatoria y hay reportes que no pasan en ninguna obra).
5. 🟡 **Ventas:** ¿se usan los **tres métodos de pago** (efectivo, tarjeta, transferencia) o solo efectivo?
6. 💡 **Inventario:** ¿las refacciones usadas en mantenimiento deben **descontar stock** automáticamente?
7. 💡 **Proveedores:** ¿al recibir una **orden de compra** debe **entrar al inventario** automáticamente?

### Nivel 3 — Segunda ronda (mejoras)
8. 💡 **Proyectos:** ¿el **% de avance** debe calcularse con metas/hitos o seguir capturándose a mano?
9. 💡 **Ventas:** ¿en la caja solo deben aparecer los materiales de una **categoría específica** (ej. "Construcción")?
10. 🟡 **Clientes:** ¿está bien que desde la ficha del cliente se pueda **crear una cotización rápida** sin entrar a Cotizaciones?
11. 💡 **Finanzas:** ¿se vincula cada tipo de gasto a una **cuenta bancaria** desde Configuración para facilitar la conciliación?
12. 💡 **Exportación:** ¿qué reportes se necesitan en **Excel** (para trabajar) y en **PDF** (para entregar/archivar) y quién puede exportar?

---

# Módulo: Operaciones

## Operaciones
*Bitácora diaria de qué máquina trabajó, en qué obra y cuántas horas.*

- 🟡 ¿Quién captura las horas: el operador o un supervisor? ¿Debe haber quien las valide?
- 🟡 Si una máquina trabaja en dos obras el mismo día, ¿se registra una entrada por obra o una sola con varias obras?
- 🟡 ¿Las horas sirven para **cobrar renta** al cliente o son solo control interno? Si se cobran, ¿de dónde sale la tarifa?
- 🟡 Cuando la máquina se detiene a mitad del turno, ¿se registran esas horas perdidas?
- 🟡 ¿Se necesita dejar nota de quién operó la máquina cada día?
- 💡 **Exportación:** bitácora de la semana/mes en **Excel** o reporte en **PDF** por obra o por máquina.

## Reportes de campo
*Pantalla para levantar reportes de campo por tipo (incidente, mecánico, operador, pipero, checador, ingeniero, trabajador) y prioridad (baja, media, alta, crítica). Al resuelto y facturable se le puede crear la cuenta por cobrar del cliente.*

- 🟡 ¿La **obra** debe ser **opcional**? (hoy es obligatoria, pero hay reportes de taller, en tránsito o en instalaciones que no pertenecen a una obra).
- 🟡 ¿Los **tipos actuales** son suficientes o falta alguno (material, seguridad, clima, caja)?
- 🟡 ¿Quién debe poder levantar cada tipo: cualquiera o solo el rol correspondiente?
- 💡 ¿La prioridad **crítica** debe escalarse automáticamente a gerencia/seguridad?
- 🟡 ¿Todo reporte resuelto se factura, o hay casos que **no se cobran** (garantías, cortesías)? ¿Qué tipos son facturables y cuáles solo informativos?
- 💡 **Monto:** hoy la pantalla no tiene campo de monto (el sistema sí lo soporta). ¿Se agrega al levantar el reporte o solo en los facturables?
- 💡 ¿La **factura debe generarse sola** cuando el reporte cumple las condiciones (resuelto + cliente + monto), o siempre con confirmación?
- 🟡 ¿Quién define el **monto** del servicio y con qué base (tarifario, cotización, criterio del ingeniero)?
- 🟡 Si el cliente no está de acuerdo con el monto, ¿se ajusta la cuenta sin perder el historial?
- 🟡 ¿El **vencimiento a 30 días** aplica a todos los clientes o hay acuerdos distintos (obra pública)?
- 💡 **Exportación:** **PDF** por reporte para entregar al cliente y **Excel** con los reportes del mes.

## Criba
*Producción diaria de la planta de cribado (material, metros cúbicos, operador, turno). Hoy es registro independiente: no alimenta existencias ni cobros.*

- 🟡 El material producido, ¿se **vende directamente** desde la planta? ¿Cómo se cobra hoy?
- 🟡 ¿El material se almacena para vender después o sale el mismo día?
- 🟡 ¿La **merma** calculada es aceptable? ¿En qué porcentaje empezaría a ser problema?
- 🟡 ¿Se necesita saber a qué **cliente u obra** se fue el material o es solo control de planta?
- 💡 ¿La producción debería **entrar al inventario** automáticamente para saber cuánto hay disponible para vender?
- 💡 **Exportación:** reporte de producción diaria/semanal en **PDF** o **Excel** para gerencia o el cliente comprador.

## Inventario
*Almacén de refacciones y materiales; el punto de venta descuenta stock al cobrar. El mantenimiento hoy NO descuenta existencias.*

- 🟡 ¿Quién autoriza la salida de material para una obra y queda registro de quién la retira?
- 💡 ¿Las refacciones usadas en mantenimiento deben **descontar existencias** automáticamente? (hoy no lo hacen).
- 🟡 ¿Se hace **inventario físico** periódico? ¿Cómo se corrige cuando el sistema no coincide con la bodega?
- 🟡 ¿El **stock mínimo** lo define la empresa? ¿Quién recibe la alerta?
- 🟡 Los materiales sobrantes que devuelve una obra, ¿regresan a inventario con registro?
- 🟡 ¿Se necesita **caducidad/lote** de algunos materiales o basta con la existencia total?
- 💡 **Exportación:** listado de existencias en **Excel** y **hoja física de conteo en PDF** (stock del sistema + espacio para anotar el conteo real).

## Proyectos
*Control de obras por cliente con presupuesto, avance y estado. El dato financiero se captura a mano; no se calcula solo de los gastos reales.*

- 💡 **% de avance:** hoy es un número capturado a mano. ¿Se prefiere un **plan de metas/hitos** (cimentación 20%, estructura 50%, acabados 80%, entrega 100%) que llene el % solo al marcarlos? ¿Cálculo automático con lo registrado en campo? ¿Quién lo actualiza y cada cuándo? ¿Debe quedar **historial** de avance (fecha + % + responsable)?
- 💡 ¿El **gasto del proyecto** debería sumarse solo de combustibles, refacciones, nómina y proveedores de esa obra?
- 🟡 Cuando una obra se pasa del presupuesto, ¿se congela o se autoriza un extra?
- 🟡 ¿Cómo se manejan los **trabajos extra** no contemplados?
- 🟡 ¿Quién da por finalizado un proyecto y qué se revisa antes (pagos pendientes, equipo regresado)?
- 💡 **Exportación:** reporte de avance y finanzas por obra en **PDF** y lista de proyectos activos en **Excel**.

## Incidentes
*Registro de fallas, accidentes y retrasos con prioridad y seguimiento. No genera cobros ni costos.*

- 💡 ¿Un incidente **crítico** debe escalarse automáticamente (gerencia, seguridad)? ¿A quién?
- 💡 ¿La **notificación** debe llegar automáticamente solo a los **roles con permiso** (no a todo el personal) y depender de la prioridad?
- 💡 ¿Los incidentes con costo (reparación, tiempo perdido) deberían quedar con **monto** y verse en finanzas?
- 🟡 ¿Qué diferencia hay entre **"resolver"** y **"reportar formalmente"**? ¿Cuándo se usa cada uno?
- 🟡 Los accidentes de personas, ¿requieren expediente especial (seguro, autoridad)?
- 💡 **Exportación:** reporte de incidentes en **PDF** para el expediente de seguridad y **Excel** del histórico.

---

# Módulo: Comercial

## Clientes
*Agenda comercial con estado de cuenta consolidado (cuentas por cobrar, facturas, cobros y cotizaciones).*

- 🟡 ¿Todos los clientes deben facturar (con RFC) o hay ventas a consumidor final?
- 💡 ¿Se necesita clasificar clientes (obra pública, privada, desarrollador, particular)?
- 💡 ¿Un cliente con **atraso grave** debe bloquearse para nuevas cotizaciones o ventas hasta regularizarse?
- 🟡 ¿Quién está autorizado a dar de alta un cliente?
- 🟡 **Cotización rápida:** hoy desde la ficha del cliente se puede crear una cotización corta (descripción, monto, fecha). ¿Está bien o debe crearse solo desde Cotizaciones?
- 🟡 **Acceso rápido:** el botón "Ver todas las cotizaciones" abre Cotizaciones filtrado por ese cliente. ¿Es útil o prefiere la lista general?
- 💡 ¿Se necesitan varios **contactos** por cliente (residencia, pago, operación) o basta uno?
- 💡 **Exportación:** directorio en **Excel** y **estado de cuenta del cliente en PDF**.

## Cotizaciones
*Presupuestos enviados a clientes. Al aceptar una y marcar "Generar factura", se crean la factura (con IVA) y la cuenta por cobrar a 30 días.*

- 🟡 ¿Los precios salen de una **lista oficial** o los decide el vendedor? ¿Quién autoriza descuentos y hasta cuánto?
- 💡 Hoy el monto se muestra **sin IVA**. ¿Se debe mostrar el total con impuestos?
- 💡 ¿Las cotizaciones tienen **vigencia**? ¿Qué pasa si aceptan una vencida o con precios viejos?
- 🟡 Una cotización rechazada, ¿se reofrece con cambios o se crea otra?
- 💡 ¿Se necesita saber qué **vendedor** hizo cada cotización y cuánto vendió cada uno?
- 💡 **Roles:** ¿un rol prepara (crear/editar/eliminar) y otro decide (aceptar/rechazar), o la misma persona hace ambas?
- 💡 **Exportación:** cotización en **PDF con membrete/logo** para el cliente y listado por vendedor o mes en **Excel**.

## Finanzas
*Registro central del dinero. Recibe solos los cobros de clientes (ingresos) y pagos a proveedores (egresos); el resto de gastos se captura a mano.*

- 🟡 ¿Quién captura los gastos manuales y quién los valida?
- 💡 ¿La **nómina** debería generar su egreso automáticamente al procesarse? (hoy no).
- 💡 ¿Las **ventas de mostrador** deberían llegar solas a Finanzas como ingreso del día? (hoy no).
- 🟡 ¿Con qué frecuencia se concilia el banco y quién la hace?
- 💡 ¿Se necesita una **alerta** cuando un pago esperado no llega?
- 💡 ¿Se necesita ver el balance **por banco** (cuánto hay en cada cuenta)?
- 💡 **Cuentas bancarias:** ¿se asigna en Configuración "de qué banco sale cada gasto" (proveedores → cuenta A, nómina → cuenta B, cobros → cuenta C) para que la conciliación sea más fácil?
- 💡 **Roles:** ¿un rol modifica esas asignaciones (Administrador) y otro distinto hace la conciliación (Contador)?
- 💡 **Exportación:** reporte financiero mensual en **PDF** (balance, ingresos, egresos, flujo) además del **Excel** que ya existe.

## Proveedores
*Compras del negocio: proveedores, órdenes de compra, cuentas por pagar y pagos (los abonos generan egresos en Finanzas).*

- 🟡 ¿Quién autoriza una **orden de compra**? ¿Hay requisición previa (uno pide, otro aprueba)?
- 🟡 Al recibir mercancía, ¿alguien verifica que coincida con lo pedido y con la factura del proveedor?
- 💡 ¿Se necesita **alerta de pagos por vencer** a proveedores?
- 💡 ¿Al **recibir la orden de compra** debe **entrar al inventario** automáticamente? ¿Con confirmación previa o directo?
- 🟡 ¿Un mismo material se compra a varios proveedores? ¿Se compara por precio?
- 💡 **Exportación:** estado de cuenta del proveedor en **PDF** y órdenes del mes en **Excel**.

## Ventas
*Caja registradora: vende materiales, cobra y descuenta stock automáticamente. No genera factura ni cuenta por cobrar.*

- 🟡 ¿Quiénes están autorizados a operar la caja?
- 🟡 ¿Cómo se maneja una **devolución** (reembolso + regreso de stock)? ¿Quién la autoriza?
- 🟡 ¿Se permite **descuento** en mostrador? ¿Hasta cuánto y quién lo autoriza?
- 💡 ¿Se necesita **facturar desde la venta** cuando el comprador lo pide? (hoy no es posible).
- 🟡 ¿Se puede vender sin existencias o debe bloquearse?
- 💡 ¿En la caja solo deben aparecer los materiales de una **categoría** específica (ej. "Construcción")? ¿Cómo distinguir un material vendible?
- 🟡 ¿Se usan los **tres métodos de pago** (efectivo, tarjeta, transferencia) o solo efectivo? ¿La transferencia requiere referencia/comprobante?
- 🟡 ¿Se debe **bloquear la caja fuera de su horario** (ej. ventas de 8 a 4)? ¿Con excepción autorizada?
- 💡 **Exportación:** reporte de ventas del día/mes en **PDF** y listado de tickets en **Excel**.

## Cobranza
*Cartera de crédito: cuánto nos deben, qué está vencido y cuánto se cobró. Cada cobro genera un ingreso en Finanzas.*

- 🟡 ¿Quién registra y **revierte** cobros? ¿La reversión requiere visto bueno?
- 🟡 Cuando un cliente se atrasa, ¿qué pasos sigue la empresa? ¿Debe el sistema recordarlos?
- 💡 ¿Se necesita registrar **promesas de pago** y darles seguimiento?
- 🟡 ¿Las cuentas **sin proyecto asignado** son normales o todas deben saber a qué obra pertenecen?
- 💡 **Exportación:** cartera y antigüedad de saldos en **PDF/Excel** y carta de cobro en **PDF** para enviar al cliente.

## Corte del día
*Cierre de caja del turno: compara lo vendido contra el efectivo contado y registra la diferencia.*

- 🟡 Cuando **sobra** efectivo, ¿se queda en caja para el siguiente turno o se retira?
- 🟡 ¿Basta un corte por turno o se necesita cortar a mitad del día (cambio de cajero)?
- 🟡 ¿Quién define y entrega el **fondo inicial** de caja?
- 🟡 Las diferencias en contra, ¿las absorbe el cajero, la empresa o se descuentan de nómina?
- 🟡 ¿Se debe **bloquear el corte fuera de su horario** (ej. de 5 a 7)? ¿Con excepción autorizada?
- 💡 **Exportación:** ticket/reporte del corte en **PDF** e historial del mes en **Excel**.

## Facturas
*Emite y administra facturas (pendiente, timbrada, pagada, cancelada).*

- 🟡 ¿Quién está autorizado a **cancelar** una factura? ¿Requiere segunda aprobación?
- 💡 ¿Se necesita **complemento de pago** cuando una factura se cobra en parcialidades? (hoy no se emite).
- 💡 ¿Las ventas de mostrador deberían poder **facturarse desde el punto de venta**?
- 💡 ¿Se limita cuánto tiempo una factura puede quedar "pendiente" antes de timbrarse?
- 💡 **Roles:** ¿un rol prepara (crear/editar/eliminar) y otro valida/timbra/cancela (contador o administrador)?
- 💡 **Exportación:** facturación por mes y por cliente en **PDF/Excel** para el contador.

## Cierres de caja
*Vista del administrador para aprobar o rechazar los cortes de caja.*

- 🟡 Cuando un cierre se **rechaza**, ¿se descuenta al cajero, se repone o solo se documenta?
- 💡 ¿Se necesita comparar el **desempeño de los cajeros** (diferencias de cada uno)?
- 🟡 ¿El administrador debe consultar cortes de varios días y entregarlos al contador?
- 💡 **Exportación:** reporte de cierres del período en **PDF/Excel** para el contador.

---

## 🆕 Vistas nuevas que podrían faltar (módulos Operaciones y Comercial)

- 🆕 **Utilidad por proyecto/obra:** pantalla de cuánto se gana o pierde por obra (contrato vs. gastos reales).
- 🆕 **Requisiciones de material:** el campo solicita material, un supervisor autoriza y bodega entrega.
- 🆕 **Devoluciones / notas de crédito:** proceso formal que regrese stock y genere nota de crédito.
- 🆕 **Costos por obra:** distribuir personal, combustible y refacciones a cada proyecto para el costo real.
- 🆕 **Combustible por máquina y por obra:** consulta del consumo y costo por equipo y por proyecto.
- 🆕 **Tablero de indicadores:** pantalla inicial con ventas del mes, cartera vencida, producción y proyectos en curso.
- 🆕 **Avisos automáticos:** el sistema avisa solo (vencimientos, pagos, stock bajo, proyectos por vencer).
- 🆕 **Registro de auditoría:** el sistema ya guarda todo lo que se hace (quién, qué, cuándo), pero no hay pantalla para consultarlo. ¿Se agrega? ¿Quién la ve (solo Administrador, o también Dirección/Contador)? ¿Se exporta?
- 🆕 **Unidades de venta y precios por material:** pantalla para administrar medidas y precios del punto de venta (m³ $350, tonelada $520, viaje $1,800); hoy el cajero lo usa pero no hay dónde editarlo.

---

## 💡 Exportación de datos en general

- ¿Para qué casos se necesita **Excel** (trabajar, filtrar, analizar) y para cuáles **PDF** (entregar, archivar, mostrar)?
- ¿La exportación incluye **siempre los datos filtrados** en pantalla o todo el período?
- ¿Quiénes pueden exportar: solo administradores o también supervisores/cajeros?
- ¿Los **PDF** deben llevar membrete, logo y datos fiscales para ser documentos oficiales?
- ¿Se necesitan exportaciones **automáticas** (ej. ventas del día cada noche a un correo) o basta pedirlas?

---

## 🟡 Roles que deben existir en la aplicación

*Hoy solo existe el rol Administrador. ¿Qué roles se necesitan en la operación real y qué puede hacer cada uno?*

> **Alcance:** el listado solo abarca los módulos **Operaciones y Comercial**. Los demás módulos (Recursos Humanos, Maquinaria, Sistema) tendrán sus propios roles cuando se definan.

- 🟡 ¿Qué roles se necesitan y con qué usuarios reales?
- 🟡 ¿Quién **aprueba**: cierres de caja, facturación de reportes, cancelaciones, reversiones de cobro, descuentos?
- 🟡 ¿Un usuario puede tener **varios roles** (ej. almacenista + compras) o uno solo?
- 🟡 ¿Quién ve la información de **dinero** (finanzas, cobranza, cierres)?
- 💡 ¿El personal de campo usa el sistema desde el **celular** con rol limitado (solo reportes)?
- 🟡 ¿Debe quedar registrado **quién hizo cada cosa**, como ya ocurre hoy?

### Roles propuestos (encajan con las pantallas existentes)

| Rol | Qué puede hacer | Pantallas que usa |
|---|---|---|
| **Administrador** *(ya existe)* | Acceso total: usuarios, permisos, configuración y todo el sistema | Todas |
| **Dirección / Gerencia** | Consultar indicadores, aprobar cierres y facturación, ver estados financieros y cartera | Finanzas (ver), Cierres de caja, Cobranza (ver), Reportes |
| **Supervisor de operaciones** | Registrar y validar operación, resolver y facturar reportes de campo, gestionar incidentes y proyectos | Operaciones, Reportes de campo, Incidentes, Proyectos, Criba |
| **Personal de campo** (operador, mecánico, pipero, checador, ingeniero, trabajador) | Levantar reportes de campo y ver los suyos | Reportes de campo |
| **Almacenista / Encargado de bodega** | Controlar existencias: entradas, salidas, ajustes, stock mínimo | Inventario |
| **Compras** | Crear y aprobar órdenes de compra, registrar pagos a proveedores | Proveedores |
| **Ejecutivo comercial / Vendedor** | Dar de alta clientes, crear y dar seguimiento a cotizaciones, ver cartera | Clientes, Cotizaciones, Cobranza (ver) |
| **Cajero** | Operar el punto de venta, registrar retiros y hacer el corte | Ventas, Corte del día |
| **Encargado de cobranza** | Registrar cobros, revisar vencimientos, revertir cobros autorizados, emitir facturas | Cobranza, Facturas, Clientes (estado de cuenta) |
| **Contador / Finanzas** | Registrar movimientos de dinero, conciliar el banco, exportar reportes | Finanzas, Facturas, Proveedores (ver) |

*Nota: RRHH y Maquinaria existen en el sistema; se agregarán roles equivalentes cuando se definan (ej. "Encargado de taller").*

---

## 💡 Interfaz y experiencia de uso (frontend — colores, diseño y facilidad)

*Hoy el sistema usa naranja como color principal, barra lateral oscura, fondo claro y tipografías modernas (Inter y Space Grotesk). Está pensado para computadora y se adapta a tabletas y celulares.*

### Colores e imagen
- 🟡 ¿La imagen actual (naranja + gris oscuro) representa a la empresa o se prefieren los **colores de la empresa**?
- 💡 ¿Se coloca el **logo** en inicio de sesión, barra lateral y PDFs (membrete)?
- 💡 ¿Se necesita **modo oscuro** o basta la pantalla clara?
- 🟡 ¿Los colores de estado (verde = bien, amarillo = pendiente, rojo = error/crítico) son claros? ¿Falta algún estado especial (vencido, cancelado)?

### Navegación y disposición
- 🟡 ¿La **barra lateral** por módulos es cómoda o se necesita búsqueda en el menú y accesos rápidos (ventas, inventario, cobranza)?
- 🟡 ¿El encabezado superior (área, notificaciones, usuario) es suficiente? ¿Falta información siempre visible (fecha, caja abierta, saldo del día)?
- 🟡 ¿La organización por **pestañas** dentro de una pantalla es clara (ej. Clientes)?

### Tablas y datos
- 💡 ¿Las tablas ya tienen buscador, filtros y paginación. ¿Falta **ordenar por columnas**, mostrar/ocultar columnas o fijar la primera?
- 🟡 ¿Se usará el sistema desde **celular en obra** o principalmente en oficina? ¿Las tablas se leen bien en pantallas chicas?

### Formularios y mensajes
- 🟡 ¿Los **formularios en ventana emergente** son cómodos o se prefieren vistas completas para capturas largas (orden de compra, factura)?
- 🟡 ¿Los mensajes de **error y éxito** se entienden? ¿Deben durar más visibles?
- 🟡 ¿Los **campos obligatorios** están claros (asterisco)? ¿Se necesita avisar antes de guardar qué falta?

### Iconos y letra
- 🟡 ¿Los **iconos** se entienden solos o algunos conviene acompañarlos siempre con texto?
- 🟡 ¿El **tamaño de letra** es adecuado para el personal en campo?

### Confirmaciones y mejoras
- 🟡 ¿Las **confirmaciones** de acciones fuertes (facturar, cancelar, revertir) son suficientes? ¿Alguna debe ser más estricta (motivo obligatorio, doble confirmación)?
- 💡 ¿Se necesita **guía/ayuda** dentro de cada pantalla?
- 🟡 ¿Las pantallas **cargan rápido** en el equipo donde las usarán?
- 💡 ¿Se agrega un botón de **"Sugerencia"** en cada pantalla para que los usuarios reporten mejoras?

---

## 📶 Conexión a internet y PWA (¿toda la aplicación necesita internet?)

*Contexto: el sistema se abre en el **navegador** de la computadora, tablet o celular. Una **PWA (Aplicación Web Progresiva)** es una página web que se puede **instalar desde el navegador** como una app normal: se agrega a la pantalla de inicio del celular/computadora, abre en su propia ventana, puede **funcionar sin conexión** (guardando los datos en el dispositivo) y se actualiza sola. **No se distribuye por Google Play ni App Store** — se instala entrando a la página.*

- 🟡 ¿El sistema se usará **solo en oficina con internet**, o el **personal de campo en obra** necesita registrar reportes, inventario o ventas **sin señal** y sincronizar cuando vuelva la conexión?
- 🟡 ¿Se quiere usar el sistema como **PWA completa** (instalable desde el navegador, en pantalla de inicio, sin tiendas de apps), como **PWA solo para el campo/obra**, o **siempre conectado** sin instalar nada?
- 🟡 En **obra o en el almacén**, ¿qué tan grave es quedarse unos minutos **sin servicio**? ¿El reporte/cobro se pierde, se anota en papel y después se captura, o no puede detenerse?
- 🟡 ¿Se usaría en el **navegador** del celular/tablet/computadora de la empresa (con la PWA instalada o sin instalar), o se espera una app que se descarga de una tienda?

**Riesgos si todo el sistema fuera una PWA (para decidir con información):**
- El **almacenamiento y la confiabilidad dependen del navegador**: el espacio es limitado y, si no se gestiona bien, el navegador puede llegar a borrar los datos guardados del dispositivo.
- No es "100% offline" automático: **requiere internet la primera vez** y en varios momentos. El funcionamiento sin señal hay que diseñarlo pantalla por pantalla.
- Las **capacidades del dispositivo** (cámara, notificaciones, impresión de tickets/facturas, lector de código de barras) dependen de lo que permita **cada navegador** y no siempre están disponibles ni igual en todos.
- La **impresión de tickets/facturas/reportes** y el uso de impresoras externas pueden requerir configuración especial por navegador, o no funcionar como en una app instalada.
- Las **actualizaciones y versiones** se distribuyen por el navegador (se pueden automatizar), pero **no hay un control central** como el de una tienda de apps.
- El **rendimiento general** suele ser menor que el de una app instalada, sobre todo con **tablas grandes y muchas imágenes** (reportes de campo, clientes, inventario).

- 💡 La decisión suele equilibrarse: **todo conectado en internet, con una PWA solo para los puntos críticos sin señal** (campo/obra, almacén), o la **PWA completa** si la operación tolera que la conexión falle unos minutos. ¿Cuál se apega más a cómo trabajan?

---

*Nota: ninguna pregunta modifica el sistema por sí sola; las respuestas definen los siguientes pasos.*