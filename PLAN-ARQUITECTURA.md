# PLAN DE IMPLEMENTACION: SVR-ERP Monorepo

## Vision General

Transformar el proyecto SVR-ERP de un monolito frontend en un **Monorepo industrial** con separacion clara de responsabilidades:

```
SVR-ERP/
├── apps/
│   ├── web/                    # Next.js 16 (Frontend)
│   └── api/                    # NestJS + Prisma (Backend)
├── packages/
│   └── shared/                 # Tipos, schemas, enums, constantes compartidas
├── AGENTS.md
├── PLAN-ARQUITECTURA.md
└── .opencode/
```

### Stack Tecnologico

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Frontend | Next.js (App Router, Turbopack) | 16.x |
| UI | Tailwind CSS v4 | 4.x |
| Backend | NestJS | 11.x |
| ORM | Prisma | 6.x |
| Base de datos | PostgreSQL | 16+ |
| Auth | JWT (access + refresh tokens) | - |
| Validacion (shared) | Zod | 3.x |
| Lenguaje | TypeScript (strict mode) | 5.x |

### Orden de Ejecucion

```
Fase 1  →  Fase 2  →  Fase 3  →  Fase 4  →  Fase 5  →  Fase 6
Limpieza   Data      Monorepo   Backend    Frontend   Integracion
10 min     1-2 hrs   2-3 hrs    1-2 sem    2-3 sem    continuo
```

---

## FASE 1: Limpieza de dependencias muertas y config obsoleta

> *Impacto: Inmediato. Sin riesgo. Desbloquea estabilidad de Turbopack.*

### Archivos Afectados

```
[ELIMINAR] tailwind.config.ts
  - Archivo obsoleto: Tailwind v4 ignora este archivo completamente
  - Los tokens ya estan definidos correctamente en globals.css via @theme {}

[MODIFICAR] package.json
  - Eliminar "framer-motion": "^12.38.0" de dependencies
  - Confirmado: 0 imports en todo el codigo fuente
```

### Orden de Ejecucion

1. Eliminar `tailwind.config.ts`
2. Eliminar `framer-motion` de `package.json`
3. Ejecutar `npm install` para actualizar lockfile
4. Verificar que `npm run dev` funciona

---

## FASE 2: Dividir el monolito `data.ts`

> *Impacto: Prepara los tipos y datos para el monorepo. Los tipos van a packages/shared.*

### Archivos a Crear

```
[CREAR] src/types/maquinaria.ts
  - Maquina, ChecklistPreoperacional, DespachoMaquina

[CREAR] src/types/trabajadores.ts
  - CategoriaPuesto, Permiso, Trabajador, BitacoraRentaDiaria,
    HorasExtraDetalle, RegistroAsistencia, DiaAsistenciaSemana,
    AsistenciaSemanalTrabajador

[CREAR] src/types/proyectos.ts
  - HitoProgreso, Proyecto, APUItem, APUTemplate

[CREAR] src/types/operaciones.ts
  - CargaCombustible, ArticuloInventario, RegistroMantenimiento,
    Cliente, Cotizacion, Transaccion, Documento, Incidente, Bitacora,
    LecturaHorometro, ReporteCampo, RegistroCriba

[CREAR] src/types/index.ts
  - Barrel re-export de todos los tipos

[CREAR] src/lib/mock-data/maquinaria.ts
  - arrays: maquinaria, checklistsPreoperacionales, despachosFlota

[CREAR] src/lib/mock-data/trabajadores.ts
  - arrays: trabajadores, bitacorasRentaData, registrosAsistencia,
    asistenciaSemanalData

[CREAR] src/lib/mock-data/proyectos.ts
  - arrays: proyectos, apuTemplates

[CREAR] src/lib/mock-data/operaciones.ts
  - arrays: cargasCombustible, inventario, mantenimiento, clientes,
    cotizaciones, finanzas, documentos, incidentes, operaciones,
    lecturasHorometro, reportesCampo, registrosCriba

[MODIFICAR] src/lib/data.ts
  - Reemplazar TODO el contenido por ~25 lineas de re-exports
```

### Orden de Ejecucion

