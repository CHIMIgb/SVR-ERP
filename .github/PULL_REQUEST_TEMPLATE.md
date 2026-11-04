<!--
Este template se aplica automáticamente al abrir un PR. Llenalo con lo que
realmente aplica al cambio; borra las secciones que no corresponden.
-->

## Resumen

**Qué cambia:**
<!-- 2–3 líneas describiendo el cambio. Si el título del PR ya lo dice claramente, acá va el "por qué". -->

**Issue relacionado:** Closes #
<!-- Obligatorio si el PR atiende un issue. Usa `Closes #NNN` para cierre automático. -->

**Documentación impactada:**
<!-- Marca y actualiza si corresponde: `AGENTS.md`, `DECISIONS.md`, `RBAC.md`, `COMPONENTS.md`, `workflow/*.md`, `IMPLEMENTACIONES-A-FUTURO.md` -->

## Tipo de cambio

- [ ] Bugfix
- [ ] Feature
- [ ] Refactor
- [ ] Documentación
- [ ] Tests
- [ ] Migración / data migration

## Checklist general

- [ ] La base del PR es `main` (branch por defecto del repo).
- [ ] Título refleja el contenido real (no scope creep), en español, estilo del repo: `fix(api): ... (contexto/fase/incidente)`.
- [ ] El diff NO incluye `node_modules/`, `dist/`, `.next/`, `*.tsbuildinfo`, `.env`, migraciones de BD de datos, ni archivos generados.
- [ ] No hay credenciales, tokens, passwords, API keys ni datos reales en el diff.
- [ ] Dependencias: no se agregaron paquetes nuevos, o se justificó en el Resumen y se instalaron dentro del paquete correspondiente (`apps/web` o `apps/api`).

## Frontend (`apps/web`)

- [ ] Responsive en los break puntos de Tailwind (móvil → desktop): tablas con scroll horizontal, modales que caben en pantallas pequeñas, formularios apilados.
- [ ] Re-usa componentes de `@/components/ui/*` (nada re-implementado).
- [ ] Sin CSS inline (`style={{}}`) fuera de posición/z-index/dimensiones calculadas en runtime.
- [ ] Componente nuevo documentado en `COMPONENTS.md` (props, uso, cuándo usar / no usar).
- [ ] Sin `.map()` con `key` duplicada.
- [ ] Moneda con el `formatCurrency` compartido (no `new Intl.NumberFormat` duplicado).

## Backend (`apps/api`)

- [ ] El endpoint cumple los **4 requisitos de seguridad/auditoría** (`audit-service-guide.md`): JWT → blacklist → auditoría `SUCCESS` → auditoría `FAIL` con `error_code` en mutaciones antes de lanzar.
- [ ] Vista CRUD nueva: tomada de la plantilla `/inventario` y acciones por RBAC (`useAuth().user.vistas`).
- [ ] Permisos/vistas registradas si abriste recurso nuevo (ver `RBAC.md`).

## Tests y validación

- [ ] `npx tsc --noEmit` verde en `apps/web`.
- [ ] `npm run test` verde en `apps/api` (unitarios). Tests nuevos cubren el camino crítico **y** al menos un error path (400/403/404/409 según aplique), no solo happy-path.
- [ ] Si el cambio toca `registro_auditoria`: `npm run test:integration` verde (Prisma real, sin mocks de auditoría).
- [ ] Guard nuevo/existente: probado en camino válido e inválido.

## Base de datos (solo si aplica)

- [ ] Migración generada con `npx prisma migrate dev --name <nombre>` (dentro de `apps/api/`); `npx prisma validate` pasa.
- [ ] `npx prisma generate` ejecutado y el cliente regenerado commitea `package-lock.json` si correspondió.
- [ ] La migración NO asume PostGIS (instalación local no lo tiene en todos los equipos).
- [ ] Seed data va en migraciones `seed_*` idempotentes (`ON CONFLICT DO NOTHING` / `IF NOT EXISTS`).
