# RBAC — Role-Based Access Control

Sistema de control de acceso del SVR-ERP. Dos capas de seguridad que se complementan: **Vistas** (UI) y **Permisos** (API).

---

## 1. Arquitectura General

```
┌──────────┐    ┌──────────────┐    ┌────────┐
│  roles   │───▸│  role_vistas │◂───│ vistas │
└──────────┘    └──────────────┘    └────────┘
     │           puede_ver              │
     │           puede_crear            │ Definen las
     │           puede_editar           │ 24 rutas del
     │           puede_eliminar         │ sidebar
     │           puede_exportar         │
     │                                  │
     │    ┌──────────────────┐          │
     └───▸│ role_permissions │◂─────────┘
          └──────────────────┘
               vincula roles con
               permissions (API)
```

- **`role_vistas`** → controla qué **ve** el usuario y qué **botones** tiene en la UI.
- **`role_permissions`** → controla qué **acciones API** puede ejecutar (segunda capa de seguridad).

---

## 2. Tablas Principales

### 2.1 `roles`

Roles del sistema. Nombre único, nivel jerárquico, bandera `es_sistema` para proteger roles críticos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID (PK) | Identificador único |
| `nombre` | String (unique) | Nombre del rol |
| `descripcion` | String? | Descripción opcional |
| `nivel` | Int | Nivel jerárquico (mayor = más poder) |
| `es_sistema` | Boolean | Si `true`, no se puede eliminar |
| `activo` | Boolean | Soft delete lógico |
| `creado_en` / `actualizado_en` | DateTime | Auditoría |

### 2.2 `vistas`

Rutas del sidebar. Cada fila es una página navegable.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID (PK) | Identificador único |
| `nombre` | String | Nombre visible en el sidebar |
| `ruta` | String (unique) | Path de la ruta (ej. `/trabajadores`) |
| `icono` | String? | Nombre del icono Lucide |
| `orden` | Int | Posición en el sidebar |
| `es_menu` | Boolean | Si aparece como ítem de menú |
| `es_visible` | Boolean | Si es visible (oculto = ruta existe pero no se muestra) |
| `requiere_auth` | Boolean | Si necesita autenticación |
| `activo` | Boolean | Soft delete lógico |

### 2.3 `permissions`

Permisos granulares por módulo/recurso/acción. Cada fila es una acción específica que se puede ejecutar.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID (PK) | Identificador único |
| `modulo` | String | Módulo al que pertenece |
| `recurso` | String | Recurso dentro del módulo |
| `accion` | String | Acción permitida |
| `descripcion` | String? | Descripción legible |
| `activo` | Boolean | Soft delete lógico |
| `@@unique([modulo, recurso, accion])` | — | Combinación única |

### 2.4 `role_vistas`

Pivote entre `roles` y `vistas`. Define **qué puede hacer** un rol dentro de cada vista.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID (PK) | Identificador único |
| `rol_id` | UUID (FK) | → `roles.id` |
| `vista_id` | UUID (FK) | → `vistas.id` |
| `puede_ver` | Boolean | Aparece en el sidebar |
| `puede_crear` | Boolean | Botón "Nuevo" visible |
| `puede_editar` | Boolean | Botón "Editar" visible |
| `puede_eliminar` | Boolean | Botón "Eliminar" visible |
| `puede_exportar` | Boolean | Botón "Exportar" visible |
| `asignado_en` | DateTime | Cuándo se asignó |
| `asignado_por` | UUID? | Quién lo asignó |
| `activo` | Boolean | Soft delete lógico |
| `@@unique([rol_id, vista_id])` | — | Un rol solo puede tener 1 registro por vista |

### 2.5 `role_permissions`

Pivote entre `roles` y `permissions`. No tiene campos extras más que el vínculo.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `rol_id` | UUID | → `roles.id` (parte de PK compuesto) |
| `permiso_id` | UUID | → `permissions.id` (parte de PK compuesto) |
| `creado_en` | DateTime | Cuándo se creó |
| `@@id([rol_id, permiso_id])` | — | PK compuesto |

---

## 3. Las 2 Capas de Seguridad

### Capa 1: Vistas → "¿Qué ve el usuario en el sidebar?"

Controlado por `role_vistas`. Determina:
- Qué rutas aparecen en la navegación lateral
- Qué botones CRUD están habilitados dentro de cada página

**Frontend (Next.js):**

