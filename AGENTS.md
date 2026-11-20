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

Jest corre en `apps/api`; el front aún no tiene runner de tests.
CI/CD: ver la sección "CI/CD (GitHub Actions)" al final de este archivo.

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
- Two keyframes: `slideInRight` (toasts), `fadeScaleIn` (modals and post-load conditional alert banners). Use via `animate-[slideInRight_0.3s_ease-out]` / `animate-[fadeScaleIn_0.2s_ease-out]`.
- `cn()` utility (clsx + tailwind-merge) is defined locally in `Sidebar.tsx` — not extracted yet. If you need it elsewhere, import from `Sidebar` or create `src/lib/utils.ts`.

## Component Patterns

- Every page and component uses `"use client"`. Only the two layout files (`src/app/layout.tsx`, `src/app/(dashboard)/layout.tsx`) are Server Components.
- `Modal` component exports: default `Modal`, named `ModalField`, `inputClass`, `selectClass` — used across 11+ files.
- Context providers: `ToastProvider` (in `Toast.tsx`) and `NotificationProvider` (in `NotificationContext.tsx`), nested in dashboard layout.
- Currency formatting: `new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })` — duplicated in 17 files (no shared utility yet).
- Icons: import individual icons from `lucide-react`, never the barrel.

### Loaders/Skeletons — regla dura (todas las vistas: Operaciones, Comercial y TODOS los módulos)

**La primera impresión de una vista cargando nunca es un bloque vacío ni un "0" falso: tablas con skeleton, KPIs con spinner.**

1. **Tablas:** `<DataTable loading={cargando} ...>` — pinta skeleton de filas internamente + `emptyText` cuando no hay datos. NUNCA renderizar un spinner encima del DataTable para la carga inicial.
1b. **Orden del sleep demo:** si una página con `await sleepDemo()` tiene su estado de carga en `false` por defecto (p. ej. `/ventas` con `cargandoCatalogo`), el sleep va DESPUÉS de encender la bandera (`set...Loading(true)`) — si va antes, los 3 segundos cargan sin spinner (bug de la demo del 2026-11-07). Con flags que inician en `true` el orden no altera el efecto.
2. **KPIs (`StatsCard`):** con `loading={...}` el **spinner vive solo en el espacio del valor** (el icono y la etiqueta se ven reales desde el primer render; nunca "0" falso — las KPIs siempre cargan números, no skeleton).
2b. **Color único del spinner:** todo `Loader2` de carga es `Loader2 className="w-5 h-5 (o w-6) text-primary animate-spin"` — NUNCA colorear el spinner con el color del dato (green/blue/indigo...); el color propio solo aplica al valor ya cargado. Como todos los spinners viven en componentes globales, cualquier ajuste de color/tamaño se hace UNA sola vez ahí.
3. **Bloques no tabulares** (tab de detalle, paneles, cards de contenido): `<Skeleton variant="card" />` / `row` / `text` (con `SkeletonText` cuando el contenido simula párrafos).
4. **Refetches con datos ya en pantalla** (filtros, paginación, búsqueda): `<RefreshOverlay show={refetch} />` dentro de un padre `relative` — nunca un skeleton completo ni un spinner suelto.
5. **`Button skeleton`** placeholder en las acciones principales durante la carga inicial; **`LoadingState`** queda reservado para estados de autenticación/layout.
6. Banners/alertas condicionales (stock crítico, incidentes críticos, etc.): **NO existen durante la carga** (gatear con `!initialLoading && <condición>`) y al aparecer usan `animate-[fadeScaleIn_0.2s_ease-out]`. NUNCA un skeleton rojo de banner — simularía una alerta inexistente. Effect documentado en COMPONENTS.md (keyframes).
7. Reutiliza el kit — `LoadingState`, `Skeleton`, `SkeletonText`, `DataTable.loading`, `Button.loading/skeleton`, `StatsCard.loading`, `FormModal.isSubmitting`, `RefreshOverlay`. Está prohibido copiar/pegar bloques de `Loader2 + animate-spin` entre vistas (ese patrón ya se extrajo y consolidó).

### Toasts de error — helper único (`mensajeErrorApi`)

**El mensaje de todo toast de error de API sale SIEMPRE del helper `mensajeErrorApi(res.error, '<fallback de la vista>')`** (vive en `lib/api.ts`) — nunca `res.error?.message || '...'` a mano. Razón: el backend responde los 422 con `details[]` (class-validator) y el helper los une con "·" para que el usuario vea QUÉ campo falló; el `||` directo pierde esa información y muestra solo "Error de validación".

1. Prioridad del helper: `details[].map(String).join(' · ')` → `error.message` → fallback de la vista.
2. NUNCA componer a mano `details?.join(...) || ...` ni `res.error?.message || ...` en un toast.
3. Los `catch` de red mantienen su mensaje de conexión (p. ej. "Error de conexión...") — no pasan por el helper salvo que re-lancen un error del contrato.
4. Aplicado 2026-11-07 en las vistas de Comercial + Operaciones (49 ramas + 3 manuales); el resto de módulos es de otro dev — aplicar el MISMO patrón cuando los toque (el helper ya está disponible en `lib/api.ts`).

## Data Layer

`src/lib/data.ts` is the single source of truth for all types and mock data. **28 files import from it.** Treat it carefully — any change can cascade re-compilations. Types are organized by domain but live in this one file.


## Regla de oro — escritorio y PWA son INDEPENDIENTES

**Lo que se haga para ESCRITORIO se queda en el escritorio; lo que se haga
para la PWA se queda en la PWA. En el frontend son aplicaciones
independientes: ninguna afecta a la otra.** Un cambio de escritorio no debe
arrastrar la PWA ni viceversa (excepción: piezas de sesión/API compartidas,
que viven en su propio archivo).

## PWA móvil (rutas `/m/*` — grupo de rutas `(pwa)`)

La PWA vive DENTRO de `apps/web` como grupo de rutas `(pwa)` con pantallas en `/m/*` — **NUNCA crear `apps/pwa` aparte ni duplicar sesión/apiClient** (ver plan completo: `pwa/vistas-movil-comercial-operaciones.md`, §5b y §6 — la especificación funcional definitiva del cliente: asistencia universal con foto+GPS, login por número de empleado + PIN, offline-first).

Reglas duras al construir vistas móviles (aplican igual que las de escritorio, con estos matices):

