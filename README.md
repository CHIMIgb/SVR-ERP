# SVR-ERP

Sistema ERP de gestión para maquinaria, trabajadores, proyectos y operaciones.

## Stack

- **Frontend:** Next.js 16 (App Router, Turbopack) + React 19 + Tailwind CSS v4
- **Backend:** NestJS 11 + Prisma 7 + PostgreSQL 18 (AuthModule con JWT + RBAC)
- **Móvil:** Capacitor (compila el frontend web a APK nativo)
- **Lenguaje:** TypeScript 5 (strict mode)
- **Monorepo:** npm workspaces + Turborepo

## Comandos

### Desarrollo (Frontend)

```bash
cd apps/web
npm run dev              # Next.js dev server en http://localhost:3000
```

### Desarrollo (con Turborepo)

```bash
npm run dev              # Todos los workspaces
npm run dev:web          # Solo frontend
npm run dev:api          # Solo backend
```

### Build y Producción

```bash
npm run build            # Build de todos los workspaces
cd apps/web && npm run start  # Servir frontend en producción
```

### Backend

```bash
cd apps/api
npm run dev              # NestJS en http://localhost:3001/api
npm run test             # Tests unitarios (sin DB)
npm run test:integration # Tests de integración (requiere DB)
npm run test:cov         # Tests con reporte de cobertura
```

### Configuración de Puertos (desarrollo)

La API usa el puerto `3001` por defecto y el frontend el `3000`. **Nunca deben compartir el mismo puerto** o el login fallará con errores de conexión / 500.

```bash
# Terminal 1 - API
cd apps/api
npm run dev              # http://localhost:3001/api

# Terminal 2 - Frontend
cd apps/web
npm run dev              # http://localhost:3000
```

### Desarrollo desde la IP de tu laptop (red local)

Para acceder al frontend desde otros dispositivos de tu red (móvil, tablet, otra laptop) usando la IP local en lugar de `localhost`:

1. Configura `apps/web/.env` con tu IP y los orígenes permitidos:

```env
NEXT_PUBLIC_API_URL=http://192.168.0.105:3001/api
ALLOWED_DEV_ORIGINS=localhost,192.168.0.105
```

2. Inicia el frontend atado a la IP:

```bash
cd apps/web
npx next dev --turbopack --hostname 192.168.0.105
```

3. Accede desde cualquier dispositivo de la red:

```text
http://192.168.0.105:3000
```

> **Nota:** `ALLOWED_DEV_ORIGINS` se lee en `next.config.ts` y evita el error de Cross-Origin de Next.js HMR cuando accedes por IP. Los valores se separan por comas. Incluye siempre `localhost` para seguir usandolo localmente.

Si el puerto `3000` está ocupado y Next.js salta al `3001`, mueve el frontend a otro puerto:

```bash
cd apps/web
$env:PORT=3002; npm run dev   # PowerShell
# o
PORT=3002 npm run dev          # bash/WSL
```

Y asegúrate de que `apps/web/.env.local` apunte a la API:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Hay un template en `apps/web/.env.local.example`.

### Variables de Entorno

#### API (`apps/api/.env`)

```env
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/svr_erp"
JWT_ACCESS_SECRET="..."
JWT_REFRESH_SECRET="..."

PORT=3001
FRONTEND_URL=http://localhost:3000

# Opcional: lista de origenes CORS separada por comas
# CORS_ORIGINS=http://localhost:3000,http://localhost:3002

# Bloqueo por IP (anti brute-force)
BLOQUEO_IP_MAX_INTENTOS=10
BLOQUEO_IP_VENTANA_MINUTOS=15
BLOQUEO_IP_MINUTOS=60
```

#### Web (`apps/web/.env.local`)

```env
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3001/api
ALLOWED_DEV_ORIGINS=localhost,192.168.0.105
```

### Credenciales de Acceso (API)

#### Administrador (acceso total a los 6 módulos)

| Campo | Valor |
|-------|-------|
| **Email** | `admin@svr-constructora.com` |
| **Contraseña** | `admin123` |
| **Rol** | Administrador (nivel 100) |

#### Encargado de RRHH (solo módulo Recursos Humanos)

