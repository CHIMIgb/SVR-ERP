# SVR-ERP — Cómo funciona el sistema y cómo se conectan las pantallas

*Guía para el cliente. Explica, en palabras sencillas, qué hace cada pantalla y cómo los datos viajan de una a otra.*

---

## 1. La idea en una frase

El sistema registra **lo que ocurre en el campo** (máquinas, obras, producción), **lo que se le vende y cobra al cliente** y **todo el dinero que entra y sale**; y cada pantalla es una ventana sobre una parte de esa historia. Al registrar algo en una pantalla, los datos **se mueven solos** hacia otras pantallas para que nadie tenga que capturar dos veces la misma información.

## 2. El mapa general

```
CAMPO (producción)                COMERCIAL (clientes y ventas)          DINERO (tesorería)

Operaciones ──────────────────┐
Reportes de campo ────────────┤  → Facturas ──→ Cobranza ──────────→ Finanzas (ingresos)
Incidentes ───────────────────┤        ↑             │                    ↑
Criba (producción) ───────────┘        │             └── cobros ─────────┘
                                     Cotizaciones
Proyectos ──→ (presupuesto y avance)        │
Inventario ──→ Ventas ──→ Corte del día ──→ Cierres de caja
                    ↓
              descuenta stock
Proveedores ──→ Órdenes de compra ──→ Abonos ──────────→ Finanzas (egresos)

Todas las pantallas se apoyan en catálogos compartidos:
Clientes · Proveedores · Maquinaria · Obras · Trabajadores · Artículos de inventario
```

## 3. Los tres círculos del sistema

| Círculo | Pantallas | Pregunta que responde |
|---|---|---|
| **Campo (producción)** | Operaciones, Reportes de campo, Criba, Proyectos, Incidentes | ¿Qué se hace en las obras y con las máquinas? |
| **Comercial** | Clientes, Cotizaciones, Ventas, Facturas, Cobranza | ¿Qué se vende, a quién, y cuánto nos deben? |
| **Dinero** | Finanzas, Proveedores, Corte, Cierres, Configuración | ¿Cuánto dinero hay, entra y sale? |

---

## 4. Pantalla por pantalla

### Operaciones
- **Qué hace:** Es la bitácora diaria de las máquinas en obra: qué máquina trabajó, en qué obra, qué día y cuántas horas.
- **De dónde saca sus datos:** De los catálogos de **maquinaria** y **obras** (nada se teclea a mano, se elige de la lista).
- **A dónde van sus datos:** Las horas registradas son la base para controlar el uso de la flota (horómetro, mantenimiento, combustible). La pantalla en sí no genera costos de dinero.

### Reportes de campo
- **Qué hace:** Es la pantalla para **levantar reportes de campo**: cualquier suceso de la operación del día, clasificado por tipo (incidente, mecánico, operador, pipero, checador, ingeniero, trabajador) y por prioridad (baja, media, alta, crítica), con seguimiento de estado hasta resolverlo. Hoy el reporte **pide una obra**, aunque no todos los sucesos pertenecen a una (servicios de taller, incidentes en tránsito, etc.).
- **De dónde saca sus datos:** De los catálogos de **máquinas**, **obras**, **clientes** y **proyectos** (cuando aplican) y de quien levanta el reporte.
- **A dónde van sus datos:** Es una de las puertas de entrada del dinero. Cuando un reporte corresponde a un servicio que se cobra y llega al estado **Resuelto**, el botón **Facturar** crea automáticamente una **cuenta por cobrar** (lo que el cliente deberá pagar). Esa cuenta aparece en **Cobranza** y en el estado de cuenta del **Cliente**, y alimenta el flujo de dinero proyectado de **Finanzas**. *Una sola operación conecta el campo con la tesorería.*

