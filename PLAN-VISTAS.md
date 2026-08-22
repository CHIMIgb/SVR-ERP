# Plan de Refactorizacion de Vistas - Operaciones y Comercial

Orden recomendado para refactorizar cada vista aplicando componentes UI reutilizables, conectando datos mock y preparando la migracion al backend.

---

## Criterios de Priorizacion

1. **Impacto de negocio** - Que tan usado es el modulo en una constructora real
2. **Complejidad del codigo actual** - Vistas mas pequenas primero para ganar momentum
3. **Diversidad de patrones UI** - Priorizar vistas que usen muchos componentes diferentes
4. **Reutilizacion** - Vistas que sirvan de plantilla para otras similares
5. **Componentes UI cubiertos** - Cuantos de los 46 componentes reutilizables se pueden aplicar

---

## Modulo: Operaciones

| # | Vista | Lineas | Prioridad | Componentes UI a aplicar |
|---|-------|--------|-----------|--------------------------|
| 1 | `inventario/page.tsx` | 137 | **Primera** | PageHeader, StatsCard, DataTable, SearchBar, Badge |
| 2 | `operaciones/page.tsx` | 70 | Segunda | PageHeader, Card, Badge, EmptyState |
| 3 | `incidentes/page.tsx` | 78 | Tercera | PageHeader, Card, Badge, EmptyState |
| 4 | `proyectos/page.tsx` | 176 | Cuarta | PageHeader, Card, Badge, Pagination, SearchBar |
| 5 | `criba/page.tsx` | 271 | Quinta | PageHeader, StatsCard, DataTable, SearchBar, Select, Badge |
| 6 | `reportes-campo/page.tsx` | 243 | Sexta | PageHeader, Card, SearchBar, Select, DatePicker, Badge |

### Detalle por vista

#### 1. Inventario (137 lineas) - PRIORIDAD ALTA

**Por que empezar aca:**
- Tabla con columnas (nombre, stock, estado, precio, proveedor, acciones) -> plantilla para DataTable
- Stats cards manuales (Total Articulos, Stock Bajo, Valor Inventario) -> reemplazar por StatsCard
- Alerta de stock bajo -> Badge de estado
- Search inline -> SearchBar
- Intl.NumberFormat duplicado -> extraer formatCurrency()

**Estado actual:**
- Datos mock de inventario via @/lib/data
- Tabla HTML con estilos inline
- Busqueda visual (no funcional - sin useState)
- Stats cards hechas a mano

**Estado objetivo:**
- PageHeader con titulo + boton "Nuevo Articulo"
- StatsCard x3 para metricas
- DataTable con columnas definidas, sort y paginacion
- SearchBar funcional con useState
- Badge para estados (Stock Bajo / Ok)
- formatCurrency() importado de packages/shared

**Vista similar a crear:** combustible/page.tsx, mantenimiento/page.tsx

---

#### 2. Operaciones (70 lineas)

**Por que la segunda:**
- Timeline/lista de operaciones -> patron de Card apiladas
- Poca complejidad -> rapido de refactorizar
- Sirve de plantilla para vistas tipo "bitacora" (mantenimiento, horometro)

**Estado actual:**
- Lista de tarjetas con fecha, horas, actividad, maquina
- Badges manuales de estado
- Sin search ni filtros

**Estado objetivo:**
- PageHeader con titulo + boton "Nuevo Registro"
- Lista de Card con layout responsivo
- Badge para estados
- SearchBar + Select para filtrar por maquina/obra
- EmptyState cuando no hay registros

---

#### 3. Incidentes (78 lineas)

**Por que la tercera:**
- Grid de cards con prioridades coloridas -> patron de Card con Badge
- Baja complejidad
- Sirve de plantilla para vistas tipo "alertas/notificaciones"

**Estado actual:**
- Grid 2 columnas de cards
- Colores por prioridad (Critica, Alta, Media, Baja)
- Badges de estado manual

**Estado objetivo:**
- PageHeader con boton "Reportar Incidente"
- Badge con variantes de color para prioridad
- Card con layout consistente
- EmptyState para "No hay incidentes reportados"

---

#### 4. Proyectos (176 lineas)

**Por que la cuarta:**
- Grid de cards con progress bars -> patron de Card con Badge
- Mas datos que incidentes pero sin complejidad de forms

**Estado actual:**
- Grid de cards con nombre, cliente, progreso (%), fecha
- Progress bars hechas a mano
- Sin filtros ni search

**Estado objetivo:**
- PageHeader + SearchBar + Select (filtro por estado)
- Card con Badge de estado del proyecto
- Progress bar estilizada con cn()
- Pagination si hay muchos proyectos

---

#### 5. Criba (271 lineas)

