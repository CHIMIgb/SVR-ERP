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


---

## Requisitos de Seguridad y Auditoria

TODAS las vistas deben implementar estas 3 capas antes de considerarse completas:

### 1. Verificacion de Token (JWT)

Cada llamada a la API debe incluir el access token valido. El frontend ya maneja esto automaticamente via `src/lib/api.ts` (interceptor JWT), pero la vista debe:

- Usar `useAuth()` para obtener el usuario actual y el estado de sesion
- Si `isAuthenticated === false`, el `RouteGuard` redirige al login (no hacer nada en la vista)
- Si el token expira durante una operacion, el interceptor refresca automaticamente
- Si el refresh falla, el usuario se redirige al login

```tsx
// Patron correcto en cualquier vista:
const { user, isAuthenticated } = useAuth();

// RouteGuard ya maneja el redirect, pero como doble seguridad:
if (!isAuthenticated || !user) {
  return <LoadingState message="Verificando sesion..." />;
}
```

### 2. Verificacion de Permisos (RBAC)

Cada accion (ver, crear, editar, eliminar, exportar) debe verificarse antes de mostrar el boton/elemento de UI correspondiente. Los permisos vienen del `user.vistas` array que la API retorna en el login.

**Backend:** El `PermissionsGuard` protege los endpoints con `@RequirePermission('modulo.recurso.accion')`.

**Frontend:** La vista debe ocultar/deshabilitar botones y acciones segun los permisos del usuario:

```tsx
// Patron correcto para botones CRUD:
const puedeCrear = user?.vistas?.some(v =>
  v.ruta === '/inventario' && v.puedeCrear
);
const puedeEditar = user?.vistas?.some(v =>
  v.ruta === '/inventario' && v.puedeEditar
);
const puedeEliminar = user?.vistas?.some(v =>
  v.ruta === '/inventario' && v.puedeEliminar
);
const puedeExportar = user?.vistas?.some(v =>
  v.ruta === '/inventario' && v.puedeExportar
);

// En el JSX:
{puedeCrear && (
  <Button onClick={handleCreate}>
    <Plus /> Nuevo Articulo
  </Button>
)}

{puedeEditar && (
  <Button variant="ghost" onClick={() => handleEdit(item)}>
    <Edit2 /> Editar
  </Button>
)}
```

**Permisos disponibles por vista:**

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `puedeVer` | boolean | Puede ver la pagina |
| `puedeCrear` | boolean | Puede crear registros |
| `puedeEditar` | boolean | Puede editar registros existentes |
| `puedeEliminar` | boolean | Puede eliminar registros |
| `puedeExportar` | boolean | Puede exportar datos |

**IMPORTANTE:** Si un usuario no tiene `puedeVer` para una ruta, el `RouteGuard` ya lo redirige. Los botones de CRUD se verifican por separado en cada vista.

### 3. Servicio de Auditoria

Toda accion que modifique datos (crear, editar, eliminar, login, logout, etc.) debe registrarse en la tabla `bitacora_auditoria` via el modulo `audit/` del backend.

**El registro debe incluir:**
- **Que** se hizo (accion: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.)
- **Quien** lo hizo (user_id del token JWT)
- **Que recurso** fue afectado (tabla + registro ID)
- **Valores** antes y despues del cambio (para UPDATE)
- **Exito o fallo** (status: SUCCESS, FAILURE)
- **Direccion IP** del cliente
- **User-Agent** del navegador
- **Mensaje** descriptivo (exitoso o motivo de fallo)

**Tabla `bitacora_auditoria`:**

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | UUID | PK unica |
| `accion` | Enum | CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, etc. |
| `tabla` | String | Nombre de la tabla afectada |
| `registro_id` | UUID? | ID del registro afectado (nullable) |
| `user_id` | UUID | Quien ejecuto la accion |
| `valores_anteriores` | JSON? | Estado antes del cambio (para UPDATE/DELETE) |
| `valores_nuevos` | JSON? | Estado despues del cambio (para CREATE/UPDATE) |
| `status` | Enum | SUCCESS o FAILURE |
| `mensaje` | String? | Descripcion legible de la accion |
| `ip_address` | String? | IP del cliente |
| `user_agent` | String? | Navegador del cliente |
| `creado_en` | DateTime | Timestamp de la accion |

** Patron en el Backend (NestJS Service):**

```ts
// En cualquier Service que modifique datos:
async crearRegistro(dto: CreateRegistroDto, userId: string, ip: string) {
  try {
    const resultado = await this.prisma.registro.create({ data: dto });

    // Registrar auditoria EXITOSA
    await this.auditService.registrar({
      accion: 'CREATE',
      tabla: 'registros',
      registroId: resultado.id,
      userId,
      ip,
      valoresNuevos: resultado,
      status: 'SUCCESS',
      mensaje: `Registro creado exitosamente: ${resultado.nombre}`,
    });

    return resultado;
  } catch (error) {
    // Registrar auditoria FALLIDA
    await this.auditService.registrar({
      accion: 'CREATE',
      tabla: 'registros',
      userId,
      ip,
      status: 'FAILURE',
      mensaje: `Error al crear registro: ${error.message}`,
    });
    throw error;
  }
}
```

