# SVR-ERP

Sistema ERP de gestión para maquinaria, trabajadores, proyectos y operaciones.

## Stack

- **Frontend:** Next.js 16 (App Router, Turbopack) + React 19 + Tailwind CSS v4
- **Backend (planeado):** NestJS 11 + Prisma 6 + PostgreSQL 16+
- **Móvil:** Capacitor (compila el frontend web a APK nativo)
- **Lenguaje:** TypeScript 5 (strict mode)

## Comandos

### Desarrollo

```bash
npm run dev          # Iniciar servidor de desarrollo (Turbopack) en http://localhost:3000
```

### Build y Producción

```bash
npm run build        # Build de producción
npm run start        # Servir build de producción
```

### Linting

```bash
npm run lint         # Ejecutar ESLint
```

### Build para Móvil (Capacitor)

```bash
# 1. Build estático
npm run build

# 2. Sincronizar con proyecto nativo
npx cap sync android

# 3. Abrir en Android Studio
npx cap open android
```

## Estructura del Proyecto

```
src/
├── app/
│   ├── layout.tsx                  # Root layout (Server Component)
│   ├── globals.css                 # Tailwind v4 tokens (@theme {})
│   ├── page.tsx                    # Login/landing
│   └── (dashboard)/
│       ├── layout.tsx              # Shell del dashboard (Server Component)
│       └── [domain]/page.tsx       # 24 páginas del dashboard
├── components/
│   ├── layout/                     # Sidebar, Topbar, Modal, Toast, etc.
│   ├── workers/                    # WorkerCard, modales de trabajadores
│   ├── machinery/                  # MachineCard
│   └── projects/                   # ProjectCard, ProjectDetailsModal
├── types/                          # Interfaces TypeScript por dominio
│   ├── maquinaria.ts
│   ├── trabajadores.ts
│   ├── proyectos.ts
│   ├── operaciones.ts
│   └── index.ts                    # Barrel re-exports
└── lib/
    ├── data.ts                     # Barrel re-exports (tipos + mock data)
    └── mock-data/                  # Datos mock por dominio
        ├── maquinaria.ts
        ├── trabajadores.ts
        ├── proyectos.ts
        └── operaciones.ts
```

## Reglas de Estilo

- **Tailwind v4:** Config en `globals.css` via `@theme {}`. `tailwind.config.ts` es código muerto (v4 lo ignora).
- **Componentes:** Todos usan `"use client"`. Solo los layouts son Server Components.
- **Moneda:** Siempre `new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })`.
- **Iconos:** Importar individualmente de `lucide-react`, nunca barrel.
- **Utilidad `cn()`:** clsx + tailwind-merge para clases condicionales.

## Datos

Todas las páginas usan datos mock de `src/lib/data.ts`. El backend (NestJS + Prisma) está planeado en la Fase 4 del [PLAN-ARQUITECTURA.md](./PLAN-ARQUITECTURA.md).