**Por que la quinta:**
- Stats cards + tabla -> misma plantilla que Inventario
- Mas columnas y datos que inventario

**Estado actual:**
- Stats cards manuales
- Tabla con registros de criba
- Filtros manuales

**Estado objetivo:**
- StatsCard x3-4
- DataTable con columnas de criba
- SearchBar + Select (filtro por fecha/maquinaria)
- Badge para estados

---

#### 6. Reportes de Campo (243 lineas)

**Por que la ultima de Operaciones:**
- La mas compleja del modulo con formularios y filtros
- Requiere DatePicker y multiples Selects

**Estado actual:**
- Search + filtros
- Formularios de reporte
- Lista de reportes

**Estado objetivo:**
- PageHeader + SearchBar
- Select + DatePicker para filtros
- Card para cada reporte
- Badge de estado (Pendiente / En revision / Aprobado)
- FormModal para crear reporte

---

## Modulo: Comercial

| # | Vista | Lineas | Prioridad | Componentes UI a aplicar |
|---|-------|--------|-----------|--------------------------|
| 1 | `finanzas/page.tsx` | 129 | **Primera** | PageHeader, StatsCard, DataTable, SearchBar, Badge |
| 2 | `clientes/page.tsx` | 65 | Segunda | PageHeader, Card, Badge, EmptyState, FormModal |
| 3 | `ventas/page.tsx` | 468 | Tercera | PageHeader, StatsCard, DataTable, Modal, FormModal, Badge, SearchBar |
| 4 | `proveedores/page.tsx` | 495 | Cuarta | PageHeader, Card, Badge, SearchBar, Select, Tabs |
| 5 | `cobranza/page.tsx` | 439 | Quinta | PageHeader, StatsCard, DataTable, Badge, SearchBar, Select |
| 6 | `cotizaciones/page.tsx` | 660 | Sexta | PageHeader, Tabs, FormField, Select, DataTable, Badge, Modal |

### Detalle por vista

#### 1. Finanzas (129 lineas) - PRIORIDAD ALTA

**Por que empezar aca:**
- Stats cards + tabla de movimientos -> misma plantilla que Inventario
- Balance, ingresos, egresos -> 3 StatsCard con colores
- Ya calcula totales con reduce() -> logica de negocio real
- Intl.NumberFormat duplicado -> formatCurrency()

**Estado actual:**
- Stats cards manuales (Balance, Ingresos, Egresos)
- Tabla de movimientos con fecha, descripcion, tipo, monto
- Busqueda visual (no funcional)
- Boton "Exportar" (no funcional)

**Estado objetivo:**
- PageHeader + boton "Nueva Transaccion" + "Exportar"
- StatsCard x3 con iconos y colores (Balance dark, Ingresos green, Egresos red)
- DataTable con columnas de movimientos
- Badge de tipo (Ingreso / Egreso)
- SearchBar funcional
- formatCurrency() importado

**Vista similar a crear:** cobranza (parcialmente)

---

#### 2. Clientes (65 lineas)

**Por que la segunda:**
- Grid de cards simple -> rapido de refactorizar
- Poca complejidad -> buen candidato para FormModal
- Es el directorio base del modulo comercial (todo empieza con un cliente)

**Estado actual:**
- Grid 3 columnas de cards
- Cada card: iniciales de empresa, nombre, correo, telefono, obras activas
- Botones "Historial" y "Nueva Cotizacion"
- Sin CRUD, sin search, sin filtros

**Estado objetivo:**
- PageHeader + SearchBar + boton "Nuevo Cliente"
- Card con Avatar (iniciales), nombre, empresa, contacto
- Badge para obras activas
- FormModal para crear/editar cliente
- EmptyState para "No hay clientes registrados"

---

#### 3. Ventas (468 lineas)

**Por que la tercera:**
- Ya usa Modal, ModalField, useToast -> esta parcialmente refactorizada
- Tiene logica de negocio real (ventas de material, retiros de efectivo)
- Sirve de ejemplo de como deberian lucir las vistas completas

**Estado actual:**
- Ya importa Modal y useToast
- Datos mock locales (ventasIniciales, retirosIniciales)
- Estadisticas calculadas
- Registro de ventas con modal
- Registro de retiros con modal

**Estado objetivo:**
- PageHeader con stats resumidas
- StatsCard para metricas del dia
- DataTable para ventas con Badge de estado (Cobrada / Pendiente / Abonada)
- FormModal para nueva venta
- Separar en componentes: VentasTable, RetirosTable, VentaModal

---

#### 4. Proveedores (495 lineas)

**Por que la cuarta:**
- Cards + gestion de pedidos -> patron Card con Tabs
- Complejidad media-alta
- Vinculado con Inventario (proveedores de refacciones)

