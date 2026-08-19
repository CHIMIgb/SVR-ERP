# AGENTS.md — SVR-ERP

## Critical: Next.js 16 + Turbopack

This is **Next.js 16.2.4** with Turbopack. APIs may differ from your training data.
Before writing any code, check the relevant guide in `node_modules/next/dist/docs/01-app/`.

## Tech Stack

- **Next.js 16** (App Router, Turbopack bundler)
- **React 19**, **TypeScript 5** (strict mode)
- **Tailwind CSS v4** — NOT v3. Config lives in `src/app/globals.css` via `@theme {}`. The file `tailwind.config.ts` is dead code (v4 ignores it).
- **lucide-react** for icons (tree-shake individual imports, not barrel)
- **No component library** — all UI is raw Tailwind
- **No backend** — all data is mock in `src/lib/data.ts`

## Commands

```bash
npm run dev       # Start dev server (Turbopack)
npm run build     # Production build
npm run start     # Serve production build
npm run lint      # ESLint (flat config, eslint-config-next)
```

No test runner is configured. No CI pipeline exists.

## Path Aliases

`@/*` maps to `./src/*` (configured in `tsconfig.json`).

```ts
import { maquinaria } from '@/lib/data';
import Modal from '@/components/layout/Modal';
```

## Project Structure

```
src/
  app/
    layout.tsx                  # Root layout (Server Component) — Inter + Space Grotesk fonts
    globals.css                 # Tailwind v4 @theme tokens + component classes
    page.tsx                    # Login/landing page ("use client")
    (dashboard)/
      layout.tsx                # Dashboard shell (Server Component) — Sidebar + Topbar + providers
      [domain]/page.tsx         # 24 dashboard pages — ALL are "use client"
  components/
    layout/                     # Sidebar, Topbar, Modal, Toast, NotificationContext, etc.
    workers/                    # WorkerCard, LiquidacionModal, BitacorasRentaModal, AsistenciaGpsModal
    machinery/                  # MachineCard
    projects/                   # ProjectCard, ProjectDetailsModal
  lib/
    data.ts                     # Monolithic: ALL types + ALL mock data (~1,286 lines)
```

## Styling Rules

- **Tailwind v4 only.** Custom tokens are in `globals.css` `@theme {}` block (colors: primary, secondary, sidebar, background; fonts: sans, display; radii: lg, xl, 2xl).
- `tailwind.config.ts` is legacy v3 config — **ignore it, do not edit**.
- Two reusable CSS classes exist: `.btn-primary` and `.card` (defined in `@layer components`).
- Two keyframes: `slideInRight` (toasts), `fadeScaleIn` (modals). Use via `animate-[slideInRight_0.3s_ease-out]`.
- `cn()` utility (clsx + tailwind-merge) is defined locally in `Sidebar.tsx` — not extracted yet. If you need it elsewhere, import from `Sidebar` or create `src/lib/utils.ts`.

## Component Patterns

- Every page and component uses `"use client"`. Only the two layout files (`src/app/layout.tsx`, `src/app/(dashboard)/layout.tsx`) are Server Components.
- `Modal` component exports: default `Modal`, named `ModalField`, `inputClass`, `selectClass` — used across 11+ files.
- Context providers: `ToastProvider` (in `Toast.tsx`) and `NotificationProvider` (in `NotificationContext.tsx`), nested in dashboard layout.
- Currency formatting: `new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })` — duplicated in 17 files (no shared utility yet).
- Icons: import individual icons from `lucide-react`, never the barrel.

## Data Layer

`src/lib/data.ts` is the single source of truth for all types and mock data. **28 files import from it.** Treat it carefully — any change can cascade re-compilations. Types are organized by domain but live in this one file.

## Known Gotchas

- **Turbopack panics** occur on navigation between pages. This is a known issue with the current architecture (monolithic data file + all-client components). Do not attempt to "fix" Turbopack — the architecture needs refactoring.
- **No code splitting** — no `next/dynamic` or `React.lazy` is used anywhere. All pages load eagerly.
- **`framer-motion`** is in `package.json` but never imported — dead dependency.
- The dashboard layout (`(dashboard)/layout.tsx`) imports 4 client components into a Server Component, creating a hydration boundary on every navigation.
- All page headers follow the same pattern (`text-3xl font-black tracking-tight text-slate-900`) — repeated in 19 files, no shared `PageHeader` component yet.
- Locale is hardcoded to `es-MX` / `MXN` throughout. No i18n system.

## Language

The app UI is entirely in **Spanish** (Mexican). All mock data, labels, and user-facing strings are Spanish.

## Critical Rules

- **NO DUPLICATE KEYS:** Before writing any `.map()` over arrays that render JSX, ALWAYS verify there are no duplicate `key` values. Duplicated keys cause React console errors and broken rendering. Use unique identifiers (IDs, unique names, or index + prefix if no unique data exists). Run `npx tsc --noEmit` after changes to catch issues.
- **DOCUMENT EVERYTHING:** Every UI component created in `src/components/ui/` MUST be documented in `COMPONENTS.md` with: Props table, Import example, Usage example, "When to use" and "When NOT to use" sections. This is non-negotiable.