### Criba
- **Qué hace:** Registra la producción diaria de la planta de cribado por turno: qué material se produjo (criba fina, gruesa, arena), cuántos metros cúbicos, quién fue el operador y las horas trabajadas. Calcula la eficiencia del turno y la merma respecto al material "al banco".
- **De dónde saca sus datos:** Del catálogo de **trabajadores** (operador) y captura del turno.
- **A dónde van sus datos:** Hoy es un registro de producción independiente: lo que aquí se captura no se descuenta de existencias ni genera cobros. Sirve para medir cuánto produce la planta.

### Inventario
- **Qué hace:** Es el almacén central de refacciones y materiales: artículos, existencias, stock mínimo y valor del inventario. Advierte cuándo un artículo está por debajo del mínimo.
- **De dónde saca sus datos:** De los catálogos compartidos de **categorías**, **proveedores** y **unidades de medida**.
- **A dónde van sus datos:** Es el surtidor del punto de venta: cuando **Ventas** cobra un material, el stock se descuenta **automáticamente** aquí. *Sin inventario, la caja no puede vender.*

### Proyectos
- **Qué hace:** Administra las obras activas por cliente: presupuesto, avance porcentual, fechas y estado (en proceso, finalizado, pausado).
- **De dónde saca sus datos:** Del catálogo de **clientes** (todo proyecto pertenece a un cliente) y de los **despachos de maquinaria**.
- **A dónde van sus datos:** Los proyectos pueden tener **cuentas por cobrar** abiertas (que se cobran desde **Cobranza**); un proyecto con dinero pendiente no puede eliminarse. El avance financiero del proyecto (ingreso cobrado y gasto acumulado) se actualiza desde la propia pantalla.

### Incidentes
- **Qué hace:** Registro de seguridad: fallas, accidentes y retrasos en obra con prioridad (crítica, alta, media, baja) y seguimiento hasta resolverlos o reportarlos formalmente.
- **De dónde saca sus datos:** De los catálogos de **obras**, **máquinas** y **trabajadores** (quién reporta).
- **A dónde van sus datos:** Queda como registro y evidencia; no genera cobros ni costos automáticos. Es el expediente de seguridad de la operación.

### Clientes
- **Qué hace:** Es la agenda comercial: todas las empresas y personas que contratan los servicios, con sus datos de contacto y RFC. Es el punto de partida de todo el ciclo de venta.
- **De dónde saca sus datos:** Captura directa, más el **estado de cuenta** que se arma solo con datos de otras pantallas: cuentas por cobrar, facturas, cobros y cotizaciones del cliente.
- **A dónde van sus datos:** Todo lo que se ofrece, factura y cobra se amarra a un cliente. Desde aquí se crea la **cotización** y se consultan sus cobros y saldos: *es el "expediente" que junta todas las pantallas del círculo comercial.*

### Cotizaciones
- **Qué hace:** Registra los presupuestos enviados a los clientes y les da seguimiento: pendiente, aceptada o rechazada (con motivo obligatorio).
- **De dónde saca sus datos:** Del catálogo de **clientes** y captura del servicio y monto.
- **A dónde van sus datos:** Es la otra puerta de entrada del dinero. Al **aceptar una cotización y marcar "Generar factura"**, en una sola operación se crea la **factura** (con IVA) y la **cuenta por cobrar** a 30 días. De ahí nace el flujo: cotización → factura → cobranza → finanzas.

### Finanzas
- **Qué hace:** Es el **registro central del dinero** de la empresa: concentra todos los ingresos y egresos, muestra el balance, proyecta el flujo de caja futuro (cuánto falta por cobrar y por pagar, y cuándo vence) y permite la **conciliación bancaria** (comparar lo registrado contra el estado de cuenta real del banco).
- **De dónde saca sus datos:** De dos fuentes: captura manual (cualquier ingreso o egreso) y movimientos que **generan solas otras pantallas**:
  - **Cobranza** → cada cobro crea un ingreso; cada reversión de cobro crea un egreso.
  - **Proveedores** → cada abono a un proveedor crea un egreso.
  - El flujo proyectado se calcula solo de las **cuentas por cobrar** y **cuentas por pagar** que nacen en cotizaciones, facturas, reportes de campo, rentas de maquinaria y órdenes de compra.