1. Crear archivos de tipos (`src/types/*.ts`)
2. Crear archivos de mock data (`src/lib/mock-data/*.ts`)
3. Modificar `src/lib/data.ts` para re-exportar todo
4. Verificar `npm run dev` sin errores
5. Verificar que todas las vistas siguen renderizando

---

## FASE 3: Estructurar el Monorepo

> *Impacto: Reorganizar el proyecto para soportar frontend + backend + paquetes compartidos.*

### Estructura Objetivo

```
SVR-ERP/
├── apps/
│   ├── web/                        # Next.js 16 Frontend
│   │   ├── src/
│   │   │   ├── app/                # App Router (pages + layouts)
│   │   │   ├── components/         # Componentes UI
│   │   │   ├── lib/                # Utilidades, hooks, contexts
│   │   │   ├── styles/             # Estilos separados (*.styles.ts)
│   │   │   └── theme/              # Tokens de diseno
│   │   ├── public/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.ts
│   │   └── tailwind.config.ts      # (no, v4 usa globals.css)
│   │
│   └── api/                        # NestJS Backend
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── prisma/             # PrismaModule + PrismaService
│       │   ├── auth/               # AuthModule (login, register, refresh, logout)
│       │   ├── common/             # Guards, filters, decorators, constants
│       │   │   ├── guards/
│       │   │   ├── filters/
│       │   │   ├── decorators/
│       │   │   └── constants/
│       │   └── modules/            # Modulos de negocio
│       │       ├── users/
│       │       ├── workers/        # trabajadores
│       │       ├── machinery/      # maquinaria
│       │       ├── projects/       # proyectos
│       │       ├── attendance/     # asistencia
│       │       ├── payroll/        # nomina
│       │       ├── fuel/           # combustible
│       │       ├── maintenance/    # mantenimiento
│       │       ├── inventory/      # inventario
│       │       ├── clients/        # clientes
│       │       ├── quotes/         # cotizaciones
│       │       ├── finance/        # finanzas
│       │       ├── collections/    # cobranza
│       │       ├── operations/     # operaciones
│       │       ├── gps/            # GPS tracking
│       │       ├── documents/      # documentos
│       │       ├── incidents/      # incidentes
│       │       ├── reports/        # reportes
│       │       └── suppliers/      # proveedores
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── seed.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── nest-cli.json
│
├── packages/
│   └── shared/                     # Paquete compartido
│       ├── src/
│       │   ├── types/              # Interfaces TypeScript
│       │   │   ├── index.ts
│       │   │   ├── maquinaria.ts
│       │   │   ├── trabajadores.ts
│       │   │   ├── proyectos.ts
│       │   │   └── operaciones.ts
│       │   ├── schemas/            # Schemas Zod (validacion)
│       │   │   ├── index.ts
│       │   │   ├── maquinaria.schema.ts
│       │   │   ├── trabajadores.schema.ts
│       │   │   └── ...
│       │   ├── constants/          # Enums, constantes, labels
│       │   │   ├── index.ts
│       │   │   ├── roles.ts
│       │   │   ├── statuses.ts
│       │   │   └── ...
│       │   └── utils/              # Funciones puras compartidas
│       │       ├── currency.ts     # formatCurrency
│       │       ├── date.ts         # formatDate
│       │       └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── .env                            # Variables de entorno (gitignored)
├── .env.example                    # Template
├── .gitignore
├── package.json                    # Root workspace config
├── tsconfig.base.json              # Config TS compartida
├── turbo.json                      # Turborepo config (opcional)
├── AGENTS.md
└── PLAN-ARQUITECTURA.md
```

### Configuracion del Workspace

```json
// package.json raiz
{
  "name": "svr-erp",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "dev:web": "turbo dev --filter=web",
    "dev:api": "turbo dev --filter=api",
    "build": "turbo build",
    "lint": "turbo lint",
    "db:migrate": "turbo db:migrate --filter=api",
    "db:seed": "turbo db:seed --filter=api",
    "db:studio": "turbo db:studio --filter=api"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": { "cache": false, "persistent": true },
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] }
  }
}
```

### Pasos de Ejecucion