1. **Diseño "acción primero"** (spec del cliente): tarjetas grandes con 2-3 datos y UNA acción principal por pantalla. PROHIBIDO apretar tablas del desktop en el teléfono — cada módulo móvil es una vista nueva, no un responsive.
2. **REUSA el kit existente primero** (`src/components/ui/*`: Input, Modal/FormModal, Badge, Skeleton, Button, StatsCard, EmptyState, Pagination…). Solo crea componentes NUEVOS en `src/components/pwa/*` cuando no exista equivalente — y **documéntalos en `COMPONENTS-PWA.md`** (props, import/uso, cuándo usar / cuándo no) igual que los del kit. No negociable.
3. **Navegación inferior por rol** construida desde `user.vistas` (`lib/pwa/rol-nav.ts`) — PROHIBIDO hardcodear el menú por rol dentro de cada pantalla.
4. **Objetivos táctiles ≥ 44px de alto** en botones/acciones (dedos con guantes) y respeto de safe-areas (`env(safe-area-inset-*)`) en header/nav inferior.
5. Sin CSS inline (regla global), tokens `@theme` de `globals.css`, clases de componente en `*.styles.ts` — las mismas reglas de estilos del desktop aplican.
6. Texto 100% español es-MX; errores de API con `mensajeErrorApi` (helper único).
7. **Offline-first DESDE EL DÍA 1** (aclaración del cliente, spec §6.2/§7c): toda pantalla de CAPTURA escribe primero en la cola local (`lib/pwa/offline.ts`, IndexedDB, idempotente por UUID del teléfono) y el sincronizador (`lib/pwa/sincronizador.ts`) envía al volver señal; las acciones interactivas (aceptar/cerrar/cortes) requieren conexión. Las pantallas no inventan almacenamiento ad hoc — usan ese patrón.
8. El detector/interruptor móvil↔escritorio vive en `lib/pwa/dispositivo.ts` (umbral `<768px → /m/*`, interruptor recordado en `localStorage`) — las pantallas NO implementan detección propia.
9. La asistencia es **universal** (todos los roles marcan la propia con foto+GPS; solo Residentes ven además la de su equipo) — la migración de accesos de la PWA la agrega a todos los roles de trabajadores.
10. `npx tsc --noEmit` + eslint después de cada cambio (mismo gate que desktop). Tests: al existir infra frontend, cada pantalla nueva lleva tests; mientras tanto, smoke manual documentado en el registro del commit.
11. Login móvil por **número de empleado + PIN** (spec §6.4-6.5): es FASE de backend propia — las pantallas de sesión móvil no se construyen sobre email+password ni duplican el AuthProvider.
12. **La PWA consume la MISMA API ya construida** — PROHIBIDO crear endpoints duplicados "versión móvil" de algo que ya existe (un recurso, un endpoint, consumido por desktop y PWA por igual). Endpoints NUEVOS solo cuando el flujo móvil lo exija y no exista equivalente (ej. login-pin, reinicio/desbloqueo de PIN, estado de PIN — ver plan §8.2), cada uno con los 4 estándares del repo.

## Known Gotchas

- **Turbopack panics** occur on navigation between pages. This is a known issue with the current architecture (monolithic data file + all-client components). Do not attempt to "fix" Turbopack — the architecture needs refactoring.
- **No code splitting** — no `next/dynamic` or `React.lazy` is used anywhere. All pages load eagerly.
- **`framer-motion`** is in `package.json` but never imported — dead dependency.
- The dashboard layout (`(dashboard)/layout.tsx`) imports 4 client components into a Server Component, creating a hydration boundary on every navigation.
- All page headers follow the same pattern (`text-3xl font-black tracking-tight text-slate-900`) — repeated in 19 files, no shared `PageHeader` component yet.
- Locale is hardcoded to `es-MX` / `MXN` throughout. No i18n system.

## Language

The app UI is entirely in **Spanish** (Mexican). All mock data, labels, and user-facing strings are Spanish.

## Regla de oro — código existente

**El código ya creado NO se toca a menos que el usuario lo autorice.** Si un
cambio requiere tocar código existente, SIEMPRE decir antes **qué se va a
cambiar y en dónde** (archivos/métodos), y esperar la autorización. Aplica a
refactors, "mejoras de paso" y limpieza incidental: nada se mueve, renombra
o elimina sin autorización explícita.

## Critical Rules