```tsx
// Sidebar: filtrar rutas visibles
const vistasPermitidas = user.role_vistas.filter(rv => rv.puede_ver);

// Dentro de la página:
{puede_crear && <Button>Nuevo Trabajador</Button>}
{puede_editar && <Button>Editar</Button>}
{puede_eliminar && <Button>Eliminar</Button>}
{puede_exportar && <Button>Exportar Excel</Button>}
```

Si `puede_ver = false`, la ruta **no aparece** en el sidebar.
Si `puede_crear = false`, el botón **no se renderiza** (no existe en el DOM).

### Capa 2: Permisos → "¿Puede el usuario ejecutar esta acción en la API?"

Controlado por `role_permissions` + `permissions`. Protege los endpoints REST.
Es la segunda línea de defensa: aunque alguien manipule la URL o llame la API directamente, el backend valida el permiso.

**Backend (NestJS):**

```ts
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('rrhh', 'trabajadores', 'crear')
@Post()
async create(@Body() dto: CreateTrabajadorDto) {
  return this.trabajadoresService.create(dto);
}
```

### Flujo completo de una acción

```
USUARIO HACE CLIC EN "Nuevo Trabajador"
            │
            ▼
┌─────────────────────────────────────────────┐
│  CAPA 1 — FRONTEND (role_vistas)            │
│                                             │
│  El botón solo EXISTE en el DOM si          │
│  puede_crear = true.                        │
│  Si el usuario manipula la URL directa,     │
│  el botón simplemente no aparece.           │
└──────────────────────┬──────────────────────┘
                       │
                       ▼  POST /api/rrhh/trabajadores
┌─────────────────────────────────────────────┐
│  CAPA 2 — BACKEND (permissions)             │
│                                             │
│  @RequirePermission('rrhh','trabajadores',  │
│                     'crear')                │
│                                             │
│  Guard verifica:                            │
│  1. ¿Tiene JWT válido?  → Si no → 401      │
│  2. ¿Tiene permiso?     → Si no → 403      │
│  3. ¿El permiso está    → Si no → 403      │
│     activo en permissions?                  │
│                                             │
│  Si todo OK → ejecuta el service           │
└─────────────────────────────────────────────┘
```

### ¿Por qué 2 capas?

| Escenario | Solo role_vistas | Solo permissions | Las 2 |
|---|---|---|---|
| Usuario ve el sidebar correcto | ✅ | ❌ | ✅ |
| Botón "Eliminar" aparece/oculta | ✅ | ❌ | ✅ |
| Atacante llama `DELETE /api/...` directo | ❌ | ✅ 403 | ✅ |
| API se consume desde móvil (Capacitor) | ❌ | ✅ | ✅ |
| Rol "Operador" no debería crear trabajadores | ✅ | ✅ | ✅ |

---

## 4. Seed Inicial (Datos por defecto)

### Roles

| ID | Nombre | Nivel | es_sistema |
|----|--------|-------|------------|
| `a0000000-0000-0000-0000-000000000001` | Administrador | 100 | true |

### Usuario admin

| Campo | Valor |
|-------|-------|
| persona | Carlos SVR (`admin@svr-constructora.com`) |
| rol | Administrador (principal) |
| password | Placeholder bcrypt (reemplazar en producción) |

### Permisos (96 total)

| Módulo | Recursos | Acciones por recurso |
|--------|----------|----------------------|
| `dashboard` | dashboard | ver |
| `rrhh` | trabajadores, asistencia, nomina | ver, crear, editar, eliminar, exportar, procesar |
| `maquinaria` | flota, horometro, mantenimiento, combustible, gps | ver, crear, editar, eliminar, exportar, aprobar |
| `operaciones` | operaciones, reportes_campo, criba, inventario, proyectos | ver, crear, editar, eliminar, exportar |
| `comercial` | clientes, cotizaciones, finanzas, proveedores, ventas, cobranza | ver, crear, editar, eliminar, exportar, cancelar |
| `sistema` | documentos, reportes, configuracion, usuarios, roles, permisos | ver, crear, editar, eliminar, asignar_rol, exportar |

### Vistas (24 rutas del sidebar)