1. Crear estructura de directorios `apps/web/`, `apps/api/`, `packages/shared/`
2. Mover el codigo actual de Next.js a `apps/web/`
3. Crear `packages/shared/` con tipos, schemas y utilidades
4. Configurar workspaces en package.json raiz
5. Configurar Turborepo (turbo.json)
6. Configurar path aliases compartidos
7. Verificar que `turbo dev` levanta el frontend

### Migracion de Codigo

```
[MOVER] src/ → apps/web/src/
[MOVER] public/ → apps/web/public/
[MOVER] next.config.ts → apps/web/next.config.ts
[MOVER] tsconfig.json → apps/web/tsconfig.json
[MOVER] package.json → apps/web/package.json (solo deps del frontend)

[CREAR] packages/shared/src/types/*.ts
  - Mover de apps/web/src/types/ a packages/shared/src/types/

[CREAR] packages/shared/src/utils/currency.ts
  - Extraer formatCurrency de los archivos donde esta duplicado

[CREAR] packages/shared/src/utils/date.ts
  - Extraer formatDate de los archivos donde esta duplicado

[CREAR] packages/shared/src/constants/
  - Crear enums y constantes compartidas
```

---

## FASE 4: Backend - NestJS + Prisma

> *Impacto: Construir la capa de API REST con autenticacion JWT, RBAC, y modulos por dominio.*

### 4.1 Configuracion Inicial

```
[CREAR] apps/api/src/main.ts
  - Bootstrap con ValidationPipe global, CORS, AllExceptionsFilter

[CREAR] apps/api/src/app.module.ts
  - ConfigModule, PrismaModule, AuthModule

[CREAR] apps/api/src/prisma/prisma.module.ts
  - Modulo global con PrismaService

[CREAR] apps/api/src/prisma/prisma.service.ts
  - Extiende PrismaClient con enableShutdownHooks, cleanDatabase

[CREAR] apps/api/prisma/schema.prisma
  - Modelos base: User, Role, UserRole, RefreshToken, RevokedToken
  - UUIDs para PKs, snake_case en columnas, campos de auditoria
  - Soft deletes en entidades principales (deletedAt)
```

### 4.2 Modulo de Autenticacion

```
[CREAR] apps/api/src/auth/auth.module.ts
  - JwtModule (access + refresh), PassportModule, global JwtAuthGuard

[CREAR] apps/api/src/auth/auth.controller.ts
  - POST /auth/register   (Public)
  - POST /auth/login      (Public)
  - POST /auth/refresh    (Public)
  - POST /auth/logout     (Protected)
  - GET  /auth/me         (Protected)

[CREAR] apps/api/src/auth/auth.service.ts
  - register, login, refresh (rotation), logout (revoke + blacklist)

[CREAR] apps/api/src/auth/dto/
  - register.dto.ts, login.dto.ts, refresh.dto.ts
  - class-validator: @IsString, @IsEmail, @MinLength, @IsUUID

[CREAR] apps/api/src/auth/strategies/
  - jwt.strategy.ts (access token)
  - jwt-refresh.strategy.ts (refresh token)

[CREAR] apps/api/src/common/guards/
  - jwt-auth.guard.ts (global, con @Public() escape hatch)
  - roles.guard.ts (RBAC)

[CREAR] apps/api/src/common/decorators/
  - public.decorator.ts (@Public)
  - roles.decorator.ts (@Roles(...))

[CREAR] apps/api/src/common/filters/
  - all-exceptions.filter.ts
  - Formato: { success: boolean, data?: any, error?: { code, message, details } }

[CREAR] apps/api/src/common/constants/
  - roles.ts (enum de roles: ADMIN, GERENTE, OPERADOR, etc.)
```

### 4.3 Modulos de Negocio (patron repetido)

Cada modulo sigue esta estructura:

```
apps/api/src/modules/{domain}/
├── {domain}.module.ts          #@Module con controller + service
├── {domain}.controller.ts      #Endpoints REST
├── {domain}.service.ts         #Logica de negocio
├── dto/
│   ├── create-{domain}.dto.ts  #DTO de creacion (class-validator)
│   ├── update-{domain}.dto.ts  #DTO de actualizacion
│   └── query-{domain}.dto.ts   #DTO de filtros/paginacion
└── entities/
    └── {domain}.entity.ts      #Tipo de respuesta (opional, Prisma genera esto)
```

### Modulos a Crear

