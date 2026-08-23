# DECISIONS.md — SVR-ERP

Registro de decisiones arquitectónicas y técnicas clave del proyecto.

---

## 1. Prisma 7 con Driver Adapter

**Fecha:** Agosto 2026
**Estado:** Activo

**Decisión:** Usar `@prisma/adapter-pg` (PrismaPg) como driver adapter en lugar del driver nativo de Prisma.

**Por qué:**
- Prisma 7 requiere explícitamente un driver adapter para PostgreSQL
- El driver nativo de Prisma fue reemplazado por esta arquitectura modular
- Permite mayor control sobre la conexión (pool de conexiones, configuración del driver)

**Implementación:**
```typescript
// apps/api/src/prisma/prisma.service.ts
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
super({ adapter });
```

**Trade-off:** Adds `pg` and `@prisma/adapter-pg` as explicit dependencies, but provides better control.

---

## 2. JWT Stateless con Refresh Tokens

**Fecha:** Agosto 2026
**Estado:** Activo

**Decisión:** Autenticación stateless usando JWT con Access Tokens (15min) y Refresh Tokens (7d).

**Por qué:**
- Compatibilidad nativa con Capacitor/Mobile (sin cookies)
- Stateless = sin sesiones en servidor = más escalable
- Refresh tokens permiten mantener al usuario autenticado sin re-login frecuente
- Patrón estándar para APIs REST modernas

**Configuración:**
```
ACCESS_TOKEN_EXPIRY = '15m'
REFRESH_TOKEN_EXPIRY = '7d'
SALT_ROUNDS = 12 (bcrypt)
```

**Trade-off:** More complex than cookie-based sessions, but required for mobile/Capacitor compatibility.

---

## 3. RBAC de 2 Capas (Permisos + Vistas)

**Fecha:** Agosto 2026
**Estado:** Activo

**Decisión:** Sistema de control de acceso en 2 capas:
1. **Permisos API** (`role_permissions`): `modulo.recurso.accion` → controla endpoints
2. **Vistas UI** (`role_vistas`): `puede_ver/crear/editar/eliminar/exportar` → controla sidebar + botones

**Por qué:**
- Separación clara entre lo que el usuario PUEDE VER (UI) y lo que PUEDE HACER (API)
- Frontend muestra/oculta elementos según `role_vistas`
- Backend valida permisos reales en cada endpoint con `@RequirePermission()`
- Permisos se acumulan entre roles (OR logic)

**Tablas principales:**
- `roles`: Roles del sistema (nivel jerárquico, `es_sistema` para proteger)
- `permissions`: Permisos granulares `(modulo, recurso, accion)` único
- `vistas`: Rutas del sidebar con `ruta`, `icono`, `orden`
- `role_permissions`: Vincula roles ↔ permisos
- `role_vistas`: Vincula roles ↔ vistas con permisos granulares

**Trade-off:** More tables and queries than a simple `role` field, but provides enterprise-grade access control.

---

## 4. Soft Deletes en Todo el ERP

**Fecha:** Agosto 2026
**Estado:** Activo

**Decisión:** Nunca borrar registros físicamente. Usar campo `eliminado_en` / `deletedAt` para soft deletes.

**Por qué:**
- Requisito de sistemas contables/erp: auditabilidad completa
- Permite recuperar datos eliminados por error
- Histórico de cambios para auditoría
- Cumplimiento con normativas fiscales

**Implementación:**
- Campo `eliminado_en` en tablas principales
- Queries por defecto filtran registros no eliminados
- Hard delete solo con permisos especiales y justificación

**Trade-off:** Requires more complex queries (filtering deletedAt), but essential for ERP compliance.

---

## 5. Auditoría Centralizada

**Fecha:** Agosto 2026
**Estado:** Activo

**Decisión:** Tabla `bitacora_auditoria` que registra TODAS las operaciones (éxito y fallo).

**Por qué:**
- Rastreo de quién hizo qué y cuándo
- Valores anteriores en UPDATE/DELETE para rollback
- Detección de actividades sospechosas
- Cumplimiento con auditorías externas