| Nombre | Ruta | Icono | Orden |
|--------|------|-------|-------|
| Dashboard | `/dashboard` | LayoutDashboard | 1 |
| Trabajadores | `/trabajadores` | Users | 10 |
| Asistencia | `/asistencia` | Clock | 11 |
| Nomina | `/nomina` | Banknote | 12 |
| Flota | `/maquinaria` | Truck | 20 |
| Horometro | `/horometro` | Timer | 21 |
| Mantenimiento | `/mantenimiento` | Wrench | 22 |
| Combustible | `/combustible` | Fuel | 23 |
| GPS | `/gps` | MapPin | 24 |
| Operaciones | `/operaciones` | ClipboardList | 30 |
| Reportes de Campo | `/reportes-campo` | ShieldAlert | 31 |
| Criba | `/criba` | Layers | 32 |
| Inventario | `/inventario` | Package | 33 |
| Proyectos | `/proyectos` | HardHat | 34 |
| Clientes | `/clientes` | Building2 | 40 |
| Cotizaciones | `/cotizaciones` | FileText | 41 |
| Finanzas | `/finanzas` | Banknote | 42 |
| Proveedores | `/proveedores` | Truck | 43 |
| Punto de Venta | `/ventas` | ShoppingCart | 44 |
| Cobranza | `/cobranza` | CreditCard | 45 |
| Documentacion | `/documentos` | FileBadge | 50 |
| Reportes | `/reportes` | BarChart3 | 51 |
| Simulador App | `/simulador-movil` | LayoutDashboard | 52 |
| Configuracion | `/configuracion` | Settings | 53 |

---

## 5. Consumo en Código

### 5.1 Backend (NestJS)

#### Login — carga de datos RBAC

```ts
// auth.service.ts — después del login
const userWithRBAC = await prisma.users.findUnique({
  where: { id: userId },
  include: {
    users_roles: {
      where: { activo: true },
      include: {
        role: {
          include: {
            role_vistas: {
              where: { activo: true },
              include: { vista: true }
            },
            role_permissions: {
              where: {},
              include: { permissions: true }
            }
          }
        }
      }
    }
  }
});
```

#### PermissionsGuard

```ts
// guards/permissions.guard.ts
@Injectable()
export class PermissionsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.get<RequiredPermission>(
      'require_permission', context.getHandler()
    );
    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user; // del JwtAuthGuard

    return user.permisos.some(p =>
      p.modulo === requiredPermission.modulo &&
      p.recurso === requiredPermission.recurso &&
      p.accion === requiredPermission.accion
    );
  }
}
```

#### Decorador @RequirePermission

```ts
// decorators/require-permission.decorator.ts
export const RequirePermission = (modulo: string, recurso: string, accion: string) =>
  SetMetadata('require_permission', { modulo, recurso, accion });
```

### 5.2 Frontend (Next.js)

#### Tipos compartidos

```ts
// types/auth.ts
interface UserSession {
  id: string;
  email: string;
  persona: Persona;
  roles: {
    rol: Role;
    es_principal: boolean;
  }[];
  vistas: VistaPermiso[];
  permisos: PermisoAPI[];
}

interface VistaPermiso {
  vista: Vista;
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
  puede_exportar: boolean;
}

interface PermisoAPI {
  modulo: string;
  recurso: string;
  accion: string;
}
```

#### Hook useAuth

```ts
// hooks/useAuth.ts
function useAuth() {
  const { user } = useAuthContext();

  // Para el sidebar
  const vistasVisibles = user?.vistas
    .filter(v => v.puede_ver)
    .map(v => v.vista)
    .sort((a, b) => a.orden - b.orden) ?? [];

  // Para botones en cualquier página
  const can = (modulo: string, recurso: string, accion: string) =>
    user?.permisos.some(p =>
      p.modulo === modulo &&
      p.recurso === recurso &&
      p.accion === accion
    ) ?? false;

  // Para botones CRUD basados en role_vistas
  const canView = (ruta: string) =>
    user?.vistas.some(v => v.vista.ruta === ruta && v.puede_ver) ?? false;

  const canCreate = (ruta: string) =>
    user?.vistas.some(v => v.vista.ruta === ruta && v.puede_crear) ?? false;

  const canEdit = (ruta: string) =>
    user?.vistas.some(v => v.vista.ruta === ruta && v.puede_editar) ?? false;

  const canDelete = (ruta: string) =>
    user?.vistas.some(v => v.vista.ruta === ruta && v.puede_eliminar) ?? false;

  const canExport = (ruta: string) =>
    user?.vistas.some(v => v.vista.ruta === ruta && v.puede_exportar) ?? false;

  return { user, vistasVisibles, can, canView, canCreate, canEdit, canDelete, canExport };
}
```