| Modulo | Modelo Prisma | Endpoints Principales |
|--------|---------------|----------------------|
| `workers` | Worker | CRUD, lista, busqueda |
| `machinery` | Machine | CRUD, estado, GPS |
| `projects` | Project | CRUD, progreso, APU |
| `attendance` | Attendance | registro, historial, resumen semanal |
| `payroll` | Payroll | periodos, pagos, recibos |
| `fuel` | FuelCharge | registro, historial por maquina |
| `maintenance` | Maintenance | registro, historial, alertas |
| `inventory` | InventoryItem | CRUD, stock, alertas |
| `clients` | Client | CRUD |
| `quotes` | Quote | CRUD, items, aprobar |
| `finance` | Transaction | ingresos, egresos, historial |
| `collections` | Collection | cuentas por cobrar, pagos |
| `operations` | Operation | asignaciones, historial |
| `gps` | GpsReading | ultima posicion, historial |
| `documents` | Document | upload, categorias |
| `incidents` | Incident | registro, prioridad |
| `reports` | Report | generacion, historial |
| `suppliers` | Supplier | CRUD |

### 4.4 Prisma Schema - Modelos de Negocio

```prisma
// Ejemplo: Workers
model Worker {
  id              String   @id @default(uuid()) @db.Uuid
  nombre          String
  apellidoPaterno String
  apellidoMaterno String?
  rfc             String?  @unique
  puesto          String
  categoria       String   // Operador, Oficinista, Chofer, etc.
  sueldoFiscal    Decimal  @db.Decimal(10, 2)
  sueldoEfectivo  Decimal  @db.Decimal(10, 2)
  metodoPago      String   // Banco, Efectivo
  status          String   @default("activo")
  telefono        String?
  email           String?
  fotoUrl         String?
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")

  // Relaciones
  attendances     Attendance[]
  payrolls        Payroll[]
  bitacoras       BitacoraRenta[]

  @@map("workers")
}
```

### Orden de Ejecucion

1. Configurar NestJS + Prisma + PostgreSQL
2. Crear schema.prisma con modelos base
3. Ejecutar `prisma migrate dev`
4. Crear modulo Auth con JWT
5. Crear guards y decorators (RBAC)
6. Crear AllExceptionsFilter
7. Crear modulos de negocio (uno por uno, empezando por workers)
8. Ejecutar `prisma db seed` con datos iniciales
9. Probar endpoints con curl o Postman

### Contracto de Respuesta Universal

```typescript
// Todas las respuestas del API usan este formato:
{
  success: true,
  data: { /* payload */ }
}

// Errores:
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "El campo nombre es requerido",
    details: [{ field: "nombre", message: "Required" }]
  }
}
```

---

## FASE 5: Frontend - Estandarizacion y Componentes Reutilizables

> *Impacto: Unificar estilos, crear sistema de componentes consistente, eliminar todo hardcodeado.*

### 5.1 Theme System - Tokens Globales

```
[CREAR] apps/web/src/app/globals.css
  - Definir todos los tokens en @theme {}
  - Colores: primary, secondary, success, warning, error, info, slate
  - Tipografia: font-sans (Inter), font-display (Space Grotesk)
  - Spacing: escala consistente
  - Border radius: sm, md, lg, xl, 2xl
  - Shadows: sm, md, lg
  - Componentes base: .btn-primary, .card, .input-base
  - Animaciones: slideInRight, fadeScaleIn

REGLAS ESTRICTAS:
  - NADA de colores hardcodeados en componentes
  - NADA de spacing hardcodeado
  - Todo usa los tokens del theme
  - clsx/merge para clases condicionales via cn()
```

### 5.2 Componentes UI Base

Cada componente tiene 2 archivos: `Component.tsx` + `Component.styles.ts`