- **ALL COMPONENTS MUST BE RESPONSIVE:** Every UI component (existing and future) MUST be responsive. Use Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`) for layouts, flex direction changes, grid adjustments, and text sizing. Tables must scroll horizontally on mobile. Modals must adapt to small screens. Forms stack on mobile. This is the #1 rule — no exceptions.
- **NO DUPLICATE KEYS:** Before writing any `.map()` over arrays that render JSX, ALWAYS verify there are no duplicate `key` values. Duplicated keys cause React console errors and broken rendering. Use unique identifiers (IDs, unique names, or index + prefix if no unique data exists). Run `npx tsc --noEmit` after changes to catch issues.
- **DOCUMENT EVERYTHING:** Every UI component created in `src/components/ui/` MUST be documented in `COMPONENTS.md` with: Props table, Import example, Usage example, "When to use" and "When NOT to use" sections. This is non-negotiable.
- **DOCUMENT PWA COMPONENTS:** Every component created in `src/components/pwa/` MUST be documented in `COMPONENTS-PWA.md` with the same sections (Props table, Import, Usage, "When to use" / "When NOT to use") in the SAME change. This is non-negotiable.
- **NUEVA VISTA = PLANTILLA `/inventario`:** Toda vista nueva se construye tomando la vista `/inventario` como base (PageHeader, StatsCards, SearchBar + filtros, DataTable con acciones por RBAC, Pagination, FormModal). Nunca se construye una vista CRUD desde cero.
- **PLAN ANTES DE CÓDIGO (obligatorio):** Para cada cambio o cosa nueva, SIEMPRE presentar primero un plan de implementación (qué archivos se tocarán, qué harás, impacto) y esperar la autorización del usuario. **Nunca se crea ni se modifica código sin autorización previa.**
- **TESTS REALES OBLIGATORIOS en vistas/edges de datos:** Toda vista nueva o modificación debe llevar: pruebas de unicidad (índices únicos / duplicados por carrera), pruebas de integración contra la BD real (PostgreSQL, `npm run test:integration`) que inserten registros reales, y tests específicos para la tabla `registro_auditoria` (SUCCESS/FAIL + error_code) también con inserciones reales. Los mocks unitarios no bastan para estos 3 tipos.
- **TODA consulta listado paginada (regla dura backend):** Ningún endpoint de listado puede `findMany` sin `take`/`skip`. Patrón estándar: query `?page=&limit=`, default 10, techo 100 (`Math.min(limit, 100)`), respuesta `{ items, pagination: { page, limit, total, totalPages } }` — referencia viva: `criba.service.ts` e `inventario.service.ts`. Exentos (sin paginar): catálogos para selects (datos maestros), sub-consultas hijas acotadas al registro padre (conceptos de 1 factura, percepciones de 1 nómina), y las operaciones de negocio dentro de transacciones. Los listados "del día" (ventas/retiros) usan `take` + orden desc. Auditoría reutilizable: `node scripts/audit-pagination.cjs` (apps/api) lista todo `findMany` sin `take`. Deuda conocida: 19 endpoints de listado quedaron sin paginar (auditoría 2026-11-04: horometro, checklists, despachos, transacciones/finanzas, conciliación, listados cobranza, nominas por periodo, estadoscuenta proveedores, listado máquinas/bitácoras/mantenimiento); corregirlos conforme se toca cada módulo.

## Registro de cambios obligatorio (historial-cambios/)

**Regla dura para commits y PRs — aplica a todos los agentes:**

1. **Un commit por cada cambio hecho.** Cada cambio terminado se commitea de inmediato, atómico y en español, sin mezclar trabajo ajeno.
2. **Cada commit incluye su archivo de registro**, fechado, en `historial-cambios/` (raíz del repo, carpeta dedicada exclusivamente a esto):
   - Nombre: `YYYY-MM-DD-tema-corto.md` (varios cambios el mismo día → `-2`, `-3`...).
   - Contenido: resumen del cambio, cosas nuevas, archivos tocados, verificación/pruebas corridas, pendientes y riesgos. Ver plantilla completa en `historial-cambios/README.md`.
3. **Commits SIEMPRE en español**, con el estilo del repo: `feat|fix|refactor|docs|test(api|web|db): descripción (contexto)`.
4. **`git push` y PRs SOLO cuando el usuario lo ordene explícitamente.** Nunca pushear por iniciativa propia; al terminar un cambio queda commiteado localmente y nada más.

## UI Components — Reglas de Migración

Al crear o refactorizar vistas, reemplazar estos patrones manuales
por sus componentes equivalentes. **Nunca re-implementar lo que ya existe.**

**REGLA DURA — respetar la documentación de componentes reutilizables
(`COMPONENTS.md`, raíz del repo):** toda vista usa el kit
`src/components/ui/*` siguiendo SU documentación en `COMPONENTS.md` —
variantes, props, tamaños, y cuándo usar / cuándo NO usar cada componente
(ej. la acción de ver/leer en columnas de acciones va con
`variant="info"` + icono `Eye`, el pie de un modal de solo lectura lleva
`<ModalFooter>` con botón Cerrar `variant="secondary"`, los loaders usan
el patrón documentado en la sección de componentes, etc.). Antes de
construir o editar una vista, CONSULTAR `COMPONENTS.md`; desviarse del
componente documentado es Request Changes. Si el componente no existe,
se crea nuevo en `src/components/ui/` (con patrón `.tsx` + `.styles.ts`
+ `index.ts`) y se documenta en `COMPONENTS.md` en el mismo cambio.

| Patrón manual existente | Componente a usar | Import |
|------------------------|-------------------|--------|
| `text-3xl font-black tracking-tight text-slate-900` en headers | `<PageHeader title="..." />` | `@/components/ui/PageHeader` |
| `bg-white rounded-xl border border-slate-200 shadow-sm p-6` | `<Card>` | `@/components/ui/Card` |
| `border-t border-slate-100` / `border-b border-slate-100` | `<Separator />` | `@/components/ui/Separator` |
| `title="..."` en elementos truncados | `<Tooltip content="...">` | `@/components/ui/Tooltip` |
| `<input type="text">` nativo | `<Input />` | `@/components/ui/Input` |
| `<select>` nativo | `<Select />` | `@/components/ui/Select` |
| `<textarea>` nativo | `<Textarea />` | `@/components/ui/Textarea` |
| Botón + menú flotante ad-hoc con useState/useRef | `<DropdownMenu>` | `@/components/ui/DropdownMenu` |
| `type="file"` + drag & drop manual | `<FileUpload />` (próximamente) | — |
| Loading con `Loader2 animate-spin` | `<LoadingState />` | `@/components/ui/LoadingState` |
| Empty state manual con icono + texto | `<EmptyState />` | `@/components/ui/EmptyState` |
| Badges `<span className="bg-... rounded-full">` | `<Badge />` | `@/components/ui/Badge` |
| Avatar manual con initials/image | `<Avatar />` | `@/components/ui/Avatar` |
| Tab layout manual con onClick + estado | `<Tabs>` + `<TabPanel>` | `@/components/ui/Tabs` |
| Form fields con label + error + hint | `<FormField>` + `<Input>` | `@/components/ui/FormField` |
| Modales manuales con Overlay + useState | `<Modal>` / `<FormModal>` | `@/components/ui/Modal` |
| Skeleton/loading manual | `<Skeleton />` / `<SkeletonText />` | `@/components/ui/Skeleton` |
| Paginación manual | `<Pagination />` | `@/components/ui/Pagination` |
| Search + filter manual | `<SearchBar>` + `<FilterPanel>` | `@/components/ui/SearchBar` |
| Currency: `new Intl.NumberFormat(...)` | Formatear con utilidad compartida | Ver abajo |
| Stat cards manuales con icono + valor | `<StatsCard />` | `@/components/ui/StatsCard` |
| Timeline/bitácora manual con fecha sidebar | `<TimelineCard />` | `@/components/ui/TimelineCard` |

### Formateo de Moneda

Estándar obligatorio para mostrar precios/totales (no duplicar en cada vista):

```ts
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
```

Si se repite en 3+ archivos, extraer a `src/lib/formatters.ts`.

## Reglas de Estilos

### PROHIBIDO: CSS inline

**Está prohibido usar `style={{ ... }}` en componentes y vistas**, excepto en casos wherey where:
- `position: fixed` calculado dinámicamente (dropdowns, tooltips, modales)
- `z-index` dinámico
- `width`/`height` en píxeles calculados en runtime

Todo lo demás debe ser **Tailwind CSS en className**.

### Archivos de estilos separados

Cada componente UI en `src/components/ui/` debe seguir este patrón:

```
Componente/
  Componente.tsx       # Lógica + JSX
  Componente.styles.ts # Clases Tailwind extraídas
  index.ts             # Barrel export
```

**Reglas:**
1. Los estilos se definen en `*.styles.ts` como objetos con strings de Tailwind
2. Se importan y aplican via `cn()` (clsx + tailwind-merge)
3. **NUNCA** poner clases Tailwind largas/duplicadas directamente en el JSX del componente
4. Si un patrón de estilo se repite en 3+ componentes, moverlo a `globals.css` como clase global

### globals.css

- Solo tokens `@theme {}`, keyframes, y clases utilitarias globales (`.scrollbar-none`, `.tp-scroll-list`)
- **NO** agregar estilos de componentes específicos aquí
- **NO** modificar los tokens existentes sin verificar que no rompa otros componentes
- Las clases en `@layer components` (`.btn-primary`, `.card`) son legacy — preferir componentes UI

### Scrollbar oculto

Usar SIEMPRE `scrollbar-none` (definido en `globals.css`). **NO** crear clases nuevas como `scrollbar-hide`:

```tsx
<div className="overflow-y-auto scrollbar-none">
```

## cn() Utility

`cn()` está definido en `src/lib/utils.ts` (clsx + tailwind-merge). Importar desde ahí:

```tsx
import { cn } from '@/lib/utils';
```

## Backend (NestJS + Prisma)

### Tech Stack
- **NestJS 11** (API REST en `apps/api/`)
- **Prisma 7** ORM + **PostgreSQL 18** (DB: `svr_erp`, 72 tablas, 71 modelos Prisma)
- Config de Prisma en `apps/api/prisma.config.ts` (defineConfig), NO en `schema.prisma`
- URL de BD en `apps/api/.env`

### Despliegue con proxy — trust proxy y el bloqueo por IP (⚠️ regla del día del despliegue)

El bloqueo por IP de la autenticación usa `req.ip`, que **sin `trust proxy`
es la IP directa de la conexión** (en LAN: la real de cada dispositivo ✓). El
día que exista servidor detrás de nginx: `app.set('trust proxy', 1)` en
`apps/api/src/main.ts` (SOLO el primer salto) y nginx SIEMPRE pisa
`X-Forwarded-For` con `$remote_addr` — sin eso, todos comparten la IP del
proxy (un mal actor bloquea a la oficina entera); con trust proxy abierto, un
atacante suplanta `X-Forwarded-For` y rota IPs falsas para esquivar el
bloqueo por IP. Detalle completo: README "Despliegue con servidor".

### Prisma ORM
- Schema: `apps/api/prisma/schema.prisma` (~2,015 líneas)
- UUIDs para PKs (`@db.Uuid`), snake_case en columnas (`@map`)
- Soft deletes: campo `eliminado_en` / `deletedAt` en tablas principales
- Auditoría: `creado_en`, `actualizado_en`, `creado_por`, `actualizado_por`
- `npx prisma migrate dev` para migraciones, `npx prisma generate` para el cliente

- **Convención de idioma en la BD** (no renombrar lo existente): las tablas de
  DOMINIO/negocio van en español (`reportes_campo`, `registros_asistencia`,
  `trabajadores`…) y las de AUTH/infraestructura en inglés por convención
  histórica (`users`, `sessions`, `refresh_tokens`, `token_blacklist`). Los
  campos nuevos de una tabla SIGUEN LA LENGUA DE SUS VECINOS en esa tabla
  (ej. `numero_empleado` junto a campos en español; `pin_hash` junto a
  `token_hash`). PROHIBIDO renombrar tablas/columnas legadas en masa — es
  deuda cosmética sin beneficio funcional.

### RBAC (Role-Based Access Control)

Sistema de control de acceso completo. **Las permisos controlan acceso a módulos/acciones. Las vistas controlan acceso a rutas del sidebar.**

#### Modelo organizacional vigente (desde `20261112000000_roles_5_puestos_torre`)

**5 roles de negocio + 1 de sistema.** El rol decide qué puede hacer; el
**puesto** (`categorias_puesto`, con columna `torre`) decide quién es y a qué
área pertenece para /reportes — la torre del puesto se escribe en `users.torre`
(alta/edición del puesto) y `users.torre` tiene precedencia sobre `roles.torre`
en todo `/reportes`. Roles consolidados: **Administrativo** (absorbió Encargado
de RRHH) y **Técnico** (absorbió Tecnico Mecanico/Soldador/Diesel/Mantenimiento
— viejos roles desactivados). El detalle completo (roles, puestos, torres y
gráfica) está en el README, sección "Estructura organizacional".

#### ⚠️ Regla dura — Zona horaria: UNA sola fuente (.env)

La zona horaria oficial de la empresa (`America/Mexico_City`, Nayarit Costa
Sur) vive **SOLO en los archivos `.env`** — **PROHIBIDO hardcodearla en
cualquier otro archivo de código**:

- **API** (`apps/api/.env`): `TZ=America/Mexico_City` (+ `TIMEZONE`, que usan
  `hoyEnZona()`/`inicioDelDiaEnZona()` de `common/validacion.ts`).
- **Web** (`apps/web/.env`): `NEXT_PUBLIC_TZ=America/Mexico_City` → la lee
  `APP_TIMEZONE` en `lib/formatters.ts`.

**PROHIBIDO capturar "hoy" con `new Date().toISOString().split('T')[0]`** —
`toISOString()` convierte a UTC y a partir de las 6 p.m. guarda/muestra el
día SIGUIENTE (bug real del 12-nov: registrando a las 11 p.m. se guardó el
13-nov). Usar:

- **API:** `hoyEnZona()` (de `common/validacion.ts`).
- **Web:** `fechaLocalHoy()` (de `lib/formatters.ts`).

Los **comparadores de fecha puros** (ej. `sumarDias` con `T00:00:00Z` sobre
un string `YYYY-MM-DD`) sí son correctos: son aritmética de fechas pura, no
conversión de zona. Lo que prohíbe la regla es capturar "hoy" o mostrar
fechas por UTC.

#### ⚠️ Vigilancia de permisos (regla dura al agregar el permiso #107 y siguientes)

Los permisos son granulares por `(modulo, recurso, accion)` — hoy 106, sin
duplicados. Al agregar uno NUEVO o al construir la Vista B de usuarios/roles:
1. **Verificar duplicados** antes de insertar: no debe existir un permiso que
   haga lo mismo en otro recurso del mismo módulo (invisible al inicio; con
   dos devs se multiplica).
2. Agregarlo al seed de RBAC y al rol correspondiente **en el mismo cambio**
   (nunca "el seed después").
3. Un endpoint nuevo usa **SU permiso propio** — no "pedir prestado" el de
   otra vista, que es como nacen los duplicados.

#### Modelos principales
| Modelo | Descripción |
|--------|-------------|
| `roles` | Roles del sistema (nombre único, nivel jerárquico, `es_sistema` para proteger) |
| `permissions` | Permisos granulares: `(modulo, recurso, accion)` único |
| `vistas` | Rutas del sidebar con `ruta`, `icono`, `orden`, visibilidad |
| `users_roles` | Vincula usuarios ↔ roles (`es_principal`, `asignado_en`) |
| `role_permissions` | Vincula roles ↔ permisos (composite PK: `rol_id` + `permiso_id`) |
| `role_vistas` | Vincula roles ↔ vistas con permisos granulares (`puede_ver`, `puede_crear`, `puede_editar`, `puede_eliminar`, `puede_exportar`) |

#### Seed inicial (en `apps/api/prisma/migrations/20260821000000_seed_rbac/`)
- **1 Rol**: Administrador (nivel 100, `es_sistema`)
- **1 Persona + User**: Carlos SVR (`admin@svr-constructora.com`, hash bcrypt placeholder)
- **96 Permisos**: CRUD + acciones especiales en 6 módulos (dashboard, rrhh, maquinaria, operaciones, comercial, sistema)
- **24 Vistas**: Todas las rutas del sidebar
- **96 role_permissions**: Todos los permisos → Administrador
- **24 role_vistas**: Todas las vistas → Administrador con acceso total

#### Módulos y permisos
| Módulo | Recursos | Permisos |
|--------|----------|----------|
| dashboard | dashboard | ver |
| rrhh | trabajadores, asistencia, nomina | ver, crear, editar, eliminar, exportar, procesar |
| maquinaria | flota, horometro, mantenimiento, combustible, gps | ver, crear, editar, eliminar, exportar, aprobar |
| operaciones | operaciones, reportes_campo, criba, inventario, proyectos | ver, crear, editar, eliminar, exportar |
| comercial | clientes, cotizaciones, finanzas, proveedores, ventas, cobranza | ver, crear, editar, eliminar, exportar, cancelar |
| sistema | documentos, reportes, configuracion, usuarios, roles, permisos | ver, crear, editar, eliminar, asignar_rol, exportar |

### Estándar Obligatorio de Endpoints y Vistas CRUD

**1. Todo endpoint del API debe cumplir los 4 requisitos de seguridad/auditoría**
(documentación completa y patrón de código en `audit-service-guide.md`, sección 0):

1. Token JWT válido (`JwtAuthGuard`)
2. Verificación de blacklist del token (automática vía `JwtStrategy`)
3. Auditoría de operaciones exitosas (`AuditService.log` con `SUCCESS`)
4. Auditoría de fallos de negocio en mutaciones (`result: FAIL` + `error_code`
   antes de lanzar la excepción — patrón `fallir()`)

Un PR con endpoints que incumpla cualquiera de los 4 recibe **Request Changes**.
Referencia viva completa: `apps/api/src/criba/`.

**2. Toda vista nueva con CRUD toma `/inventario` como plantilla base** y la adapta
al dominio — nunca se construye una vista CRUD desde cero:

- `PageHeader` + botón crear (`variant="primary"`)
- `StatsCard`s según las métricas del dominio
- `SearchBar` + botón Filtros + chips activos + panel de filtros
- `DataTable` con columnas del dominio + acciones Editar/Eliminar por RBAC
- `Pagination` (server-side cuando hay API; client-side en fase 1 mock)
- `FormModal` para crear/editar/eliminar con validaciones
- Permisos RBAC vía `useAuth().user.vistas` (`puedeCrear/puedeEditar/puedeEliminar`)

Referencias vivas: `/inventario` (con API), `/criba` y `/proyectos`.

## Testing — Mandatory Rule

**EVERY NEW FUNCTION OR MODULE IMPLEMENTED MUST INCLUDE UNIT TESTS.**

### Backend (NestJS + Jest)

- **Framework**: Jest (ships with `@nestjs/cli`)
- **Location**: `*.spec.ts` files alongside the source file
- **Minimum coverage required**: Services, Controllers, Guards, DTOs
- **Mocking pattern**: Use `@nestjs/testing` `TestingModule` + PrismaService mocks

```bash
npm run test          # Run all tests
npm run test:cov      # Run with coverage report
```

**Unit test structure:**

```ts
// auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  let prisma: {/* mock type */};

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: {/* mock */} },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('login', () => {
    it('should return 401 if email does not exist', async () => {
      // arrange, act, assert
    });
  });
});
```

**Testing rules:**
1. Each public method of a Service must have at least 1 test
2. Each endpoint of a Controller must have at least 1 test
3. Guards must test both `true` and `false` cases
4. DTOs must be validated with `class-validator` in tests
5. Tests must be isolated (no real DB dependency, no dependency on other tests)
6. Use `describe()` to group by method, `it()` for each scenario
7. AAA pattern: **Arrange** (setup), **Act** (execute), **Assert** (verify)

### Integration Tests — Audit Logging

**ANY TEST THAT VERIFIES AUDIT LOGS (`registro_auditoria`) MUST BE AN INTEGRATION TEST.**

Audit records live in PostgreSQL and are immutable (DB trigger blocks DELETE/UPDATE). Unit tests with mocks cannot verify real persistence. Therefore:

- **File**: `*.integration.spec.ts` alongside the source file
- **Run**: `npm run test:integration` (NOT `npm run test`)
- **Config**: `jest.integration.config.js` (separate Jest config with `dotenv/config` + `forceExit: true`)
- **Pattern**: Use `PrismaService` directly (real DB), NO mocks for Prisma/Audit
- **Cleanup**: Delete test data in FK-safe order. Leave `registro_auditoria` records (immutable).
- **Isolation**: Each test uses unique UUIDs or prefixed data to avoid collisions

```ts
// inventario.integration.spec.ts
describe('Inventario Audit (Real DB)', () => {
  let prisma: PrismaService;
  let service: InventarioService;

  beforeAll(async () => {
    // Boot real PrismaService + InventarioService + AuditService
  });

  afterAll(async () => {
    // Cleanup: movimientos, artículos, categorías, proveedores, unidades
    // registro_auditoria is IMMUTABLE — leave records
    await prisma.$disconnect();
  });

  it('debe crear artículo y registrar ARTICULO_CREADO en registro_auditoria', async () => {
    const articulo = await service.create(dto, userId);
    const audit = await prisma.registro_auditoria.findFirst({
      where: { action: 'ARTICULO_CREADO', entity_id: articulo.id },
    });
    expect(audit).not.toBeNull();
    expect(audit!.result).toBe('SUCCESS');
  });
});
```

### Frontend (Jest + React Testing Library) — Coming Soon

When frontend tests are implemented, they will use `@testing-library/react` + `jest`.

### DEUDA ACTIVA — Cero tests frontend (regla para todos los agentes)

**Hoy NO existe infra de tests frontend (jest + RTL no configurados).**
Lo único que funciona de punta a punta es **login y perfil** — **NO se ha
implementado ninguna vista de la aplicación** (las pantallas PWA son
placeholders y las de escritorio son mock). Todo es smoke manual.

- **Regla mientras tanto:** toda vista nueva o módulo migrado de la PWA
  lleva su smoke manual documentado en el registro de
  `historial-cambios/` (tsc + eslint como único gate automático).
- **Cuando se configure la infra (jest + @testing-library/react):**
  toda pantalla nueva de la PWA DEBE llevar tests — los refactors a
  ciegas son lo primero que muerde con dos desarrolladores en paralelo.
- **Prioridad: media-alta** — se activa ANTES de que existan 3+
  pantallas reales (el esqueleto 8/10 decae rápido sin red de seguridad).

## CI/CD (GitHub Actions)

Estado real a 2026-11-18: el repo **sí tiene Actions** (no repetir lo contrario).

| Workflow | Disparadores | Qué hace |
|---|---|---|
| `.github/workflows/ci.yml` | `pull_request` a `main`, `push` a `main`, `workflow_dispatch` | Gates: `npx tsc --noEmit`, `npm run lint` y `npm test -- --runInBand` del web (Jest + RTL); `npm run build` de la API, `npx prisma validate` y `npm run test -- --runInBand` (1417 tests, sin skips). |
| `.github/workflows/build-web.yml` | `push` a `main` que toque web/packages/lockfiles/`Dockerfile`/workflow, más `workflow_dispatch` | Publica el tag por SHA de `ghcr.io/chimigb/svr-erp-web`, hace smoke del contenedor y solo entonces promueve `latest` con `imagetools create` (sin recompilar). El despliegue en Railway es manual. |
| `.github/workflows/integration.yml` | `pull_request` a `main`, `workflow_dispatch` | Tests de integración con Postgres 18 efímero y restore de `svr_erp_export/svr_erp_sin_postgis.sql`; no van en `ci.yml`. |

### Reglas duras

1. Node **26** y npm **11.20.0** en los runners (igual que el Dockerfile y la máquina de desarrollo). `apps/api` está fuera de los workspaces: su `npm ci` corre dentro de `apps/api` con su propio lockfile; el de la raíz instala solo web + shared. Ese `npm ci` **no genera el cliente Prisma** (no hay `postinstall`): el job `api` corre `npx prisma generate` antes de compilar, si no el build muere con `TS2339` sobre los modelos de `PrismaService`. Las actions están fijadas a versiones consultadas con `gh api repos/<owner>/<repo>/tags` (checkout v7.0.1, setup-node v7.1.0, buildx v4.4.1, login v4.8.0, build-push v7.4.0); el runner se deja en `ubuntu-latest` (ya migró a Ubuntu 26).
2. `npx prisma validate` necesita `DATABASE_URL` aunque no abra conexión: en CI se usa un valor dummy. La URL real jamás se escribe en un workflow.
3. `NEXT_PUBLIC_*` se hornea en build time (build-args del Dockerfile): cambiar un `build-arg` del workflow exige nuevo build de imagen, no basta con redeploy. La zona horaria vive solo en `.env` (`NEXT_PUBLIC_TZ` / `TZ`), nunca hardcodeada en Actions.
4. Deploy a Railway: **manual**, sin secretos de GitHub. Checklist: (1) confirmar en el servicio Web que la imagen apunta al tag mutable `:latest` — con un tag por SHA el Redeploy repite la imagen vieja; (2) tomar el SHA y el digest que imprimió `build-web`; (3) entrar al servicio Web → **Redeploy**; (4) verificar que la URL responda y anotar SHA + digest en `historial-cambios/`. El paquete GHCR debe ser público o tener credenciales `read:packages` en Registry Credentials. El smoke de `build-web` corre después de publicar: detecta contenedores que no arrancan, pero no impide publicar la imagen.
5. Los tests de integración van en `integration.yml` (`pull_request` + `workflow_dispatch`), no en `ci.yml`: usan Postgres 18 efímero y restauran `svr_erp_export/svr_erp_sin_postgis.sql` (sin PostGIS; el historial de migraciones fue baselined, `migrate deploy` desde cero no crea las tablas base). El job valida con `npx prisma migrate diff --from-config-datasource --to-schema=prisma/schema.prisma --exit-code` que el dump siga coincidiendo con `schema.prisma` (flags de Prisma 7: `--from-url` ya no existe). Los secretos JWT dummy viven en el `env:` del workflow, no en `jest.integration.config.js`. Para regenerar el dump: `PGPASSWORD` en el entorno + `pwsh apps/api/scripts/regenerar-dump-integracion.ps1` (excluye las 9 tablas efímeras y anonimiza con `apps/api/scripts/anonimizar-dump.cjs`; el repo es público). `registro_auditoria` es inmutable. El workflow tiene `concurrency` con `cancel-in-progress: true` (como `ci.yml`) y `pull_request.branches: [main]`. También se corren en local con `npm run test:integration` y se documentan en `historial-cambios/`.
6. `npm run lint` **sí es gate** desde la Fase 4: 0 errores, 37 warnings preexistentes (no bloquean). Los 10 errores locales se arreglaron de verdad; `react-hooks/set-state-in-effect` sigue desactivado **solo** en las 11 páginas del dashboard que cargan datos al montar (`eslint.config.mjs`), pendiente de migrarlas a caché de datos. Los unitarios de la API corren completos (`npm run test -- --runInBand`); los tests de integración corren en PR y en el disparo manual (regla 5).
7. Todo cambio de workflow requiere autorización explícita, se valida con `git diff --check` y se registra en `historial-cambios/` en el mismo commit. Push y PR siguen siendo solo cuando el usuario lo ordene.
8. El ruleset `Protección main` (id `21267691`) exige los checks `web`, `api` e `integration` en modo estricto desde 2026-11-18. El `bypass_always` de `CHIMIgb` se conserva por decisión explícita del usuario: los push directos del owner siguen saltándose los gates. Verificar con `gh api repos/CHIMIgb/SVR-ERP/rulesets/21267691`.

---

# Guías de desarrollo (web, PWA, componentes y CI/CD)

Esta sección es la **teoría y el criterio**: qué significa cada decisión y por qué. La
aplicación operativa (qué mirar antes de escribir, qué comando correr, cuándo
preguntar) vive en `.opencode/agent/svr-erp.md`. Las reglas duras de arriba siguen
mandando; aquí se explica el modelo mental que las sostiene.

**Nota de vigencia:** el contenido viejo de este archivo («No backend», «Jest
coming soon», `cn()` en `Sidebar.tsx`, raíz `src/`) describe una fase anterior y no
se ha reescrito. La realidad es la de estas guías: API NestJS en `apps/api`, web en
`apps/web/src`, `cn()` en `@/lib/utils`, tests del web en CI.

## 1. Arquitectura web (Next.js 16 App Router)

**Modelo mental.** Un Server Component puede leer datos y renderizar sin enviar JS
al navegador; un Client Component existe solo cuando hay estado, efectos, eventos
o APIs del navegador. La frontera se decide por necesidad, no por costumbre: en
este repo todas las páginas del dashboard son `"use client"` por deuda histórica y
solo los layouts son Server Components. **No mover esa frontera sin autorización**
—migrar una página implica decidir caché, hidratación y carga de datos, no cambiar
una directiva.

**Regla de serialización.** Todo lo que cruza de Server a Client debe ser
serializable: objetos planos, strings, números, booleanos y arrays. Nunca una
instancia de `Date`, un `Decimal` de Prisma, una función ni una entidad con
métodos. La API ya entrega ISO strings y decimales como `number`; no los
conviertas de vuelta en el servidor.

**Las cuatro capas y su responsabilidad:**

| Capa | Dueño de | No debe hacer |
|---|---|---|
| API NestJS (`apps/api/src/<dominio>`) | reglas de negocio, validación, auditoría, transacciones | decidir presentación |
| `apps/web/src/lib/api.ts` | contrato HTTP, tokens, refresh, paginación, mapeo enum | reglas de negocio |
| Vista `(dashboard)/<dominio>/page.tsx` | orquestar carga, filtros, paginación, errores y permisos | reimplementar validaciones ni formatear dinero |
| `components/ui/*` | presentación y estados visuales | hacer fetch ni leer `useAuth` |

**Estado.** El servidor es la fuente de verdad; el `useState` de la vista es
efímero (modal abierto, página, búsqueda, fila seleccionada). No existe store
global de entidades: duplicar un cliente en dos estados garantiza que se
desincronicen. El access token vive en memoria del `apiClient` y desaparece al
recargar; el refresh token en `localStorage` permite recuperarlo.

**Carga y caché.** Hoy las vistas cargan en `useEffect` (de ahí la excepción
`react-hooks/set-state-in-effect` en 11 páginas). `NEXT_PUBLIC_*` se hornea en
build: cambiar la URL de la API o la zona horaria exige reconstruir, no solo
redeploy. Si se introduce `fetch` en un Server Component, hay que declarar
explícitamente la política de caché/revalidación; un `fetch` sin política en un
ERP money-related muestra datos viejos sin avisar.

**Errores por capas.** (1) Red caída → mensaje de conexión del `apiClient`.
(2) Error del contrato → `mensajeErrorApi`, que une `details[]`. (3) Regla de
negocio rechazada → la decide el service y se muestra tal cual. (4) Fallo de
render → boundary de Next. Mezclarlas produce el clásico "Error de validación"
sin decir qué campo falló.

**Hidratación.** `Date.now()`, `Math.random()` o `new Date().toISOString()` en
render producen HTML distinto en servidor y cliente. Para "hoy" usar
`fechaLocalHoy()`; para comparar fechas puras, aritmética sobre `YYYY-MM-DD`.

## 2. Arquitectura PWA

**Topología.** Mismo `apps/web`, dos grupos de rutas hermanos y una capa
compartida:

- `(dashboard)` → `/<dominio>`: escritorio.
- `(pwa)` → `/m/*`: móvil.
- Compartido: `lib/api.ts`, `providers/AuthProvider.tsx`, `components/ui/*`,
  `lib/utils.ts`, `lib/formatters.ts`, `packages/shared`.
- Solo PWA: `lib/pwa/dispositivo.ts`, `lib/pwa/rol-nav.ts`,
  `lib/pwa/offline.ts`, `lib/pwa/sincronizador.ts`, `components/pwa/*`.

Esa división explica la regla de independencia: un cambio en `components/ui/*`
atraviesa ambas apps y exige revisar una vista de cada una; un cambio en
`app/(pwa)` no debe arrastrar al escritorio. Compartir sesión y API es la
**única** excepción permitida, y justamente por eso son archivos propios con
contrato stable.

**Ciclo de vida de una captura (el corazón del offline-first):**

1. El teléfono valida lo mínimo en local y genera una clave de idempotencia
   (UUID propio) que no cambiará en reintentos.
2. Escribe en IndexedDB con `lib/pwa/offline.ts` **antes** de cualquier `fetch`.
   Si la escritura falla, la captura no se pierde: se informa y se reintenta.
3. `lib/pwa/sincronizador.ts` envía la cola al volver señal, con la misma clave.
4. La API responde y el sincronizador marca `enviado` (ACK) o `conflicto`.
   Nunca sobrescribe un dato del servidor por un 409: el conflicto se muestra
   para que el humano decida.
5. La cola se limpia solo con ACK confirmado o al hacer logout. Un error de red
   **nunca** borra un registro pendiente.

Si el endpoint de destino no respeta `idempotencia_key`, el flujo no es
offline-first de verdad: hay que pedir el cambio en backend, no simularlo con
reintentos desde el front.

**Navegación y guard.** `rol-nav.ts` deriva las pestañas de `user.vistas` con
`puedeVer`; el guard del shell redirige a `/m` si se navega por URL directa a una
vista no concedida. `/m/pin-cambio` es ruta auxiliar exenta; `/m/perfil` no es
pestaña (se abre desde el header y está concedida a los 6 roles activos).

**Sesión y dispositivo.** Login por número de empleado + PIN, con fase de backend
propia: no se reutiliza email/password ni se duplica `AuthProvider`. El detector
`lib/pwa/dispositivo.ts` decide el grupo de rutas con umbral `<768px` y recuerda
el interruptor en `localStorage`; las pantallas no implementan su propia
detección. Capacitor compila este mismo bundle a APK: nada de `window` fuera de
efectos.

**Conectividad.** Capturar (asistencia, reporte, inventario) funciona sin señal;
decidir (cerrar corte, aceptar, aprobar) requiere red. El usuario siempre ve
cuántos registros lleva pendientes y cuál fue enviado. Guardar sin feedback es
peor que no guardar: el operario vuelve a capturar y se duplica el trabajo.

## 3. Buenas prácticas — web

**Semántica y accesibilidad.** `<button>` para acciones, `<a>` para navegación,
`<label>` asociado a cada input, `<th scope>` en tablas, foco visible en todo
elemento interactivo y orden de tab lógico. `aria-*` se agrega cuando el HTML
nativo no alcanza, no como sustituto. Un `<div onClick>` sin rol ni teclado es
un bug de accesibilidad, aunque se vea bien.

**Seguridad.** Access token en memoria; refresh en `localStorage`; jamás secretos
en `NEXT_PUBLIC_*` (se hornean y son públicos). La validación ocurre en el API con
`ValidationPipe` y DTOs; ocultar un botón por RBAC es UX, **no** seguridad —el
guard y el permiso en servidor son los que cortan. Nunca `dangerouslySetInnerHTML`
con texto de usuario.

**Rendimiento.** Listados paginados server-side; no traer un catálogo entero en
cada render; `useMemo`/`React.memo` solo cuando se mide un problema. Antes de
culpar al bundle, revisa si la vista hace N+1 llamadas o un `.map()` anidado.

**Consistencia de datos.** `formatCurrency` de shared, `fechaLocalHoy()` en web,
enums mapeados junto al DTO. `new Intl.NumberFormat` duplicado y
`new Date().toISOString().split('T')[0]` son deuda conocida: el segundo además
cambía de día a las 6 p.m.

## 4. Buenas prácticas — PWA

**Contexto real de uso.** Obra, guantes, sol, señal intermitente y una sola mano.
Eso dicta el diseño: contraste alto, fuente grande en datos críticos, targets
≥44px, una acción principal por pantalla y cero gestos ocultos (hover, long
press, swipe) como única vía.

**Offline-first de verdad.** Asumir que la conexión caerá a mitad de envío.
Escribir local primero, reenviar con la misma clave de idempotencia, backoff en
reintentos y conflicto resuelto por humano. Un "guardado" que puede perderse en
un timeout enseña al usuario a desconfiar de la app.

**Batería y datos.** GPS y cámara bajo demanda, nunca en un loop; sincronizar por
eventos (`online`, `focus`, intervalo amplio), no en cada render. Fotos y
coordenadas son datos personales: viven en la cola local solo hasta el ACK y se
limpian al logout. PIN y tokens jamás en logs.

**Feedback.** Pendiente / enviado / conflicto siempre visible. El error se explica
con acción: «Sin señal. Quedó guardado y se enviará solo» antes que «Error 500».
Tras marcar entrada, mostrar hora y obra confirmadas; tras facturar, folio o
"pendiente".

**Prueba mínima en dispositivo:** 320px, 3G, batería baja, rotación y teclado
virtual abierto. Un smoke de escritorio no valida ninguna de esas cinco cosas.

## 5. Código mantenible (web y PWA)

**Una fuente de verdad.** Contratos en `lib/api.ts`, dinero y fechas en
`lib/formatters.ts`/shared, estilos en el kit y tokens de `@theme`. Regla
práctica: dos repeticiones se toleran; la tercera se extrae. Extraer es mover el
código existente con su validación y su manejo de errores, no reescribirlo.

**API de componentes estrecha.** `variant?: 'primary' | 'secondary'` antes que
cinco booleanos; `children` para composición antes que un objeto `config` con
doce opciones; `className` para extensiones. Un componente hace una cosa. Si
crece, se parte —no se le agrega otro `modo`.

**Lógica fuera del JSX.** Obtener datos, transformarlos y decidir estados vive en
hooks; el JSX solo describe la pantalla. La vista dice *qué* se muestra; el hook
sabe *cómo* se obtiene.

**Nombres.** Español en UI, mensajes y comentarios; inglés en identificadores del
stack. Verbo + dominio para acciones (`cargarVentas`, `registrarEntrada`),
`puede...` para permisos, `es...` para bools de estado.

**Deuda explícita.** Un atajo se marca `shortcut: <límite>, <cuándo actualizar>`
y se escribe en el registro del commit. Los refactors "de paso" están prohibidos:
cada cambio tiene un dueño y un motivo verificable.

**Anti-copia antes de crear.** `grep` en `src/components` y `src/lib` antes de un
helper nuevo; `grep` en `lib/api.ts` y `apps/api/src` antes de un endpoint nuevo;
leer `COMPONENTS.md` antes de un componente nuevo. La duplicidad en este repo no
es estética: dos formatos de dinero o dos clientes HTTP divergen en producción.

## 6. Responsividad web

Mobile-first con `sm:`/`md:`/`lg:`/`xl:`. La prueba no es "se ve bien en la
laptop": es 320px, 768px y 1280px con datos reales (nombres largos, montos
grandes, 12 columnas).

- **Tablas:** scroll horizontal dentro del contenedor con `scrollbar-none` y
  ancho mínimo de columnas. No convertir la tabla en tarjetas ad-hoc; si el kit
  tiene variante móvil, se usa.
- **Modales:** `max-h-[90dvh]`, cabecera y pie visibles, cuerpo con scroll,
  formularios de una columna en móvil y dos desde `md:`.
- **Texto:** `break-words` en nombres de persona/obra; nada de
  `whitespace-nowrap` en celdas de dominio; iconos con `shrink-0`.
- **Imágenes y media:** `max-w-full h-auto`, proporción fija para evitar saltos
  de layout al cargar.
- **Teclado virtual:** `dvh` antes que `vh`; el botón de enviar no debe quedar
  debajo del teclado.

La regla #1 del repo (todos los componentes responsive) no tiene excepción: un
componente que se rompe en móvil rompe también el escritorio que lo reutiliza.

## 7. Responsividad PWA

Aquí el teléfono es el **target primario**, no un viewport reducido. "Responsive"
es adaptar una vista de escritorio; una pantalla `/m/*` es una vista nueva con
jerarquía propia. Aprietar la tabla del desktop en el teléfono está prohibido.

- **Estructura:** una columna, tarjetas con 2–3 datos, acción principal al final
  (fija si la pantalla es larga) y acciones secundarias en texto.
- **Zona de pulgar:** acciones destructivas lejos del borde superior; ≥44px de
  alto y separación entre targets; sin depender de hover.
- **Safe areas:** `env(safe-area-inset-*)` en header y nav inferior, aplicado
  desde utilidades/tokens, nunca con `style={{}}` (salvo cálculo en runtime
  permitido por la regla de estilos).
- **Rotación y teclado:** `dvh`, scroll vertical, inputs visibles al enfocar;
  probar landscape con el teclado abierto.
- **Señal:** la UI no asume que el envío fue inmediato; el espacio para
  "pendiente" ya está reservado en el layout.

## 8. UI/UX web

**Jerarquía contractual del ERP:** `PageHeader` con título y acción principal →
`StatsCard`s → búsqueda y filtros → `DataTable` con acciones por RBAC →
`Pagination`. Inventar otro orden rompe el modelo mental del usuario de que
"todas las pantallas funcionan igual".

**Los cuatro estados siempre presentes:** cargando (skeleton del kit), vacío
(`EmptyState` con una acción para crearlo), error (`mensajeErrorApi` + reintentar)
y éxito (dato real). Un "0" durante la carga miente; un bloque en blanco parece
crash; un banner rojo de skeleton simula una alerta inexistente.

**Feedback y consecuencias:** toda mutación termina en toast; las destructivas
piden confirmación; el botón se bloquea con `isSubmitting` mientras envía; el
éxito muestra qué cambió (folio, nombre, monto), no solo "Guardado".

**RBAC visible:** si `puedeCrear` es `false`, no se dibuja el botón; si
`puedeVer` es `false`, la ruta redirige. La coherencia visual es parte de la
seguridad percibida, aunque la autoridad real esté en el servidor.

**Consistencia:** mismos componentes, mismos colores de estado y mismos textos
es-MX. No inventar variantes de `Badge` ni spinners de otro color: si hace falta
una variante nueva, se agrega al kit y se documenta.

## 9. UI/UX PWA

**Una pantalla, una decisión.** Título corto, dato crítico en grande, una acción
principal. Las acciones secundarias existen, pero no compiten visualmente. En
campo, la duda de "¿qué botón presiono?" cuesta un registro duplicado.

**Sincronización como parte de la interfaz.** Contador de pendientes, estado por
registro y una explicación cuando no hay señal. El usuario debe poder cerrar la
app en cualquier momento y saber que su dato sigue ahí.

**Errores accionables y en español.** «Sin señal. Quedó guardado y se enviará
solo»; «La obra ya no está activa. Habla con el residente». Los códigos de error
son para el log, no para la pantalla.

**Accesibilidad bajo campo:** contraste alto (sol), ícono **y** texto para el
estado (no solo color), fuente ≥16px en datos críticos y targets separados con
guantes. `aria-live` para confirmaciones de envío.

## 10. Librería de componentes reutilizables

**Cuándo crear:** el patrón ya aparece en tres vistas, o el kit no tiene
equivalente y el problema es de presentación genérica. **Cuándo NO:** es
específico de un dominio (va junto al dominio, no en `ui/`), arregla un caso
único, o ya existe una variante que cubre el 90% del caso.

**Estructura obligatoria:** `Componente/Componente.tsx` (lógica y JSX),
`Componente.styles.ts` (clases Tailwind en objetos, aplicadas con `cn()`) e
`index.ts` (barrel). Sin `style={{}}` salvo posición/z-index/dimensiones
calculadas en runtime. Tokens en `@theme`; `globals.css` solo para utilitarias
globales y keyframes.

**Contrato de props:** tipos literales para variantes, valores por defecto
sensatos, `className` para extender, `children` para composición. Rechazar props
que solo cambian un color —para eso existe `variant`. Si el componente necesita
saber de RBAC o de la API, no es un componente de UI.

**Documentación no negociable:** en `COMPONENTS.md` (kit `src/components/ui/*`,
compartido escritorio+PWA) o en `COMPONENTS-PWA.md` (componentes de
`src/components/pwa/*`), tabla de props, import, ejemplo de uso, «cuándo
usar» y **«cuándo NO usar»**. Ese último apartado es el que evita que
`Skeleton` se use para un spinner de KPI o que `ModalFooter` se invente a
mano. Un componente sin documentación es deuda desde el día 1.

**Compatibilidad:** cambiar una prop compartida rompe escritorio y PWA a la vez.
Antes, `grep` de todos los callers; después, smoke en una vista de cada app y
`npx tsc --noEmit`. Cuando exista infra de tests frontend, cada variante lleva
un test de render.

## 11. CI/CD, DevOps y pipelines

**Principios.** Todo pasa por PR; los gates cortan antes de publicar; el artefacto
es inmutable (tag por SHA y promoción por digest, **nunca recompilar para
promover**); los secretos viven fuera del repo y nunca se imprimen; local, CI y
Railway son entornos distintos; un despliegue malo se revierte con el digest
anterior, no editando el servidor en caliente.

**Forma del pipeline ideal:**
`lint + typecheck + unit` → `build` → imagen con tag por SHA → smoke del
contenedor → integración con BD efímera → promoción a `:latest` por digest →
deploy manual → verificación de URL → registro de SHA y digest en
`historial-cambios/`. El smoke posterior a publicar detecta contenedores que no
arrancan, pero no impide la publicación: por eso el deploy es un paso consciente.

**Realidad de este repo (no inventar otra):** `ci.yml` (web + API),
`build-web.yml` (imagen y `latest`) e `integration.yml` (Postgres 18 efímero con
dump sin PostGIS). `apps/api` está fuera de los workspaces: `npm ci` propio y
`npx prisma generate` antes de compilar. `prisma validate` necesita un
`DATABASE_URL` dummy. `NEXT_PUBLIC_*` se hornea en build. `concurrency`
cancela runs obsoletos. El ruleset exige `web`, `api` e `integration`.

**Diagnóstico.** Separar siempre dos causas: falló el código o falló el entorno.
`TS2339` sobre `prisma.*` = falta generar el cliente; `Blocked cross-origin` =
CORS/origen equivocado; `migrate` desde cero = el historial fue baselined, hay
que restaurar el dump; diff de schema = usar `migrate diff --from-config-datasource`
(Prisma 7 ya no tiene `--from-url`). Reproducir local con los mismos comandos
antes de proponer un arreglo.

**Seguridad.** GitGuardian puede marcar passwords dummy del contenedor de CI
(como `POSTGRES_PASSWORD: postgres` en `integration.yml:31`, incidente
35200378): investigar qué archivo cambió el PR y decidir con evidencia, sin
"arreglar" secretos de prueba por reflejo. Nunca editar workflows, secretos ni
variables de GitHub/Railway sin autorización explícita; validar con
`git diff --check`; documentar todo cambio de CI/CD aquí, en el agente y en
`historial-cambios/` **en el mismo commit**.
