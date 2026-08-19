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

## Datos

Las páginas usan datos mock de `apps/web/src/lib/mock-data/`. Los tipos están en `packages/shared/src/types/`. El backend real viene en la Fase 4 del [PLAN-ARQUITECTURA.md](./PLAN-ARQUITECTURA.md).
