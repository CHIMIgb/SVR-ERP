# ANEXO A — Mapeo botón → permiso, 13 vistas de Comercial/Operaciones (fase F2)

Derivado de: controladores (`@RequirePermission`, verificado 2026-11-15) ↔ métodos
usados en cada `page.tsx` (barrido de `xxxApi.método()`). Cada fila es una acción
que se oculta si el rol no tiene la tupla.

Leyenda: ⛔ = acción (mutación) · 📊 = datos de carga (ver) · 📤 = exportar.

## 1. `/reportes` — `operaciones.reportes_campo.*`

| Acción | Método api | Endpoint | Tupla |
|---|---|---|---|
| 📊 Listado / stats / detalle / subcategorías / proyectos en proceso | listar, stats, subcategorias, proyectos, detalle | GET /reportes-campo* | `operaciones.reportes_campo.ver` |
| ⛔ Nuevo reporte | crear | POST /reportes-campo | `operaciones.reportes_campo.crear` |
| ⛔ Asignar responsable | asignar | PATCH :id/asignar | `operaciones.reportes_campo.editar` |
| ⛔ Cambiar estado / aceptar | cambiarEstado, aceptar | PATCH :id/estado, POST :id/aceptar | `operaciones.reportes_campo.editar` |
| ⛔ Comentar / adjuntar | comentar, adjuntar | POST :id/actividades, :id/adjuntos | `operaciones.reportes_campo.editar` |
| ⛔ Editar | actualizar | PATCH :id | `operaciones.reportes_campo.editar` |
| ⛔ Eliminar | eliminar | DELETE :id | `operaciones.reportes_campo.eliminar` |

**⚠️ Dependencia cross-módulo (hallazgo nuevo):** el modal de **Asignar** carga
candidatos con `trabajadoresApi.listar` → exige `rrhh.trabajadores.ver`. Un rol con
`reportes_campo.editar` pero sin `trabajadores.ver` no podría cargar candidatos.
Decisión por defecto: si no puede cargar candidatos, el botón Asignar se oculta
(regla de "sección que solo consume un permiso se oculta completa"). Alternativa de
producto: endpoint de catálogo de usuarios bajo `reportes_campo.editar`.

## 2. `/operaciones` (bitácora) — `operaciones.operaciones.*`

| Acción | Método api | Endpoint | Tupla |
|---|---|---|---|
| 📊 Listado / stats / catálogos | listar, stats, catalogos | GET /bitacoras* | `operaciones.operaciones.ver` |
| ⛔ Registrar operación | crear | POST /bitacoras | `operaciones.operaciones.crear` |
| ⛔ Editar | actualizar | PATCH :id | `operaciones.operaciones.editar` |
| ⛔ Eliminar | eliminar | DELETE :id | `operaciones.operaciones.eliminar` |

## 3. `/criba` — `operaciones.criba.*`

| Acción | Método api | Endpoint | Tupla |
|---|---|---|---|
| 📊 Listado / stats / catálogos | listar, stats, catalogos | GET /criba* | `operaciones.criba.ver` |
| ⛔ Abrir turno | crear | POST /criba | `operaciones.criba.crear` |
| ⛔ Editar registro / enviar a inventario | actualizar, enviarInventario | PATCH :id, POST :id/inventario | `operaciones.criba.editar` |
| ⛔ Eliminar | eliminar | DELETE :id | `operaciones.criba.eliminar` |

**⚠️ Cross-módulo:** los selects de **máquina** (`maquinasApi.listar` →
`maquinaria.flota.ver`) y **proyecto** (`reportesCampoApi.proyectos` →
`operaciones.proyectos.ver`) alimentan filtros y formularios. Por defecto: el
filtro/select se oculta si falta el permiso (el listado se ve sin esos filtros).
La acción principal (turno/registrar) NO depende de ellos.

## 4. `/inventario` — `operaciones.inventario.*`

| Acción | Método api | Endpoint | Tupla |
|---|---|---|---|
| 📊 Listado / stats / catálogos | listar, stats, catalogos | GET /inventario* | `operaciones.inventario.ver` |
| ⛔ Crear artículo | crear | POST /inventario | `operaciones.inventario.crear` |
| ⛔ Editar artículo | actualizar | PATCH :id | `operaciones.inventario.editar` |
| ⛔ Eliminar artículo | eliminar | DELETE :id | `operaciones.inventario.eliminar` |

Sin botón de exportar (el permiso `inventario.exportar` es huérfano, tipo A). ✓

## 5. `/proyectos` — `operaciones.proyectos.*`

| Acción | Método api | Endpoint | Tupla |
|---|---|---|---|
| 📊 Listado / stats / catálogos | listar, stats, catalogos | GET /proyectos* | `operaciones.proyectos.ver` |
| ⛔ Nuevo proyecto | crear | POST /proyectos | `operaciones.proyectos.crear` |
| ⛔ Editar proyecto | actualizar | PATCH :id | `operaciones.proyectos.editar` |
| ⛔ Actualizar finanzas (ingreso cobrado/gasto) | actualizarFinanzas | PATCH :id/finanzas | `operaciones.proyectos.editar` |
| ⛔ Cambiar estado | actualizar (estado) | PATCH :id | `operaciones.proyectos.editar` |
| ⛔ Eliminar (con guard de CxC abiertas) | eliminar | DELETE :id | `operaciones.proyectos.eliminar` |