**Estado actual:**
- Grid de cards de proveedores
- Gestion de estado de pedidos
- Estadisticas de pedidos

**Estado objetivo:**
- PageHeader + SearchBar + Select (filtro por estado/ubicacion)
- Card con Avatar, nombre, especialidad, telefono
- Badge de estado (Activo / Inactivo)
- Tabs para vistas (Directorio / Pedidos / Historial)
- FormModal para nuevo proveedor

---

#### 5. Cobranza (439 lineas)

**Por que la quinta:**
- Sistema de seguimiento de pagos -> patron Tabla + Cards
- Vinculado con Ventas y Facturacion
- Complejidad media-alta

**Estado actual:**
- Seguimiento de pagos por cliente
- Estadisticas de cobranza
- Registro de abonos

**Estado objetivo:**
- PageHeader + StatsCard (Pendiente, Cobrado, Vencido)
- DataTable con deudores
- Badge de estado (Al dia / Vencido / Moroso)
- FormModal para registrar abono
- Select para filtro por cliente/estado

---

#### 6. Cotizaciones (660 lineas) - LA MAS COMPLEJA

**Por que la ultima:**
- Es la vista mas compleja del ERP entero (660 lineas)
- Sistema de APU (Analisis de Precios Unitarios) con tabs de materiales/mano de obra/maquinaria
- Calculos de indirectos, utilidad, financiamiento
- Ya usa useToast
- Requiere refactorizacion en partes (no de un jalón)

**Estado actual:**
- Sistema completo de cotizacion con APU templates
- Tabs: materiales, mano de obra, maquinaria
- Calculos de costos con porcentajes
- Lista de cotizaciones con estados
- Vista de detalle de cotizacion

**Estado objetivo (en fases):**
- **Fase 1:** Separar en componentes: CotizacionForm, CotizacionList, CotizacionDetail, APUEditor
- **Fase 2:** PageHeader + Tabs + SearchBar
- **Fase 3:** FormModal para nueva cotizacion con pasos
- **Fase 4:** DataTable para lista de cotizaciones
- **Fase 5:** Badge con variantes (Borrador / Enviada / Aprobada / Rechazada)

**IMPORTANTE:** Esta vista NO refactorizar completa. Dividirla en 4-5 componentes antes de tocar.

---

## Resumen: Orden de Trabajo

```
SEMANA 1:
  [Operaciones] Inventario (137 lineas) -> DataTable + StatsCard + SearchBar
  [Comercial]   Finanzas (129 lineas)   -> DataTable + StatsCard + SearchBar

SEMANA 2:
  [Operaciones] Operaciones (70 lineas) -> Card timeline + Badge + EmptyState
  [Comercial]   Clientes (65 lineas)    -> Card grid + FormModal + EmptyState

SEMANA 3:
  [Operaciones] Incidentes (78 lineas)  -> Card grid + Badge de prioridad
  [Comercial]   Ventas (468 lineas)     -> Refactorizar formularios existentes

SEMANA 4:
  [Operaciones] Proyectos (176 lineas)  -> Card + Progress + Pagination
  [Comercial]   Proveedores (495 lineas) -> Card + Tabs + FormModal

SEMANA 5:
  [Operaciones] Criba (271 lineas)     -> StatsCard + DataTable + SearchBar
  [Comercial]   Cobranza (439 lineas)  -> StatsCard + DataTable + FormModal

SEMANA 6:
  [Operaciones] Reportes Campo (243 lineas) -> Card + SearchBar + DatePicker
  [Comercial]   Cotizaciones (660 lineas)   -> Dividir en componentes
```

---

## Patron de Refactorizacion (Checklist)

Para cada vista refactorizada:

- [ ] Reemplazar `<h1>` manual por `<PageHeader title="..." />`
- [ ] Reemplazar stat cards manuales por `<StatsCard icon={} value={} label={} />`
- [ ] Reemplazar tablas HTML por `<DataTable columns={} data={} />`
- [ ] Reemplazar busqueda inline por `<SearchBar value={} onChange={} />`
- [ ] Reemplazar selects nativos por `<Select options={} value={} onChange={} />`
- [ ] Reemplazar badges `<span>` por `<Badge variant="success|warning|error">`
- [ ] Reemplazar modales manuales por `<Modal>` o `<FormModal>`
- [ ] Reemplazar empty states manuales por `<EmptyState icon={} title={} description={} />`
- [ ] Reemplazar `Intl.NumberFormat(...)` por `formatCurrency()` de packages/shared
- [ ] Agregar `useState` para busqueda y filtros (si no existen)
- [ ] Verificar responsividad (mobile: stacked, desktop: grid/table)
- [ ] Verificar que no hay duplicate keys en .map()
- [ ] Documentar componente si se creo alguno nuevo en COMPONENTS.md