**Campos principales:**
- `user_id`, `ip_address`, `accion`, `tabla`, `registro_id`
- `valores_anteriores`, `valores_nuevos` (JSON)
- `resultado` (éxito/fallo), `mensaje_error`
- `metadata` (JSON adicional)

**Implementación:**
- Backend: `AuditService.registrar()` en cada operación
- Frontend: Toast de feedback + refresh de datos

**Trade-off:** Adds database writes for every operation, but provides complete audit trail.

---

## 6. Rate Limiting con 3 Niveles

**Fecha:** Agosto 2026
**Estado:** Activo

**Decisión:** 3 niveles de rate limiting configurables + bloqueo por IP.

**Configuración:**
| Nivel | TTL | Límite | Uso |
|-------|-----|--------|-----|
| `short` | 15min | 5 requests | Login, Register |
| `medium` | 15min | 30 requests | Refresh, operaciones normales |
| `long` | 1min | 60 requests | Default global |

**Por qué:**
- Protección contra brute force (login)
- Prevención de abuso de API
- Configurable por variable de entorno (`BLOQUEO_IP_*`)

**Bloqueo escalonado:**
- Primer bloqueo: 5 minutos
- Segundo: 15 minutos
- Tercero+: 60 minutos
- Bloqueo por IP: configurable (default 10 intentos → 15min → 60min bloqueo)

**Trade-off:** Adds complexity, but essential for production security.

---

## 7. CORS Dinámico con FRONTEND_URL

**Fecha:** Agosto 2026
**Estado:** Activo

**Decisión:** CORS configurable mediante variable de entorno `FRONTEND_URL` + `CORS_ORIGINS` opcional.

**Por qué:**
- Desarrollo local: `http://localhost:3000`
- Producción: URL real del frontend
- `CORS_ORIGINS` permite múltiples orígenes (ej: `localhost` + dominio real)

**Implementación:**
```typescript
// apps/api/src/main.ts
app.enableCors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origen no permitido: ${origin}`));
    }
  },
  credentials: true,
});
```

**Trade-off:** Dynamic callback adds complexity, but provides flexibility across environments.

---

## 8. Tailwind CSS v4 con @theme

**Fecha:** Agosto 2026
**Estado:** Activo

**Decisión:** Usar Tailwind CSS v4 con configuración via `@theme {}` en `globals.css` (NO `tailwind.config.ts`).

**Por qué:**
- Tailwind v4 es CSS-first: toda la configuración vive en CSS
- `tailwind.config.ts` es código muerto en v4
- Tokens personalizados: colores (primary, secondary, sidebar), fuentes (sans, display), radios (lg, xl, 2xl)
- Keyframes: `slideInRight` (toasts), `fadeScaleIn` (modals)

**Reglas:**
- NUNCA editar `tailwind.config.ts` (es legacy v3)
- Personalizar via `@theme {}` en `globals.css`
- Usar `cn()` (clsx + tailwind-merge) para clases condicionales

**Trade-off:** Migration from v3 to v4 requires learning new patterns, but provides better DX.

---

## 9. Componentes UI con Patrón de Archivos

**Fecha:** Agosto 2026
**Estado:** Activo

**Decisión:** Cada componente UI sigue la estructura:
```
Componente/
  Componente.tsx       # Lógica + JSX
  Componente.styles.ts # Clases Tailwind extraídas
  index.ts             # Barrel export
```

**Por qué:**
- Separación de concerns: estilos vs lógica
- Reutilización de estilos entre componentes
- Fácil de mantener y escalar
- `cn()` para combinar estilos sin conflictos

**Componentes clave:**
- `PageHeader`: Títulos de página (24 módulos)
- `StatsCard`: Tarjetas de métricas
- `DataTable`: Tablas con sort, paginación, loading states
- `SearchBar`: Búsqueda + filtros
- `Badge`: Estados con variantes de color
- `Modal`: Modales centralizados (reemplaza ConfirmDialog)

**Trade-off:** More files per component, but better maintainability at scale.

---

## 10. Monorepo con Packages Compartidos

**Fecha:** Agosto 2026
**Estado:** Activo

**Decisión:** Monorepo con `apps/api` (NestJS) + `apps/web` (Next.js) + `packages/shared`.

**Por qué:**
- Tipos compartidos entre frontend y backend
- Utilidades compartidas (`formatCurrency`, etc.)
- Constantes compartidas (enums, permisos)
- Cambios atómicos en un solo commit

**Estructura:**
```
apps/
  api/     → NestJS (Backend)
  web/     → Next.js (Frontend)