```
[CREAR] apps/web/src/components/ui/
  ├── Button/
  │   ├── Button.tsx              # Variantes: primary, secondary, outline, ghost, danger
  │   ├── Button.styles.ts        # Estilos separados
  │   └── index.ts
  ├── Card/
  │   ├── Card.tsx                # Contenedor con sombra, padding, optional onPress
  │   ├── Card.styles.ts
  │   └── index.ts
  ├── Input/
  │   ├── Input.tsx               # Label, placeholder, error, disabled, icon
  │   ├── Input.styles.ts
  │   └── index.ts
  ├── Select/
  │   ├── Select.tsx              # Dropdown nativo con label
  │   ├── Select.styles.ts
  │   └── index.ts
  ├── Badge/
  │   ├── Badge.tsx               # Variantes: success, warning, error, info, neutral
  │   ├── Badge.styles.ts
  │   └── index.ts
  ├── Modal/
  │   ├── Modal.tsx               # Overlay + backdrop blur + animation
  │   ├── Modal.styles.ts
  │   └── index.ts
  ├── ModalField/
  │   ├── ModalField.tsx          # Label wrapper para campos en modales
  │   └── index.ts
  ├── PageHeader/
  │   ├── PageHeader.tsx          # Titulo + subtitulo + boton de accion
  │   ├── PageHeader.styles.ts
  │   └── index.ts
  ├── SearchInput/
  │   ├── SearchInput.tsx         # Input con icono de busqueda
  │   ├── SearchInput.styles.ts
  │   └── index.ts
  ├── StatsCard/
  │   ├── StatsCard.tsx           # KPI card con icono, valor, tendencia
  │   ├── StatsCard.styles.ts
  │   └── index.ts
  ├── EmptyState/
  │   ├── EmptyState.tsx          # Estado vacio con icono y CTA
  │   ├── EmptyState.styles.ts
  │   └── index.ts
  ├── Avatar/
  │   ├── Avatar.tsx              # Iniciales o imagen
  │   ├── Avatar.styles.ts
  │   └── index.ts
  └── Table/
      ├── Table.tsx               # Wrapper de tabla con header/body
      ├── Table.styles.ts
      └── index.ts
```

### 5.3 Componentes de Layout

```
[CREAR] apps/web/src/components/layout/
  ├── Sidebar/
  │   ├── Sidebar.tsx             # Navegacion colapsable con grupos
  │   ├── Sidebar.styles.ts
  │   └── index.ts
  ├── Topbar/
  │   ├── Topbar.tsx              # Barra superior con busqueda, notificaciones, user menu
  │   ├── Topbar.styles.ts
  │   └── index.ts
  ├── Toast/
  │   ├── Toast.tsx               # Sistema de notificaciones toast
  │   ├── Toast.styles.ts
  │   └── index.ts
  └── NotificationContext/
      ├── NotificationContext.tsx  # Context de notificaciones
      └── index.ts
```

### 5.4 Componentes de Dominio

```
[CREAR] apps/web/src/components/workers/
  ├── WorkerCard/
  │   ├── WorkerCard.tsx          # Tarjeta expandible del trabajador
  │   ├── WorkerCard.styles.ts
  │   └── index.ts
  ├── LiquidacionModal/
  │   ├── LiquidacionModal.tsx    # Modal de liquidacion/finalizacion
  │   ├── LiquidacionModal.styles.ts
  │   └── index.ts
  ├── BitacorasRentaModal/
  │   ├── BitacorasRentaModal.tsx # Modal de bitacoras de renta diaria
  │   ├── BitacorasRentaModal.styles.ts
  │   └── index.ts
  ├── AsistenciaGpsModal/
  │   ├── AsistenciaGpsModal.tsx  # Modal de detalle GPS asistencia
  │   ├── AsistenciaGpsModal.styles.ts
  │   └── index.ts
  ├── RecibosNominaModal/
  │   ├── RecibosNominaModal.tsx  # Modal de recibos de nomina
  │   ├── RecibosNominaModal.styles.ts
  │   └── index.ts
  └── EmailPreviewModal/
      ├── EmailPreviewModal.tsx   # Modal de preview/envio de email
      ├── EmailPreviewModal.styles.ts
      └── index.ts

[CREAR] apps/web/src/components/machinery/
  ├── MachineCard/
  │   ├── MachineCard.tsx         # Tarjeta de maquina con status, fuel, GPS
  │   ├── MachineCard.styles.ts
  │   └── index.ts

[CREAR] apps/web/src/components/projects/
  ├── ProjectCard/
  │   ├── ProjectCard.tsx         # Tarjeta de proyecto con progreso
  │   ├── ProjectCard.styles.ts
  │   └── index.ts
  └── ProjectDetailsModal/
      ├── ProjectDetailsModal.tsx # Modal de detalle del proyecto
      ├── ProjectDetailsModal.styles.ts
      └── index.ts
```

