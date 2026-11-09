# Vistas móvil — módulos COMERCIAL y OPERACIONES (análisis previo al diseño de Figma)

**Fecha:** 2026-11-09
**Estado:** análisis previo — pendiente de las capturas de Figma (vistas por rol, móvil)
**Fuente de diseño:** Figma "SVR Asistencia — Vistas por rol (móvil)" — el enlace
requiere sesión y no puede leerse sin credenciales ni token: se necesitan
**capturas** de cada pantalla (o un embed público/token personal) para pasar del
análisis general al plan implementable vista por vista.

---

## Cómo están construidas las vistas hoy

Todas las vistas del dashboard (desktop) comparten el mismo esqueleto
(plantilla `/inventario`): **StatsCards responsivos + SearchBar/filtros +
`DataTable` (tabla horizontal con scroll en móvil) + `FormModal`**. El
responsable del patrón es el grupo UI del kit (`Table`, `Modal`, `Select`,
`Button`, chips de filtro…), así que cualquier mejora de móvil centralizada
alcanza a todas las vistas que lo usen.

---

## Complejidad por vista (COMERCIAL + OPERACIONES)

| Vista | Qué usa hoy | Complejidad móvil | Qué haría falta |
|---|---|---|---|
| `/reportes` | stats, modal de detalle ya apilado, tabla con truncado y columna Acciones | **Baja** | tabla → tarjetas en móvil (u ocultar columnas secundarias); el resto ya se adapta |
| `/operaciones` (bitácoras) | stats + DataTable full | Media | tabla → tarjetas o columnas podadas |
| `/criba` | stats + DataTable full | Media | mismo patrón |
| `/inventario` | CRUD completo: stats + tabla + modales | Media | mismo patrón |
| `/maquinaria` + `/horometro` + `/mantenimiento` + `/combustible` + `/gps` | 5 vistas de tabla con sus columnas propias | Media | el mismo patrón ×5; riesgo: cada una tiene columnas distintas que decidir podar |
| `/ventas` (POS) | grid táctil de productos + carrito + caja | **Baja** | el más cercano a móvil ya;Touches sueltas |
| `/ventas/corte` | cierre de caja (tablas + mini-modales) | Media | la misma adaptación |
| `/cotizaciones` | CRUD + formulario convert/facturar | Media | el alta es la parte más densa |
| `/facturas` | CRUD heavy + export CSV | Alto | mismo patrón de tabla→tarjetas + enlace a PDF si el diseño lo pide |
| `/finanzas` | flujo neto, transacciones, export CSV | Alto | hay sub-secciones por tab: analizar con captura |
| `/cobranza` | CRUD + mora/es de pago | Alto | ídem |
| `/proveedores` | CRUD + OC/recepción | Alto | ídem |
| `/clientes` | CRUD + tabs consolidados | Alto | ídem |

Paginación, filtros y toasts son componentes del kit (`Pagination`,
`ActiveFilters`/`FilterPanel`) y ya heredan el layout en cualquier reordenamiento.

---

## Dos caminos de implementación

### Opción A — Responsive del DataFrame (recomendado)
Ajustar **el kit `DataTable`** para que las columnas marcadases como
`mobileOrder`/`hidden` (o un modo tarjeta automático) rendericen apiladas en
móvil. Las vistas solo declaran qué columnas priorizar. Ventajas: un solo
componente, todas las ~12 vistas COM/OP se benefician a la ver, sin rutas
nuevas. Desventaja: las tarjetas resultantes tienen el mismo estilo para todo
(el diseño de Figma por pantalla tendría menos libertad).

### Opción B — Rutas móviles dedicadas `/m/*`
Vistas aparte diseñadas exactamente como Figma (por rol del usuario, como el
PWA). Ventajas: libertad total por pantalla. Desventajas: shell móvil nuevo
(menú, auth, navegación) y **doble mantenimiento** por vista.

**Recomendación:** empezar por Opción A en las vistas de menor complejidad
(`/reportes`, `/ventas`, `/criba`) y derivar a la Opción B solo si Figma exige
diseños muy distintos por rol.

---

## Relación con las vistas por rol (ya vivas en la DB)

La asignación de vistas por rol vive en **`role_vistas`** (puedeVer/Crear/
Editar/Eliminar por vista) y ya la consume tanto el menú como los botones.
Por tanto, el móvil de estas vistas heredará el recorte por rol sin trabajo
adicional: si un rol no tiene la vista, la ruta no aparece en el menú y el
API la bloquea igual (لو los permisos `operaciones.*`/`comercial.*`).

---

## Lo que se pide al cliente para avanzar

1. **Capturas de cada pantalla de Figma** (por rol/módulo) — con eso se arma el
   plan implementable por vista: columnas que sobreviven, orden, controles.
2. Confirmar el **camino** (A responsive del kit vs B rutas dedicadas).
3. Confirmar el **perfil objetivo por vista del móvil** (¿solo consulta, o
   alta/edición completa desde el teléfono?). Con esto se decide qué modals
   deben móviles-perfectos y cuáles quedan desktop-only al inicio.