| Campo | Valor |
|-------|-------|
| **Email** | `rrhh@svr-constructora.com` |
| **Contraseña** | `rrhh123` |
| **Rol** | Encargado de RRHH (nivel 30) |
| **Acceso** | Trabajadores (CRUD), Asistencia (ver/crear/editar/exportar), Nómina (ver/crear/editar/procesar/exportar) |
| **No tiene acceso** | Maquinaria, Operaciones, Comercial, Sistema, Configuración |

**Endpoints de autenticación:**

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@svr-constructora.com","password":"admin123"}'

# Registrar nuevo usuario
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"nuevo@test.com","password":"123456","nombre":"Juan","apellido_paterno":"Pérez"}'

# Refrescar token (requiere refresh token del login)
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<token_del_login>"}'

# Cerrar sesión
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer <access_token>"

# Obtener perfil (requiere access token)
curl http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer <access_token>"
```

### Base de Datos — Prisma

### Testing (Unit Tests)

Los tests unitarios usan **Jest** y se ejecutan desde `apps/api/`:

```bash
cd apps/api

npm run test             # Ejecutar todos los tests unitarios
npm run test:watch       # Modo watch (re-ejecuta al guardar)
npm run test:cov         # Tests con reporte de cobertura
```

**Ubicación de los tests unitarios:**

| Archivo | Qué testea |
|---------|------------|
| `src/auth/auth.service.spec.ts` | Login, register, logout, getProfile (28 tests) |
| `src/auth/auth.controller.spec.ts` | Endpoints del controller (5 tests) |
| `src/auth/intentos-login.service.spec.ts` | Registro de intentos de sesión (9 tests) |
| `src/auth/strategies/jwt.strategy.spec.ts` | Validación JWT y blacklist (12 tests) |
| `src/auth/guards/permissions.guard.spec.ts` | RBAC guards (8 tests) |
| `src/bloqueo/bloqueo.service.spec.ts` | Bloqueo escalonado + auditoría (18 tests) |
| `src/inventario/inventario.service.spec.ts` | CRUD de inventario (12 tests) |
| `src/inventario/inventario.controller.spec.ts` | Controller de inventario (7 tests) |
| `src/bitacora/bitacora.service.spec.ts` | CRUD de bitácora (13 tests) |
| `src/bitacora/bitacora.controller.spec.ts` | Controller de bitácora (7 tests) |
| `src/common/filters/throttler-exception.filter.spec.ts` | Error 429 en español (2 tests) |

### Testing (Integration Tests — Real DB)

Los tests de integración ejecutan el flujo completo de autenticación contra la base de datos real (PostgreSQL). No usan mocks — verifican las tablas `intentos_login`, `sessions`, `refresh_tokens`, `token_blacklist`, `usuarios_bloqueados` y `registro_auditoria`.

```bash
cd apps/api

npm run test:integration  # Ejecutar tests de integración (requiere PostgreSQL)
```

**Requisitos:**
- PostgreSQL corriendo con la base `svr_erp` disponible
- Archivo `.env` configurado con `DATABASE_URL`

**Ubicación de los tests de integración:**

| Archivo | Qué testea |
|---------|------------|
| `src/auth/auth.integration.spec.ts` | Flujo completo de auth contra DB real (6 tests) |

**Escenarios cubiertos:**

| # | Escenario | Tablas verificadas |
|---|-----------|-------------------|
| 1 | Login exitoso | `intentos_login` (exitoso), `sessions`, `refresh_tokens`, `registro_auditoria` (LOGIN_EXITOSO) |
| 2 | Login fallido (email no existe) | `intentos_login` (fallido), `registro_auditoria` (USER_NOT_FOUND) |
| 3 | Login fallido (contraseña incorrecta) | `intentos_login` (fallido), `registro_auditoria` (INVALID_PASSWORD) |
| 4 | Bloqueo tras 5 fallos | `usuarios_bloqueados`, `registro_auditoria` (USUARIO_BLOQUEADO), rechazo en 6to intento (ACCOUNT_LOCKED) |
| 5 | Logout | `sessions` (cerrada), `refresh_tokens` (revocados), `token_blacklist`, `registro_auditoria` (LOGOUT) |
| 6 | Refresh token rotation | `token_blacklist` (REFRESH rotado), `refresh_tokens` (nuevo activo), `sessions` (JTI actualizado) |

**Regla:** Todo service, controller o guard nuevo **debe** incluir su archivo `*.spec.ts` junto al fuente. Los tests de integración usan el sufijo `*.integration.spec.ts` y se ejecutan por separado. Ver `AGENTS.md` para las reglas completas de testing.

### Base de Datos — Prisma

```bash
cd apps/api

