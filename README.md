# SVR-ERP

Sistema ERP de gestión para maquinaria, trabajadores, proyectos y operaciones.

## Stack

- **Frontend:** Next.js 16 (App Router, Turbopack) + React 19 + Tailwind CSS v4
- **Backend:** NestJS 11 + Prisma 6 + PostgreSQL 16+ *(Fase 4)*
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

### Backend (cuando esté listo)

```bash
cd apps/api
npm run dev              # NestJS en http://localhost:3001/api
npm run db:migrate       # Ejecutar migraciones Prisma
npm run db:seed          # Poblar base de datos
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
│   └── api/                        # NestJS Backend *(Fase 4)*
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
| `Flex` / `Row` / `Column` | Wrappers flexbox semanticos | `<Row justify="between">...</Row>` |
| `AspectRatio` | Mantener proporcion fija | `<AspectRatio ratio="video">...</AspectRatio>` |
| `VisuallyHidden` | Ocultar visualmente (accesible) | `<VisuallyHidden>Texto</VisuallyHidden>` |
| `Show` / `Hide` | Mostrar/ocultar por breakpoint | `<Show above="md">...</Show>` |
| `ScrollArea` | Scroll controlado | `<ScrollArea maxHeight="200px">...</ScrollArea>` |
| `Separator` | Separador horizontal/vertical | `<Separator orientation="vertical" />` |
| `Divider` | Separador visual entre secciones | `<Divider label="Sección" />` |
| `PageHeader` | Encabezado estándar de página | `<PageHeader title="Título" />` |
| `Card` | Contenedor con padding y borde | `<Card padding="md">...</Card>` |

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

Las páginas usan datos mock de `apps/web/src/lib/mock-data/`. Los tipos están en `packages/shared/src/types/`. El backend real viene en la Fase 4 del [PLAN-ARQUITECTURA.md](./PLAN-ARQUITECTURA.md).