### 5.5 Patron de Estilos Separados

```typescript
// Component.styles.ts
import { css } from 'styled-components'; // O classes con cn()

// Cada archivo de estilos exporta clases nombradas
export const inputClasses = {
  wrapper: 'flex flex-col gap-1.5',
  label: 'text-xs font-semibold uppercase tracking-wider text-slate-500',
  input: cn(
    'w-full px-4 py-3 rounded-xl border border-slate-200',
    'text-sm font-medium text-slate-900 bg-slate-50',
    'focus:outline-none focus:border-primary/50 focus:bg-white',
    'transition-all duration-200'
  ),
  error: 'text-xs font-medium text-red-500',
  disabled: 'opacity-50 cursor-not-allowed',
};
```

### 5.6 Responsive Design

```css
/* Breakpoints definidos en globals.css @theme {} */
/* Tailwind v4 breakpoints por defecto:
   sm: 640px (movil landscape)
   md: 768px (tablet portrait)
   lg: 1024px (tablet landscape / desktop)
   xl: 1280px (desktop grande)
*/

/* Reglas responsive:
   1. Mobile-first: estilos base = movil, sm/md/lg = desktop
   2. Sidebar colapsable en lg, drawer en movil
   3. Tablas: scroll horizontal en movil, completas en desktop
   4. Grids: 1 col movil, 2 col tablet, 3-4 col desktop
   5. Cards: stack en movil, grid en desktop
   6. Modales: full-screen en movil, centered en desktop
   7. Touch targets: min 44x44px en movil
   8. Font sizes: base en movil, lg en desktop (via text-xs md:text-sm)
*/
```

### 5.7 Hooks Personalizados

```
[CREAR] apps/web/src/lib/hooks/
  ├── useDebounce.ts              # Debounce para busquedas
  ├── useMediaQuery.ts            # Deteccion de breakpoints
  ├── useClickOutside.ts          # Cerrar modales/dropdowns
  ├── useLocalStorage.ts          # Persistencia local
  └── useToast.ts                 # Hook para mostrar toasts

[CREAR] apps/web/src/lib/contexts/
  ├── ToastContext.tsx             # Provider global de toasts
  └── NotificationContext.tsx      # Provider global de notificaciones
```

### 5.8 Utilidades Compartidas

```typescript
// apps/web/src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Currency (DEBE usar Intl, NUNCA toFixed)
export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

// Date
export const formatDate = (date: Date | string): string =>
  new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));

export const formatDateTime = (date: Date | string): string =>
  new Intl.DateTimeFormat('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(date));
```

### Orden de Ejecucion

1. Definir tokens de theme en globals.css
2. Crear cn() utility
3. Crear componentes base (Button, Card, Input, Select)
4. Crear componentes de layout (Sidebar, Topbar, Toast)
5. Crear componentes de feedback (Modal, EmptyState, LoadingSpinner)
6. Crear componentes de dominio (WorkerCard, MachineCard, ProjectCard)
7. Crear hooks (useDebounce, useMediaQuery, useToast)
8. Crear contexts (ToastContext, NotificationContext)
9. Eliminar estilos inline hardcodeados en todas las paginas
10. Verificar responsive en 3 breakpoints

---

## FASE 6: Integracion Frontend-Backend

> *Impacto: Conectar el frontend con la API real, eliminar datos mock, implementar auth.*

### 6.1 API Client

```
[CREAR] apps/web/src/lib/api/client.ts
  - Base URL desde env variable
  - Auto-inyeccion de Authorization header (access token)
  - Interceptor 401 → intentar refresh → retry
  - Formato de error consistente (ApiError class)
  - Retry automatico en errores de red

[CREAR] apps/web/src/lib/api/auth.api.ts
  - login, register, refresh, logout, me

[CREAR] apps/web/src/lib/api/workers.api.ts
  - CRUD de trabajadores

[CREAR] apps/web/src/lib/api/machinery.api.ts
  - CRUD de maquinaria

// ... un archivo por dominio
```