#### Uso en páginas

```tsx
// /trabajadores/page.tsx
const { canCreate, canEdit, canDelete, canExport } = useAuth();

// Botones condicionales
{canCreate('/trabajadores') && (
  <Button onClick={openModal}>Nuevo Trabajador</Button>
)}

<TablaTrabajadores
  onEdit={canEdit('/trabajadores') ? handleEdit : undefined}
  onDelete={canDelete('/trabajadores') ? handleDelete : undefined}
/>

{canExport('/trabajadores') && (
  <Button onClick={handleExport}>Exportar Excel</Button>
)}
```

#### Sidebar filtrado

```tsx
// Sidebar.tsx
const { vistasVisibles } = useAuth();

return (
  <nav>
    {vistasVisibles.map(v => (
      <SidebarLink key={v.ruta} href={v.ruta} icon={v.icono}>
        {v.nombre}
      </SidebarLink>
    ))}
  </nav>
);
```

---

## 6. Gestión de roles personalizados

Cuando se crea un rol como "Supervisor de Maquinaria", se le asignan **solo las vistas y permisos que necesita**:

```sql
-- Crear el rol
INSERT INTO roles (id, nombre, descripcion, nivel, es_sistema, activo, creado_en, actualizado_en)
VALUES ('nuevo-uuid-...', 'Supervisor Maquinaria', 'Supervisor de flota y combustible', 50, false, true, NOW(), NOW());

-- Asignar solo las vistas que necesita
INSERT INTO role_vistas (rol_id, vista_id, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar)
VALUES
  ('nuevo-uuid-...', 'id-vista-flota',       true, false, true,  false, false),  -- Solo ve y edita
  ('nuevo-uuid-...', 'id-vista-horometro',    true, true,  true,  false, false),  -- Ve, crea y edita
  ('nuevo-uuid-...', 'id-vista-combustible',  true, false, false, false, true),   -- Solo ve y exporta
  ('nuevo-uuid-...', 'id-vista-reportes',     true, false, false, false, false);  -- Solo ve

-- Asignar solo los permisos de API que necesita
INSERT INTO role_permissions (rol_id, permiso_id)
SELECT 'nuevo-uuid-...', id FROM permissions
WHERE modulo = 'maquinaria'
  AND recurso IN ('flota', 'horometro', 'combustible')
  AND accion IN ('ver', 'editar', 'crear', 'exportar');
```

El sidebar de ese supervisor **solo mostrará esas 4 rutas**, con los botones que le corresponden.

---

## 7. Reglas de Negocio

1. **Un usuario puede tener múltiples roles** (tabla `users_roles` con `es_principal`).
2. **Los permisos se acumulan**: si un usuario tiene 2 roles, tiene la unión de ambos permisos.
3. **Los roles con `es_sistema = true`** no se pueden eliminar desde la UI.
4. **Soft delete en todo**: `activo = false` en vez de `DELETE`. Nunca se borran registros en un ERP.
5. **Auditoría**: cada inserción/actualización registra `creado_por`, `actualizado_por`, timestamps.
6. **Un rol solo puede tener 1 registro por vista** (`@@unique([rol_id, vista_id])`).
7. **`puede_ver = false`** implica que el usuario no ve la ruta en el sidebar ni puede navegar a ella.
8. **`puede_ver = true` con todos los CRUD en `false`** = solo lectura (modo "solo visualización").

---

## 8. Módulos y permisos disponibles

| Módulo | Recursos | Permisos |
|--------|----------|----------|
| `dashboard` | dashboard | ver |
| `rrhh` | trabajadores, asistencia, nomina | ver, crear, editar, eliminar, exportar, procesar |
| `maquinaria` | flota, horometro, mantenimiento, combustible, gps | ver, crear, editar, eliminar, exportar, aprobar |
| `operaciones` | operaciones, reportes_campo, criba, inventario, proyectos | ver, crear, editar, eliminar, exportar |
| `comercial` | clientes, cotizaciones, finanzas, proveedores, ventas, cobranza | ver, crear, editar, eliminar, exportar, cancelar |
| `sistema` | documentos, reportes, configuracion, usuarios, roles, permisos | ver, crear, editar, eliminar, asignar_rol, exportar |