packages/
  shared/  → Tipos, utilidades, constantes
```

**Path aliases:**
- `@/*` → `./src/*` (web)
- `@svr-erp/shared` → `../../packages/shared/src`

**Trade-off:** More complex build setup, but eliminates code duplication.

---

## 11. Frontend como SPA con Capacitor

**Fecha:** Agosto 2026
**Estado:** Planificado

**Decisión:** Next.js con `output: 'export'` para empaquetar como SPA con Capacitor (mobile).

**Por qué:**
- Una sola base de código para web y mobile
- Capacitor empaqueta la SPA como app nativa
- Sin SSR/SSG: todo el fetching es client-side
- Compatibilidad con JWT stateless

**Implicaciones:**
- Uso intensivo de `"use client"` en páginas
- React Query/SWR para data fetching
- Sin Server Components en páginas (solo en layouts)
- Sin `next/image` optimizado (Capacitor maneja imágenes)

**Trade-off:** Lose Next.js SSR benefits, but gain mobile deployment via Capacitor.

---

## 12. Idioma: Español de México

**Fecha:** Agosto 2026
**Estado:** Activo

**Decisión:** Toda la UI, datos mock, y documentación en español mexicano.

**Por qué:**
- Sistema para empresa constructora mexicana
- Usuarios finales hablan español
- Sin necesidad de i18n (por ahora)
- Locale hardcoded: `es-MX` / `MXN`

**Términos clave:**
- Pantalla (no "página")
- Modal (no "diálogo")
- Base de datos (no "database")
- Bodega (no "almacén")
- Plataforma (no "sistema")

**Trade-off:** Limits internationalization, but simplifies development for a single-market product.

---

## 13. Puerto API: 3001

**Fecha:** Agosto 2026
**Estado:** Activo

**Decisión:** API en puerto `3001`, Frontend en puerto `3000`.

**Por qué:**
- Evita conflictos con otros servicios
- Next.js usa `3000` por defecto
- NestJS usa `3001` para distinguir claramente
- `0.0.0.0` para accesible desde red local

**Regla:** NUNCA compartir puertos entre servicios.

**Trade-off:** None — standard practice for monorepo development.

---

## 14. Testing Obligatorio

**Fecha:** Agosto 2026
**Estado:** Activo

**Decisión:** TODO nuevo módulo/función DEBE incluir unit tests.

**Por qué:**
- Calidad de código garantizada
- Detección temprana de bugs
- Refactorización segura
- Cumplimiento con AGENTS.md

**Backend (NestJS + Jest):**
- Services, Controllers, Guards, DTOs
- Mocking con `@nestjs/testing` + `jest.fn()`
- AAA pattern: Arrange, Act, Assert
- `*.spec.ts` junto al archivo fuente

**Frontend (Jest + React Testing Library):** Próximamente

**Trade-off:** More time upfront, but saves debugging time later.

---

## 15. Sin Multi-tenancy

**Fecha:** Agosto 2026
**Estado:** Activo

**Decisión:** Sistema para empresa constructora única (SVR Constructora). No multi-tenant.

**Por qué:**
- Empresa única, no SaaS
- No necesidad de aislamiento de datos por tenant
- Simplifica modelo de datos (sin `tenant_id` en cada tabla)
- Reduce complejidad de queries

**Trade-off:** Limits future SaaS pivot, but simplifies current development significantly.

---

## 16. UUIDs para Llaves Primarias

**Fecha:** Agosto 2026
**Estado:** Activo

**Decisión:** Usar UUIDs (`@db.Uuid`) para todas las llaves primarias.

**Por qué:**
- Seguridad: no exponer IDs secuenciales (ataques de enumeración)
- Distribución: generable sin coordinator
- Compatibilidad: estándar en PostgreSQL
- Auditoría: únicos globalmente

**Generación:** `randomUUID()` de Node.js (crypto)

**Trade-off:** Larger storage than integers, but better security and distribution.

---

## 17. Datos Mock en Frontend

**Fecha:** Agosto 2026
**Estado:** Temporal (migración en progreso)

**Decisión:** Frontend usa datos mock de `data.ts` hasta que el backend esté listo.

**Por qué:**
- Permite desarrollo frontend independiente
- No bloquea UI por falta de API
- Fácil de reemplazar con llamadas reales

**Plan de migración:**
1. Crear endpoints NestJS por módulo
2. Reemplazar importaciones de `data.ts` por `fetch()` + React Query
3. Eliminar `data.ts` gradualmente

**Trade-off:** Technical debt, but enables parallel frontend/backend development.

---

## 18. Iconos: Lucide React (Importación Individual)

**Fecha:** Agosto 2026
**Estado:** Activo

**Decisión:** Importar iconos individualmente de `lucide-react`, nunca barrel import.

**Por qué:**
- Tree-shaking: solo se importan los iconos usados
- Reduce bundle size
- Mejor performance de build
- Patrón estándar en React moderno

**Ejemplo:**
```typescript
// ✅ Correcto
import { Package, AlertTriangle } from 'lucide-react';

// ❌ Incorrecto
import * as Icons from 'lucide-react';
```

**Trade-off:** None — pure improvement.

---

## 19. Moneda: formatCurrency() Compartido

**Fecha:** Agosto 2026
**Estado:** Activo

**Decisión:** Utilidad `formatCurrency()` en `packages/shared` para formateo de moneda.

**Por qué:**
- Consistencia en toda la aplicación
- Locale hardcoded: `es-MX` / `MXN`
- Evita duplicación en 17+ archivos
- Fácil de mantener y actualizar

**Implementación:**
```typescript
// packages/shared/src/utils/currency.ts
export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
```

**Trade-off:** None — pure improvement.

---

## 20. Nota sobre Engram

**Fecha:** Agosto 2026
**Estado:** Rechazado

**Decisión:** NO instalar Engram (memoria persistente para agentes de IA).

**Por qué:**
- Ya tenemos documentación superior: AGENTS.md, COMPONENTS.md, RBAC.md, PLAN-VISTAS.md
- Context summary se actualiza cada sesión
- Engram agrega dependencia innecesaria (binario Go, SQLite)
- Para un solo desarrollador es overkill

**Alternativa recomendada:**
- Mantener AGENTS.md actualizado (es el "cerebro" del proyecto)
- Usar context summary (ya funciona)
- Crear DECISIONS.md (este archivo) para decisiones arquitectónicas

**Trade-off:** None — saved complexity and dependencies.

---

## Referencia Rápida

| Decisión | Estado | Archivo Clave |
|----------|--------|---------------|
| Prisma 7 + Driver Adapter | Activo | `apps/api/src/prisma/prisma.service.ts` |
| JWT Stateless | Activo | `apps/api/src/auth/auth.service.ts` |
| RBAC 2 Capas | Activo | `apps/api/prisma/schema.prisma` (role_permissions, role_vistas) |
| Soft Deletes | Activo | `apps/api/prisma/schema.prisma` (eliminado_en) |
| Auditoría | Activo | `apps/api/src/audit/audit.service.ts` |
| Rate Limiting | Activo | `apps/api/src/app.module.ts` |
| CORS Dinámico | Activo | `apps/api/src/main.ts` |
| Tailwind v4 | Activo | `apps/web/src/app/globals.css` |
| Componentes UI | Activo | `apps/web/src/components/ui/` |
| Monorepo | Activo | `packages/shared/` |
| Capacitor | Planificado | `apps/web/next.config.ts` |
| Español MX | Activo | Hardcoded |
| Puerto 3001 | Activo | `apps/api/.env` |
| Testing | Activo | `*.spec.ts` |
| Sin Multi-tenancy | Activo | N/A |
| UUIDs | Activo | `apps/api/prisma/schema.prisma` |
| Datos Mock | Temporal | `apps/web/src/lib/data.ts` |
| Lucide React | Activo | `apps/web/src/components/` |
| formatCurrency | Activo | `packages/shared/src/utils/currency.ts` |
| Engram | Rechazado | N/A |