# 1. Instalar dependencias (primera vez)
npm install

# 2. Pull del esquema desde PostgreSQL (introspección)
npx prisma db pull

# 3. Generar el cliente de Prisma
npx prisma generate

# 4. Migraciones (cuando modifiques schema.prisma manualmente)
npx prisma migrate dev --name <nombre_migracion>

# 5. Deploy de migraciones en producción
npx prisma migrate deploy
```

**Archivos clave:**

| Archivo | Descripción |
|---------|-------------|
| `prisma/schema.prisma` | Schema con 71 modelos introspecteados de `svr_erp` |
| `prisma.config.ts` | Config Prisma 7 (`defineConfig` + `datasource.url`) |
| `.env` | `DATABASE_URL=postgresql://postgres:admin123@localhost:5432/svr_erp` |

**Flujo típico de trabajo:**

```bash
# Si cambias el schema manualmente (agregar campo, índice, etc.)
npx prisma migrate dev --name agregar_campo_activo

# Si la DB cambió por fuera de Prisma (etapa de desarrollo)
npx prisma db pull
npx prisma generate
```

### Build para Móvil (Capacitor)

```bash
cd apps/web
npm run build            # Build estático → apps/web/out/
npx cap sync android     # Sincronizar con proyecto nativo
npx cap open android     # Abrir en Android Studio
```

## Arquitectura y Estructura del Monorepo

Este proyecto utiliza un monorepo basado en npm workspaces y Turborepo para separar el frontend, el backend y los paquetes compartidos.

### Estructura General

```text
SVR-ERP/
├── apps/
│   ├── web/                        # Next.js 16 Frontend (React 19)
│   └── api/                        # NestJS 11 Backend (Prisma 7)
├── packages/
│   └── shared/                     # Tipos, constantes y utilidades compartidas
├── turbo.json                      # Configuración de Turborepo
└── package.json                    # Workspaces root
```

### Arquitectura de `apps/web` (Frontend)

El frontend está construido con **Next.js 16 (App Router)** usando el empaquetador **Turbopack** para desarrollo y **Tailwind CSS v4** para estilos.

**Características de la Arquitectura:**
- **App Router:** Las rutas se definen mediante la estructura de carpetas dentro de `src/app`.
- **Client Components:** Prácticamente todas las vistas y componentes usan `"use client"`. Solo los layouts principales (ej. `layout.tsx` y `(dashboard)/layout.tsx`) se renderizan como Server Components.
- **Sin estado global pesado:** Se usan hooks y contexts (ej. `ToastProvider`, `NotificationProvider`) en lugar de Redux o Zustand para el estado general.
- **UI "headless-like":** Toda la interfaz de usuario está construida usando Tailwind, organizando los componentes reutilizables en `src/components/ui/` sin depender de librerías como MUI.
- **Consistencia Visual:** Se emplean componentes de layout estructurados (`Stack`, `Grid`, `Center`, `Flex`, etc.) para controlar el espaciado.
- **Responsividad:** El diseño es completamente adaptativo utilizando breakpoints definidos en la configuración de Tailwind (`sm`, `md`, `lg`, `xl`).

**Estructura de Carpetas (`apps/web`):**
```text
apps/web/
├── public/                 # Assets estáticos (imágenes, logos)
├── src/
│   ├── app/                # Rutas y páginas (Next.js App Router)
│   │   ├── (dashboard)/    # Rutas agrupadas para el layout protegido (Sidebar/Topbar)
│   │   │   └── [domain]/   # Vistas por módulo (ej. trabajadores, maquinaria)
│   │   ├── globals.css     # Estilos globales y variables de Tailwind v4 (@theme)
│   │   └── layout.tsx      # Root layout de la aplicación
│   ├── components/         # Componentes de React
│   │   ├── layout/         # Componentes base del cascarón (Sidebar, Topbar, Modal, etc.)
│   │   ├── ui/             # Componentes UI reutilizables (Botones, Inputs, Cards)
│   │   └── [dominio]/      # Componentes por módulo (machinery, projects, workers)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilidades, helpers y datos mock
│   └── providers/          # Context Providers de React
├── next.config.ts          # Configuración de Next.js
└── package.json
```

### Arquitectura de `apps/api` (Backend)

