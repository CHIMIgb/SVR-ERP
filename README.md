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
npm run test             # Ejecutar tests unitarios
npm run test:cov         # Tests con reporte de cobertura
```

### Credenciales de Acceso (API)

| Campo | Valor |
|-------|-------|
| **Email** | `admin@svr-constructora.com` |
| **Contraseña** | `admin123` |
| **Rol** | Administrador (nivel 100, acceso total a los 6 módulos) |

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

## Estructura del Monorepo

```
SVR-ERP/
├── apps/
│   ├── web/                        # Next.js 16 Frontend
│   │   ├── src/
│   │   │   ├── app/                # App Router (24 páginas dashboard)
│   │   │   ├── components/         # UI (layout, workers, machinery, projects)
│   │   │   └── lib/                # Utilities, hooks, contexts, mock data
│   │   ├── public/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── next.config.ts
│   │
│   └── api/                        # NestJS Backend
│       ├── prisma/
│       │   ├── schema.prisma       # 71 modelos (introspecteados de svr_erp)
│       │   └── migrations/
│       ├── prisma.config.ts        # Config Prisma 7
│       ├── .env                    # DATABASE_URL
│       ├── src/
│       │   ├── main.ts
│       │   └── app.module.ts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/                     # Paquete compartido
│       ├── src/
│       │   ├── types/              # Interfaces TypeScript por dominio
│       │   ├── utils/              # formatCurrency, formatDate
│       │   └── constants/          # ROLES, STATUSES
│       ├── package.json
│       └── tsconfig.json
│
├── package.json                    # Root workspace config
├── turbo.json                      # Turborepo config
├── tsconfig.base.json              # TS config compartida
└── .gitignore
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