** Patron en el Frontend (llamada a la API):**

```tsx
// La vista no registra auditoria directamente - eso es responsabilidad del backend.
// Pero la vista SI debe:
// 1. Mostrar feedback al usuario (toast de exito/error)
// 2. Manejar errores de la API y mostrar mensaje claro
// 3. Refrescar datos despues de una operacion exitosa

const handleCreate = async (data: CreateForm) => {
  try {
    await api.post('/inventario', data);
    showToast('Articulo creado exitosamente', 'success');
    await refreshData(); // Re-cargar la lista
  } catch (error: any) {
    // El backend ya registro el fallo en auditoria
    showToast(error.message || 'Error al crear el articulo', 'error');
  }
};

const handleDelete = async (id: string) => {
  if (!confirm('Estas seguro de eliminar este registro?')) return;
  try {
    await api.delete(`/inventario/${id}`);
    showToast('Registro eliminado', 'success');
    await refreshData();
  } catch (error: any) {
    showToast(error.message || 'Error al eliminar', 'error');
  }
};
```

### Checklist de Seguridad por Vista

Para cada vista refactorizada, verificar:

- [ ] **Token:** `useAuth()` importado y usando para verificar sesion
- [ ] **Permisos de crear:** Boton "Nuevo" oculto si `!puedeCrear`
- [ ] **Permisos de editar:** Botones de edicion ocultos si `!puedeEditar`
- [ ] **Permisos de eliminar:** Botones de eliminacion ocultos si `!puedeEliminar`
- [ ] **Permisos de exportar:** Boton "Exportar" oculto si `!puedeExportar`
- [ ] **Auditoria backend:** Service con try/catch que llama `auditService.registrar()` en exito y fallo
- [ ] **Feedback frontend:** Toast de exito en operaciones exitosas, toast de error en fallos
- [ ] **Refresco de datos:** `refreshData()` despues de crear/editar/eliminar
- [ ] **Confirmacion de eliminacion:** `confirm()` o modal antes de eliminar


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

#### 1. Inventario (137 lineas) - PRIORIDAD ALTA - REALIZADA

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

#### 2. Operaciones (70 lineas) - REALIZADA

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

#### 3. Incidentes (78 lineas) - REALIZADA

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

**Cambios aplicados:**
- Reemplazado `<h1>` manual por `<PageHeader />`
- Cards envueltas en componente `<Card />`
- Badges de prioridad y estado usan `<Badge variant="..." />`
- Filtros por prioridad y estado con `<Select />`
- Búsqueda funcional con `<SearchBar />`
- EmptyState reutilizable cuando no hay resultados
- CRUD local con modales `<FormModal />` y confirmación de eliminación
- Permisos RBAC (`puedeCrear`, `puedeEditar`, `puedeEliminar`) ocultan botones según el usuario
- Fechas formateadas con `formatDate()` de `lib/formatters.ts`
- Layout responsive y zona segura (`p-6 bg-slate-50`)

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

### UI y Componentes
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

### Seguridad y Permisos
- [ ] Importar `useAuth()` y verificar `isAuthenticated` / `user`
- [ ] Verificar `puedeCrear` antes de mostrar boton "Nuevo"
- [ ] Verificar `puedeEditar` antes de mostrar botones de edicion
- [ ] Verificar `puedeEliminar` antes de mostrar botones de eliminacion
- [ ] Verificar `puedeExportar` antes de mostrar boton "Exportar"
- [ ] Deshabilitar/ocultar acciones que el usuario no puede realizar

### Auditoria
- [ ] Backend: Service con try/catch que llama `auditService.registrar()` en EXITO
- [ ] Backend: Service con try/catch que llama `auditService.registrar()` en FALLO
- [ ] Backend: Registrar valores anteriores en UPDATE/DELETE
- [ ] Backend: Registrar user_id e ip_address en cada operacion
- [ ] Frontend: Toast de exito en operaciones exitosas
- [ ] Frontend: Toast de error en fallos con mensaje descriptivo
- [ ] Frontend: Refrescar datos (`refreshData()`) despues de crear/editar/eliminar
- [ ] Frontend: `confirm()` o modal antes de eliminar registros

### Calidad
- [ ] Verificar responsividad (mobile: stacked, desktop: grid/table)
- [ ] Verificar que no hay duplicate keys en `.map()`
- [ ] Documentar componente si se creo alguno nuevo en COMPONENTS.md
- [ ] Run `npx tsc --noEmit` sin errores
- [ ] Run `npm run build` exitoso