- **A dónde van sus datos:** Es el concentrador final: casi todo lo que la empresa cobra o paga termina aquí y se exporta a Excel o se concilia contra el banco.

### Proveedores
- **Qué hace:** Es el lado de **compras** del negocio: quién le vende a la empresa, las **órdenes de compra**, los pagos y cuánto se les debe. Incluye un estado de cuenta por proveedor (estilo chequera).
- **De dónde saca sus datos:** Captura directa; al **crear una orden de compra** nace automáticamente el compromiso de pago (cuenta por pagar).
- **A dónde van sus datos:** Cada **abono** registrado aquí crea automáticamente un **egreso en Finanzas** (categoría Proveedores) y reduce la deuda. Las cuentas por pagar alimentan el flujo proyectado de Finanzas. *Es el espejo de Clientes, pero hacia los que nos cobran a nosotros.*

### Ventas
- **Qué hace:** Es la **caja registradora** (punto de venta): el cajero vende materiales, cobra en efectivo, tarjeta o transferencia e imprime el ticket. Incluye registro de retiros/gastos de la caja (gasolina, refacciones, caja chica) con autorización.
- **De dónde saca sus datos:** Del catálogo de **Inventario** (materiales, precios y existencias) y del horario definido en **Configuración**.
- **A dónde van sus datos:** Cada venta **descuenta el stock del inventario** y alimenta el **Corte del día** (suma de lo vendido). Es venta de mostrador: no genera factura ni cuenta por cobrar (ese es el camino de Cotizaciones, para ventas a crédito).

### Cobranza
- **Qué hace:** Administra la cartera de crédito: cuánto nos deben, qué está vencido y cuánto se cobró. Registra cobros parciales o totales contra una cuenta, y permite **revertir** un cobro con motivo.
- **De dónde saca sus datos:** Las **cuentas por cobrar** que nacen en cotizaciones facturadas, facturas, reportes de campo y rentas de maquinaria.
- **A dónde van sus datos:** Cada cobro genera un **ingreso en Finanzas** (y cada reversión un egreso), y si la cuenta salda una **factura**, ésta pasa automáticamente a **"Pagada"**. *Cobranza es el puente entre "nos deben" y "el dinero está en la caja".*

### Corte del día (dentro de Ventas)
- **Qué hace:** Es el cierre de caja del turno: suma lo vendido por método de pago, compara el efectivo esperado contra el efectivo físicamente contado y registra la diferencia (a favor o en contra) con su nota.
- **De dónde saca sus datos:** De las **Ventas** del día, los **retiros** registrados en el punto de venta, el fondo inicial del turno y el horario de **Configuración**.
- **A dónde van sus datos:** Al confirmar, el corte queda **pendiente de aprobación** y bloquea la caja. El administrador lo ve en **Cierres de caja**.

### Cierres de caja (dentro de Ventas)
- **Qué hace:** Es la vista del administrador para los cortes: lista todos los cierres con su cajero, total vendido, diferencia y estado; el administrador los **aprueba o rechaza** (el rechazo exige motivo).
- **De dónde saca sus datos:** Directamente de los **cortes del día** registrados por los cajeros. *Corte y cierre son la misma operación en dos momentos: el cajero hace el corte y el administrador aprueba el cierre.*
- **A dónde van sus datos:** El resultado queda en el historial y en la pista de auditoría, cerrando formalmente la caja del día.

### Facturas
- **Qué hace:** Emite y administra las facturas de clientes: conceptos, IVA, cálculo automático de subtotal y total, y sus estados (pendiente → timbrada → pagada, o cancelada con motivo).
- **De dónde saca sus datos:** Del catálogo de **Clientes** y, si nace de una cotización, de los montos y conceptos de la cotización.
- **A dónde van sus datos:** La factura se liga a una **cuenta por cobrar** que **Cobranza** convierte en pagos; al saldarse, la factura pasa a **"Pagada"**. Una factura con cuenta por cobrar no puede eliminarse (protege la contabilidad).