## 6. `/clientes` — `comercial.clientes.*` (+ cross con cotizaciones)

| Acción | Método api | Endpoint | Tupla |
|---|---|---|---|
| 📊 Listado / stats / ficha 360 (consolidado) | listar, stats, consolidado | GET /clientes* | `comercial.clientes.ver` |
| ⛔ Nuevo cliente | crear | POST /clientes | `comercial.clientes.crear` |
| ⛔ Editar cliente | actualizar | PATCH :id | `comercial.clientes.editar` |
| ⛔ Eliminar cliente | eliminar | DELETE :id | `comercial.clientes.eliminar` |
| 📊 Cotizaciones del cliente (ficha) | cotizaciones | GET /cotizaciones | `comercial.cotizaciones.ver` ⚠️ |
| ⛔ Nueva cotización desde el cliente | crearCotizacion | POST /cotizaciones | `comercial.cotizaciones.crear` ⚠️ |

**⚠️ Cross-módulo:** la ficha del cliente consume `cotizaciones.ver` y su botón
"Nueva cotización" exige `cotizaciones.crear`. Por defecto: sección/botón ocultos si
falta el permiso (la ficha del cliente sigue funcionando sin esa sección).

## 7. `/cotizaciones` — `comercial.cotizaciones.*`

| Acción | Método api | Endpoint | Tupla |
|---|---|---|---|
| 📊 Listado / stats / catálogos (vendedores) | listar, stats, vendedores, obtener | GET /cotizaciones* | `comercial.cotizaciones.ver` |
| ⛔ Nueva cotización | crear, crearCotizacion | POST /cotizaciones | `comercial.cotizaciones.crear` |
| ⛔ Editar cotización | actualizar | PATCH :id | `comercial.cotizaciones.editar` |
| ⛔ Cambiar estado (aceptar/rechazar + motivo) | cambiarEstado | PATCH :id/estado | `comercial.cotizaciones.editar` |
| ⛔ Facturar (nace CxC) | facturar | POST :id/facturar | `comercial.cotizaciones.editar` |

Nota: **Facturar** hoy comparte `editar` con "editar cotización" (decisión de
producto separada si se quiere permiso propio `facturar` + seed — fuera de F2).

## 8. `/finanzas` — `comercial.finanzas.*`

| Acción | Método api | Endpoint | Tupla |
|---|---|---|---|
| 📊 Listado / stats / flujo neto | listar, stats, flujoNeto | GET /finanzas* | `comercial.finanzas.ver` |
| 📤 Exportar CSV (real) | exportar | GET /finanzas/exportar | `comercial.finanzas.exportar` |
| ⛔ Nueva transacción | crear | POST /finanzas | `comercial.finanzas.crear` |
| ⛔ Editar transacción | actualizar | PATCH :id | `comercial.finanzas.editar` |
| ⛔ Eliminar transacción | eliminar | DELETE :id | `comercial.finanzas.eliminar` |

## 9. `/proveedores` (+ órdenes de compra) — `comercial.proveedores.*`

| Acción | Método api | Endpoint | Tupla |
|---|---|---|---|
| 📊 Proveedores: listado / estados de cuenta / ledger | listar, estadosCuenta, ledger | GET /proveedores* | `comercial.proveedores.ver` |
| ⛔ Nuevo proveedor | crear | POST /proveedores | `comercial.proveedores.crear` |
| ⛔ Editar proveedor | actualizar | PATCH proveedores/:id | `comercial.proveedores.editar` |
| ⛔ Abonar (CxP) | abonar | POST proveedores/:id/abonos | `comercial.proveedores.editar` |
| ⛔ Eliminar proveedor | eliminar | DELETE proveedores/:id | `comercial.proveedores.eliminar` |
| 📊 OC: listado / detalle | listar (OC), obtener | GET /ordenes-compra* | `comercial.proveedores.ver` |
| ⛔ Nueva OC | crear (OC) | POST /ordenes-compra | `comercial.proveedores.crear` |
| ⛔ Editar OC | actualizar (OC) | PATCH ordenes-compra/:id | `comercial.proveedores.editar` |
| ⛔ Cambiar estado OC | cambiarEstado | POST :id/cambiar-estado | `comercial.proveedores.editar` |
| ⛔ Recibir OC (aplicar entrada) | recibir | POST :id/recibir | `comercial.proveedores.editar` |
| ⛔ Eliminar OC | eliminar (OC) | DELETE ordenes-compra/:id | `comercial.proveedores.eliminar` |

**⚠️ Cross-módulo REAL:** el formulario de OC usa `inventarioApi.listar` (picker de
artículos) → `operaciones.inventario.ver`. Un cobrador/contabilidad con solo
`proveedores.*` no cargaría el picker. Opciones: (a) exigir ambos (por defecto —
sin `inventario.ver`, el botón "Nueva OC" se oculta), (b) endpoint de catálogo de
artículos bajo `proveedores.ver` (producto). Decidir ANTES de F2 para no retrabajar.