El backend es una API RESTful desarrollada con **NestJS 11** y el ORM **Prisma 7** conectado a PostgreSQL 18.

**Características de la Arquitectura:**
- **Módulos Desacoplados:** La API está dividida por dominios de negocio y responsabilidades transversales (Auth, Bloqueo, etc.) manteniendo una arquitectura modular limpia.
- **Prisma Global:** `PrismaModule` se configura con el decorador `@Global()`, permitiendo inyectar `PrismaService` en cualquier servicio sin necesidad de importar el módulo en cada feature. Usa el adaptador `@prisma/adapter-pg`.
- **Estandarización de Respuestas:** Usa un `AllExceptionsFilter` para transformar excepciones en JSON consistentes (`{ success: false, error: ... }`) y un `TransformInterceptor` para envolver el éxito de las respuestas en (`{ success: true, data: ... }`).
- **Seguridad Multicapa:** Utiliza JWT para autenticación. Incorpora protección anti-bruteforce avanzada (bloqueos temporales por intentos fallidos, bloqueos IP escalonados) usando módulos de Rate Limiting y Throttler global.
- **Control de Acceso basado en Roles (RBAC):** Protege las rutas mediante un `PermissionsGuard` y decoradores personalizados `@RequirePermission()`, cruzando los permisos del usuario almacenados en la base de datos de manera granular (ver, crear, editar, eliminar).
- **Soft Deletes y Auditoría:** Adopta un diseño orientado a mantener el histórico de datos. Los registros usan soft deletes (`eliminado_en`) en vez de eliminaciones físicas. 

**Estructura de Carpetas (`apps/api`):**
```text
apps/api/
├── prisma/
│   ├── migrations/         # Archivos de migración de esquema SQL
│   └── schema.prisma       # Modelos Prisma ORM (~71 tablas) configurados con PostgreSQL
├── src/
│   ├── auth/               # Módulo central de Autenticación, sesión y guards JWT/RBAC
│   ├── bloqueo/            # Módulo de lógica de bloqueo de cuentas/IPs
│   ├── common/             # Interceptores, decorators y Exception Filters globales
│   ├── prisma/             # Módulo Prisma integrado como dependecia global de NestJS
│   ├── app.module.ts       # Root module donde se orquestan imports, rate limits y filtros
│   └── main.ts             # Punto de entrada de la API (CORS, Pipes de validación)
├── prisma.config.ts        # Configuración explícita del cliente y driver de Prisma
└── package.json
```

## Reglas de Estilo

- **Tailwind v4:** Config en `globals.css` via `@theme {}`.
- **Componentes:** Todos usan `"use client"`. Solo los layouts son Server Components.
- **Estilos separados:** Cada componente tiene `Component.tsx` + `Component.styles.ts`.
- **Responsive:** Mobile-first, 3 breakpoints (sm/md/lg).
- **Moneda:** Siempre `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })`.
- **Iconos:** Importar individualmente de `lucide-react`.
- **Utilidad `cn()`:** clsx + tailwind-merge para clases condicionales.
- **Gráficas:** Usar `recharts` vía wrappers en `apps/web/src/components/ui/Charts/`.
- **Layout:** Usar `Stack`, `Container` y `Divider` para consistencia de espaciado.
- **Zona segura:** Todas las páginas usan `p-6 space-y-6 bg-slate-50`.

## Layout y Espaciado

Componentes de layout disponibles en `apps/web/src/components/ui/`:

| Componente | Uso | Ejemplo |
|---|---|---|
| `Stack` | Espaciado vertical/horizontal consistente | `<Stack gap="md">...</Stack>` |
| `Container` | Max-width centrado con padding | `<Container size="xl">...</Container>` |
| `Grid` | Layouts responsivos de columnas | `<Grid columns={{ sm: 1, lg: 4 }}>...</Grid>` |
| `Center` | Centrar contenido vertical/horizontal | `<Center className="h-32">...</Center>` |
| `Spacer` | Espaciador declarativo | `<Spacer size="lg" />` |
| `Flex` | Wrapper flexbox de control total (direction, justify, align, wrap) | `<Flex justify="between">...</Flex>` |
| `AspectRatio` | Mantener proporcion fija | `<AspectRatio ratio="video">...</AspectRatio>` |
| `VisuallyHidden` | Ocultar visualmente (accesible) | `<VisuallyHidden>Texto</VisuallyHidden>` |
| `Show` / `Hide` | Mostrar/ocultar por breakpoint | `<Show above="md">...</Show>` |
| `ScrollArea` | Scroll controlado | `<ScrollArea maxHeight="200px">...</ScrollArea>` |
| `Separator` | Separador horizontal/vertical | `<Separator orientation="vertical" />` |
| `Box` | Contenedor basico flexible | `<Box padding="md" radius="lg">...</Box>` |
| `Collapse` | Expandir/colapsar contenido | `<Collapse in={open}>...</Collapse>` |
| `Portal` | Renderizar fuera del DOM padre | `<Portal>...</Portal>` |
| `Overlay` | Capa semitransparente | `<Overlay onClick={close} />` |
| `Divider` | Separador visual entre secciones | `<Divider label="Sección" />` |
| `PageHeader` | Encabezado estándar de página | `<PageHeader title="Título" />` |
| `Card` | Contenedor con padding y borde | `<Card padding="md">...</Card>` |
| `DatePicker` | Selector de fecha con calendario | `<DatePicker value={fecha} onChange={setFecha} />` |
| `DateRangePicker` | Selector de rango de fechas | `<DateRangePicker value={range} onChange={setRange} />` |
| `TimePicker` | Selector de hora | `<TimePicker value="08:30" onChange={setTime} />` |
| `FormField` | Wrapper de label + hint + error | `<FormField label="Nombre"><Input /></FormField>` |
| `Checkbox` | Caja de verificacion | `<Checkbox checked={x} onChange={setX} label="Acepto" />` |
| `Radio` | Boton de opcion unica | `<Radio name="tipo" value="a" label="Opcion A" />` |
| `Switch` | Toggle on/off | `<Switch checked={x} onChange={setX} label="Activar" />` |
| `Textarea` | Campo multilinea | `<Textarea label="Notas" rows={4} />` |
| `Modal` | Modal base + sub-componentes | `<Modal open={open} onClose={fn}>...</Modal>` |
| `FormModal` | Modal pre-armado para CRUD | `<FormModal open={open} onSubmit={fn}>...</FormModal>` |

### Zona Segura

Toda página del dashboard debe seguir el patrón:

```tsx
<div className="p-6 space-y-6 bg-slate-50 min-h-screen">
  <PageHeader title="Título" />
  <section>...</section>
</div>
```

- `p-6`: Padding de página (24px).
- `space-y-6`: Separación entre secciones (24px).
- `bg-slate-50`: Fondo consistente.

### Tokens de Spacing

| Token | Valor | Uso |
|-------|-------|-----|
| `--spacing-page` | 24px | Padding de página |
| `--spacing-section` | 24px | Entre secciones |
| `--spacing-card` | 24px | Dentro de cards |
| `--spacing-card-sm` | 16px | Card padding pequeño |
| `--spacing-stack` | 16px | Stack vertical |
| `--spacing-inline` | 12px | Entre elementos inline |

### Responsive Design

- Mobile-first con breakpoints de Tailwind: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px).
- Patrón común: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`.
- Todo componente debe ser responsive — ver reglas en [COMPONENTS.md](./COMPONENTS.md).

## Librerías de Terceros

### Gráficas - Recharts

Las visualizaciones de datos usan [recharts](https://recharts.org/):

```bash
cd apps/web
npm install recharts
```

Wrappers disponibles en `apps/web/src/components/ui/Charts/`:

```tsx
import { BarChart, LineChart, AreaChart, PieChart, DoughnutChart, RadarChartComponent, RadialBarChartComponent, ScatterChartComponent } from '@/components/ui/Charts';

<BarChart title="Producción" data={[{ label: 'Ene', value: 120 }]} />
<LineChart title="Tendencias" labels={['Ene', 'Feb']} series={[{ name: 'Ventas', data: [100, 200] }]} />
```

Características de los wrappers:
- `ResponsiveContainer` para adaptarse a cualquier contenedor.
- Tooltip oscuro con cursor gris punteado (evita artefactos visuales).
- Colores de marca (`#ed8238`) y semánticos por defecto.
- Grid, labels y leyenda configurables.

Ver documentación completa en [COMPONENTS.md](./COMPONENTS.md).

## Datos

Las páginas usan datos mock de `apps/web/src/lib/mock-data/`. Los tipos están en `packages/shared/src/types/`. El backend está implementado en `apps/api/` con autenticación JWT, RBAC y acceso a PostgreSQL.