### Configuración
- **Qué hace:** Define el **horario del turno** de la caja: hora de apertura y hora de cierre.
- **De dónde saca sus datos:** Captura única del administrador.
- **A dónde van sus datos:** Afecta de inmediato a dos pantallas: **Ventas** (solo permite cobrar dentro del horario) y **Corte del día** (solo permite cerrar después de la hora de cierre y antes de la apertura del siguiente turno).

---

## 5. Tres recorridos completos (para ver el sistema "en movimiento")

**a) Un servicio de campo que se cobra**
1. En **Reportes de campo** se registra el servicio (con monto) hasta que queda **Resuelto**.
2. Se presiona **Facturar** → el sistema crea una **cuenta por cobrar**.
3. La cuenta aparece en **Cobranza** y en el estado de cuenta del **Cliente**.
4. Cuando el cliente paga, **Cobranza** registra el cobro → **Finanzas** muestra el ingreso y la factura ligada pasa a **Pagada**.
5. El flujo proyectado de **Finanzas** se actualiza solo en cada paso.

**b) Una venta de mostrador y el cierre de caja**
1. El cajero vende en **Ventas** → el **Inventario** descuenta el stock al momento.
2. Al terminar el turno, **Corte del día** suma lo vendido y compara contra el efectivo contado.
3. El corte queda pendiente; el administrador lo **aprueba en Cierres de caja**, cerrando el día.
4. **Configuración** define en qué horario puede ocurrir todo esto.

**c) Una compra a proveedor y su pago**
1. En **Proveedores** se crea la **orden de compra** → nace la cuenta por pagar.
2. Al **abonar** (pago parcial o total) → **Finanzas** registra el egreso automáticamente y la deuda baja.
3. El flujo proyectado de **Finanzas** muestra cuándo vence ese pago.

---

## 6. Resumen de conexiones entre pantallas

| Si ocurre esto... | Se refleja automáticamente aquí |
|---|---|
| Se factura un **reporte de campo** | Cobranza (nueva cuenta por cobrar) · Cliente (estado de cuenta) · Finanzas (flujo proyectado) |
| Se acepta una **cotización** con factura | Facturas (nueva factura) · Cobranza (cuenta a 30 días) · Finanzas (flujo proyectado) |
| Se cobra en **Cobranza** | Finanzas (ingreso) · Factura ligada pasa a "Pagada" · Cliente (estado de cuenta) |
| Se revierte un cobro en **Cobranza** | Finanzas (egreso) · Factura ligada regresa a "Timbrada" |
| Se **abona** a un proveedor | Finanzas (egreso) · Deuda del proveedor baja |
| Se vende en **Ventas** | Inventario (descuento de stock) · Corte del día (total vendido) |
| Se aprueba un **corte** | Cierres de caja (historial) · Auditoría |
| Se cambia el **horario** en Configuración | Ventas y Corte del día (permiten/bloquean operaciones) |

## 7. Puntos a tener en cuenta (comportamiento actual)

- El **punto de venta** y las **cotizaciones** son dos canales distintos: la caja de mostrador no genera facturas ni cuentas por cobrar; para ventas a crédito se usa el camino de cotizaciones → facturas → cobranza.
- Los **gastos de operación** (combustible, refacciones, nómina) no se registran solos en Finanzas: se capturan manualmente o mediante abonos a proveedores.
- La **producción de la criba** y las **horas de operación** se registran para control operativo; no generan costos ni movimientos de dinero automáticos.
- **Nada se borra de verdad**: los movimientos de dinero y las operaciones quedan en el historial (auditoría) aunque se corrijan o cancelen, para mantener la trazabilidad contable.