### 6.2 Estado Global

```typescript
// Auth store con persistencia
[CREAR] apps/web/src/lib/stores/useAuthStore.ts
  - user, tokens (access + refresh), isAuthenticated
  - login(), logout(), refresh()
  - Persistencia en localStorage
  - Auto-refresh antes de expirar
```

### 6.3 Paginas con Datos Reales

Cada pagina del dashboard se migra de mock data a API calls:

```typescript
// Patron de carga en Server Components (cuando aplique)
async function WorkersPage() {
  const workers = await api.workers.list();
  return <WorkerList workers={workers} />;
}

// Patron con React Query (para Client Components)
function WorkersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['workers'],
    queryFn: api.workers.list,
  });
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState />;
  return <WorkerList workers={data} />;
}
```

### 6.4 Formularios con Validacion

```typescript
// Schemas Zod compartidos (packages/shared/src/schemas/)
import { z } from 'zod';

export const workerSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellidoPaterno: z.string().min(1, 'El apellido es requerido'),
  puesto: z.string().min(1, 'El puesto es requerido'),
  sueldoFiscal: z.number().positive('El sueldo debe ser positivo'),
  sueldoEfectivo: z.number().positive(),
});

// En el frontend:
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function WorkerForm() {
  const form = useForm({ resolver: zodResolver(workerSchema) });
  // ...
}
```

### Orden de Ejecucion

1. Crear API client con refresh token rotation
2. Crear auth store con persistencia
3. Crear hooks de API por dominio
4. Migrar paginas de mock data a API calls
5. Implementar formularios con Zod + react-hook-form
6. Eliminar src/lib/data.ts y src/lib/mock-data/ (ya no se necesitan)
7. Testing end-to-end

---

## Resumen de Impacto por Fase

| Fase | Que hace | Tiempo est. | Dependencias |
|------|----------|-------------|--------------|
| 1 | Limpiar deps muertas | 10 min | Ninguna |
| 2 | Dividir data.ts en modulos | 1-2 hrs | Fase 1 |
| 3 | Estructurar monorepo | 2-3 hrs | Fase 2 |
| 4 | Backend NestJS + Prisma | 1-2 sem | Fase 3 |
| 5 | Estandarizar frontend + UI components | 2-3 sem | Fase 3 |
| 6 | Integracion frontend-backend | continuo | Fases 4+5 |

### Lo que se mantiene del proyecto actual
- Todas las interfaces TypeScript (se mueven a packages/shared)
- Todos los datos mock (temporalmente, hasta que el backend este listo)
- Logica de negocio (formatCurrency, calculos de nomina)
- Estructura de navegacion (24 paginas del dashboard)

### Lo que se crea desde cero
- Backend completo (NestJS + Prisma + PostgreSQL)
- Paquete compartido (packages/shared)
- Sistema de autenticacion JWT
- Componentes UI estandarizados con estilos separados
- Theme system con tokens globales
- API client con refresh token rotation
- Responsive design para todos los breakpoints

---

## Verificacion Post-Implementacion

### Por Fase:
1. **Fase 1**: `npm run dev` sin errores, vistas renderizan
2. **Fase 2**: 0 errores de import, todos los tipos accesibles
3. **Fase 3**: `turbo dev` levanta frontend, estructura limpia
4. **Fase 4**: API responde en todos los endpoints, auth funciona
5. **Fase 5**: Componentes reutilizables, responsive en 3 breakpoints, 0 estilos inline
6. **Flujo completo**: Login → Dashboard → CRUD trabajadores → Verificar persistencia

### Checklist de Calidad:
- [ ] 0 errores TypeScript en todo el monorepo
- [ ] Todos los colores usan tokens del theme (0 hardcodeados)
- [ ] Todos los spacings usan tokens (0 valores mágicos)
- [ ] Responsive funciona en 3 breakpoints (movil, tablet, desktop)
- [ ] Modales abren/cierran correctamente
- [ ] Formularios validan con Zod
- [ ] Auth funciona (login, refresh, logout)
- [ ] API tiene RBAC (roles guard)
- [ ] Errores muestran feedback al usuario (toasts)
- [ ] Loading states en todas las operaciones async
- [ ] Empty states cuando no hay datos