## 10. `/ventas` (POS) — `comercial.ventas.*`

| Acción | Método api | Endpoint | Tupla |
|---|---|---|---|
| 📊 Config de turno / apertura de hoy / ventas de hoy / catálogo | config, aperturaHoy(?), hoy, catalogos | GET /ventas* | `comercial.ventas.ver` |
| ⛔ Vender | crear (venta) | POST /ventas | `comercial.ventas.crear` |
| ⛔ Apertura de caja | crear (apertura) | POST /ventas/apertura | `comercial.ventas.crear` |
| ⛔ Registrar retiro | crear (retiro) | POST /ventas/retiros | `comercial.ventas.crear` |
| ⛔ Ejecutar corte / cierre de caja | crear (cierre) | POST /ventas/cierres | `comercial.ventas.crear` |
| ⛔ Editar config de turno | actualizar (config) | PATCH /ventas/config | `comercial.ventas.editar` |

Hoy la vista gatea el área de cobro con el flag `puedeCrear` (correcto en espíritu);
F2 lo cambia al permiso y extiende el gate a apertura/retiros/corte, que hoy se
muestran sin gate de permiso.

## 11. `/ventas/corte` — `comercial.ventas.*`

| Acción | Método api | Endpoint | Tupla |
|---|---|---|---|
| 📊 Datos del corte (config + ventas del día) | config, hoy | GET /ventas/config, /ventas/hoy | `comercial.ventas.ver` |
| ⛔ Ejecutar cierre (si se dispara aquí) | (POST /ventas/cierres) | POST /ventas/cierres | `comercial.ventas.crear` |

Hoy la página solo gatea por flag `puedeVer` de la vista `/ventas/corte` — F2
extiende: datos con `ver`, ejecución con `crear`.

## 12. `/ventas/cierres` — `comercial.ventas.*`

| Acción | Método api | Endpoint | Tupla |
|---|---|---|---|
| 📊 Listado de cierres | listarCierres | GET /ventas/cierres | `comercial.ventas.ver` |
| ⛔ Aprobar cierre | aprobarCierre | PATCH :id/aprobar | `comercial.ventas.editar` |
| ⛔ Rechazar cierre | rechazarCierre | PATCH :id/rechazar | `comercial.ventas.editar` |

## 13. `/cobranza` — `comercial.cobranza.*`

| Acción | Método api | Endpoint | Tupla |
|---|---|---|---|
| 📊 Cuentas / stats / cobros / vencimientos / cartera por proyecto / estado de cuenta | listar, stats, cobros, vencimientos, porProyecto, cobrosDeCuenta | GET /cobranza* | `comercial.cobranza.ver` |
| 📤 Exportar CSV (real ×2) | exportar, exportarPorProyecto | GET cobranza/exportar, por-proyecto/exportar | `comercial.cobranza.exportar` |
| ⛔ Registrar cobro (abono) | registrarCobro | POST /cobranza, POST :id/cobros | `comercial.cobranza.crear` |
| ⛔ Revertir cobro | revertirCobro | POST :id/cobros/:cobroId/revertir | `comercial.cobranza.editar` |

## 14. `/facturas` — `comercial.facturas.*`

| Acción | Método api | Endpoint | Tupla |
|---|---|---|---|
| 📊 Listado / stats / detalle | listar, stats, (detalle) | GET /facturas* | `comercial.facturas.ver` |
| 📤 Exportar CSV (real) | exportar | GET /facturas/exportar | `comercial.facturas.exportar` |
| ⛔ Nueva factura | crear | POST /facturas | `comercial.facturas.crear` |
| ⛔ Editar factura | actualizar | PATCH :id | `comercial.facturas.editar` |
| ⛔ Cambiar estado (pagar/cancelar) | cambiarEstado | PATCH :id/estado | `comercial.facturas.editar` |
| ⛔ Conceptos: agregar/editar/eliminar | agregarConcepto, actualizarConcepto, eliminarConcepto | POST/PATCH/DELETE :id/conceptos* | `comercial.facturas.editar` |
| ⛔ Eliminar factura | eliminar | DELETE :id | `comercial.facturas.eliminar` |

## Resumen de decisiones que F2 necesita ANTES de implementar

| # | Decisión | Default propuesto |
|---|---|---|
| D1 | OC sin `inventario.ver` (picker de artículos) | Ocultar "Nueva OC"/"Editar OC" (exigir ambos) |
| D2 | Reportes sin `trabajadores.ver` (modal de asignar) | Ocultar "Asignar" |
| D3 | Criba sin `flota.ver`/`proyectos.ver` (filtros/selects) | Ocultar el filtro/select, no la vista |
| D4 | Clientes sin `cotizaciones.ver/crear` | Ocultar sección/botón de la ficha |
| D5 | Botones `export` client-side (sin endpoint) | Gate con el permiso del módulo (`X.exportar`); queda útil con F2 |
