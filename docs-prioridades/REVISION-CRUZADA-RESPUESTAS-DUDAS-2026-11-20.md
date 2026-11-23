# Revisión cruzada — Respuestas del cliente vs dudas vs implementación

**Fecha:** 2026-11-20
**Fuentes:** `docs-svr/respuestas_dudas/` (6 archivos con respuestas del
cliente) ↔ `docs-svr/docs-svr-dudas/` (dudas originales + INDEX) ↔
`docs-prioridades/ANALISIS-DOCS-SVR-PROCESOS-EXCEL-2026-11-12.md` §10
(decisiones por defecto A1-A27) ↔ implementación actual (`schema.prisma` +
módulos del API).

---

## 1. Correspondencia respuesta ↔ documento de dudas ↔ vistas

| Respuesta (archivo) | Duda original que responde | Vistas que afecta | Dudas respondidas |
|---|---|---|---|
| PRODUCTIVIDAD.txt | PRODUCTIVIDAD.txt | /operaciones, /ventas, /cobranza, /facturas, /proyectos | P1-P4 de 6 (quedan P5/P6 parciales — sí respondió al final) |
| ESTADO DE CUENTA (CLIENTE).txt | ESTADO DE CUENTA (CLIENTE).txt | /cobranza, /clientes, /facturas | 3 de 3 — completa |
| LISTA DE PRECIOS.txt | LISTA DE PRECIOS.txt | /cotizaciones, /ventas | 2 de 2 — completa |
| COTIZACIONES (WORD).txt | COTIZACIONES (WORD).txt | /cotizaciones, /facturas | 2 de 2 — completa |
| CONTROL DE GASTOS.md | CONTROL DE GASTOS.txt | /finanzas (borde: /ventas/corte) | las 2 clave (las de caja chica quedan como A14-A16) |
| PROVEEDORES EXTERNOS 01.txt | PROVEEDORES EXTERNOS 01.txt | /proveedores, /finanzas | 3 de 3 — completa |

**Dudas aún SIN respuesta del cliente** (quedan en `docs-svr-dudas/`):
`PROVEEDORES.txt` (crédito de proveedores — 🔴 C7), `PROYECTO AILIN ...`
(plantilla del proyecto — ya con A22/A23 por defecto), `REGISTRO DE
VENTAS.txt` (crédito del cliente: asignación/rebase — 🔴 C6, la más
pesada de las pendientes).

## 2. Las 9 claves 🔴 del INDEX — estado tras las respuestas

| # | Clave | Respuesta del cliente | Efecto en la app |
|---|---|---|---|
| P1 | ¿Precio fijo o varía? | **VARÍA por cliente**; todos llevan precio público por lo general; lo cambian los **ENCARGADOS** al negociar | Confirma lista de precios pública + precio especial por cliente. Matiz: el permiso de cambio sería de ENCARGADOS (no solo administrativo) — ajusta A9 |
| P2 | ORIGINAL/COPIA y viajes $0 | Control de folios: el chofer lleva la nota a firma; **primero llegan las notas del encargado del banco, después las del chofer**; ORIGINAL = la que se procesa a pago | El doble registro es artefacto del PAPEL. La app simplifica: folio único capturado una vez + procesamiento de pago después. El dedupe de folios del diseño sigue válido |
| P3 | ¿Quién anota el viaje y cuándo? | Cuando las notas **llegan a la oficina** | La captura EN CAMPO de la PWA es una mejora (la confirma) — no contradice |
| P4 | ¿Un camión puede atender 2 obras el día? | «Depende de la coordinación para decidir a dónde los mandan» | **Ambigua** — interpretación: cada VIAJE va a una obra; el CAMIÓN hace múltiples viajes al día. El modelo actual (viaje → obra única) queda compatible; confirmar en la visita |
| P5 | Gasto semanal por camión | Diésel: lo da la **encargada del área** cada semana; insumos: **proveedores**; operativo: **sueldo** | Confirma las fuentes para el rendimiento por camión (combustible por máquina ya lo modela) |
| P6 | ¿El gasto se carga a la obra? | **NO — se carga a PARTE (por camión)** para los rendimientos internos | 🔴 Confirma: NO asignar gastos de flota a obras — el módulo combustible por máquina ya cumple; el «costo real por obra» NO debe repartir diésel |
| E1 | ¿Flete aparte o incluido? | **EL CLIENTE decide** si necesita solo material o material y flete; todo sale de las notas del banco, se clasifican al llegar | Bandera **por CLIENTE** (no por obra): `flete_incluido` en clientes o su configuración comercial |
| E3 | ¿Qué manda para facturar? | **El estado de cuenta del CLIENTE**; ellos envían la **razón social** a la que se factura | Facturas → cliente (ya ligamos factura→cliente_id). La razón social la provee el cliente por factura/periodo — hoy `clientes` tiene `rfc`+`direccion_fiscal` pero no un campo de razón social alternable |
| E2 | ¿Cobran junto o abonan? | Hay clientes con crédito que **van abonando** | Confirma el modelo POS-crédito + cobranza por abonos (ya implementado) |
| L1 | ¿Lista por obra? | Todos llevan **precio público**; especiales según **obras activas** | Lista pública + excepciones por cliente atadas a obras activas |
| L2 | ¿Clientes con precio especial? | **SÍ** | Confirma la excepción de precio por cliente |
| C1 | ¿Qué sigue tras aceptar la cotización? | **Se hace el trabajo**; hay clientes que facturan y otros no — pero igual **se relacionan en notas** | Facturación opcional por cliente; el flujo no muere sin factura — conecta con notas/estado de cuenta |
| C2 | ¿Materiales y servicios en la misma cotización? | **POR SEPARADO** (por el tipo de información de cada uno) | 🔴 Diseño: cotizaciones de **material** y de **servicio de equipo** son documentos distintos — no mezclar conceptos en una |
| EX1 | ¿Qué es una conciliación? | Cerrar saldos y **confirmar los VIAJES realizados**: el proveedor envía su conciliación, la persona confirma que estuvieron en esas obras; se abona o liquida cada semana | Conciliación = confirmación de viajes + saldo, no compras |
| EX2 | ¿Quién y cada cuándo? | El proveedor y la persona encargada; **cada semana o al cierre de obra** (según cliente) | Frecuencia configurable por cliente |
| EX3 | ¿Se corrige una cerrada? | Si hay error **se corrige al momento**; la cerrada queda como **estado de cuenta del proveedor** y sobre ella se hacen abonos y pagos | Conciliación cerrada = inmutable pero admite abonos/pagos posteriores |
| G1/G2 | ¿Gasto a obra? | **Gastos generales de la empresa, ligados a camiones y maquinaria — NO a obras** | Confirma P6: finanzas registra gasto de flota a nivel empresa/camión |

**Comentario del cliente al final de EXTERNOS:** «NECESITA VENIR PARA VER Y
ENTENDER EL PROCESO DE PROVEEDORES EXTERNOS» — piden una visita al proceso
de camiones contratados.

## 3. Cruce contra la implementación actual (qué cumple, qué falta, qué cambia)

| Conclusión del cliente | ¿La app ya la soporta? | Acción |
|---|---|---|
| Lista de precios pública + especial por cliente/obras activas | **NO — no existe modelo de lista de precios** (los precios se teclean en venta/cotización) | **GAP grande**: módulo lista de precios (público + especial por cliente/obra activa) del que cotizaciones y ventas toman precio; cambio solo por encargados (ajusta A9) |
| Gastos de flota NO se asignan a obra | ✓ `combustible` registra por máquina/camión; no hay reparto a obra | Cumple — NO construir el reparto (cuidado con el diseño de «costo real por obra») |
| Viaje → obra única; camión multi-viaje | ✓ modelo de despachos/viajes | Cumple |
| Captura cuando llega a oficina vs en campo | La PWA captura en campo — mejora confirmada | Cumple (mejora) |
| Flete aparte/incluido por CLIENTE | **NO** — sin bandera en clientes/cotizaciones/estado de cuenta | Gap: bandera comercial por cliente (afecta estado de cuenta y cotizaciones) |
| Facturar al cliente con razón social que ellos envían | Parcial: `facturas → cliente_id` ✓, `clientes.rfc` + `direccion_fiscal` ✓; la razón social es texto que hoy no existe como campo | Gap pequeño/medio: campo «razón social facturación» (en cliente o por factura) |
| Crédito con abonos | ✓ POS con crédito + cobranza por abonos | Cumple |
| Cotizaciones de material y de equipo SEPARADAS | Parcial: `cotizaciones` con `items` sin clasificación material/equipo | Decisión de diseño: tipo de cotización o agrupador por tipo (impacta plantilla y facturación) |
| Condiciones precargadas (sin IVA, vigencia 8 días, turno 8h, anticipar 1 semana) | Parcial: `condiciones String?` libre, sin plantilla precargada | Gap pequeño: default de condiciones al crear (A11/A12 ya las marcaban) |
| Conciliación de proveedores EXTERNOS de transporte (confirmar viajes, cerrar saldo, abonos sobre cerrada) | **NO** — `conciliacion-bancaria` es de BANCO; `proveedores` modela OCs y pagos, no conciliaciones de viajes | **GAP grande**: los proveedores externos de transporte no encajan en OC — requieren su propio flujo (conciliación de viajes + estado de cuenta del proveedor) |
| Fuentes del gasto semanal (diésel encargada, insumos proveedores, operativo sueldo) | ✓ combustible + finanzas/proveedores | Cumple |

## 4. Pendientes que las respuestas NO cubren

- `PROVEEDORES.txt` (¿proveedores con crédito? — 🔴 C7).
- `REGISTRO DE VENTAS.txt` (crédito del cliente: asignación y rebase — 🔴 C6).
- `PROYECTO AILIN` — cubierto por defecto (A22/A23), no requiere respuesta.
- **Petición del cliente:** visita para entender el proceso de proveedores
  externos (es literal en su respuesta) — recomendado antes de diseñar ese
  módulo.

## 5. Resumen de impactos ordenados

1. **GAP grande:** lista de precios (público + especial por cliente atado a
   obras activas, cambio por encargados) — toca cotizaciones, ventas, POS.
2. **GAP grande:** proveedores externos de transporte — conciliación de
   viajes + estado de cuenta del proveedor + abonos (visitar el proceso
   primero, lo pide el cliente).
3. **Gap medio:** flete aparte/incluido por cliente (bandera comercial).
4. **Gap medio:** cotizaciones separadas material/equipo (tipo o agrupador).
5. **Gap pequeño:** razón social de facturación (cliente la envía).
6. **Gap pequeño:** condiciones precargadas al crear cotización.
7. **Confirmaciones (no requieren cambio):** gasto de flota NO a obra,
   viaje→obra única, captura en campo como mejora, crédito con abonos.
8. **A9 se ajusta:** cambio de precio por ENCARGADOS (negociación), no solo
   administrativo.
