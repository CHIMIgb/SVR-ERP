# Plan de Implementación — Backend `/clientes`

## 1. Resumen del Requerimiento

La vista `/clientes` del ERP aún es 100% mock (`@/lib/data` → `clientes`,`cotizaciones`),
sin backend ni `clientesApi`. Se construye el **módulo NestJS de clientes** completo
(CRUD + stats + auditoría + RBAC), siguiendo la referencia viva `apps/api/src/criba/`
y los 4 checkpoints obligatorios del `audit-service-guide.md`.

## 2. Impacto Backend

### 2.1 Prisma (`schema.prisma`)
- El modelo `clientes` **ya existe** (líneas 265–290) y está completo:
  `id, codigo?, nombre, empresa, correo, telefono, activo, creado_en, actualizado_en,
  creado_por?, actualizado_por?, direccion_fiscal?, eliminado_en?, rfc?`.
- **Único cambio de schema**: añadir 3 valores al enum `AuditAction`:
  `CLIENTE_CREADO`, `CLIENTE_ACTUALIZADO`, `CLIENTE_ELIMINADO`.

### 2.2 Migración
Nueva migración `20260903000000_clientes_auditoria/migration.sql`:
```sql
ALTER TYPE "AuditAction" ADD VALUE 'CLIENTE_CREADO';
ALTER TYPE "AuditAction" ADD VALUE 'CLIENTE_ACTUALIZADO';
ALTER TYPE "AuditAction" ADD VALUE 'CLIENTE_ELIMINADO';
```
**No** se crean permisos/vista: el seed RBAC (`20260821000000_seed_rbac`) ya contiene
`comercial.clientes.{ver,crear,editar,eliminar}` y la vista `/clientes` (icono Building2,
orden 40). Aplicar con `npx prisma db execute --file <migration>` (el `prisma migrate dev`
está roto) + `npx prisma generate`.

### 2.3 Módulos NestJS nuevos (`apps/api/src/clientes/`)
| Archivo | Contenido |
|---------|-----------|
| `dto/create-cliente.dto.ts` | nombre, empresa, correo, telefono (obligatorios); rfc, direccionFiscal opcionales |
| `dto/update-cliente.dto.ts` | todos opcionales |
| `dto/query-clientes.dto.ts` | search, page, limit |
| `clientes.service.ts` | CRUD + `findStats()` + auditoría SUCCESS/FAIL + helper `fallir()` |
| `clientes.controller.ts` | GET/POST/PATCH/DELETE con `@RequirePermission('comercial','clientes',...)` |
| `clientes.module.ts` | imports PrismaModule + AuditModule |
| `clientes.service.spec.ts` | tests unitarios del servicio |
| `clientes.controller.spec.ts` | tests unitarios del controlador |
| `clientes.integration.spec.ts` | prueba real de auditoría en `registro_auditoria` |

Registrar `ClientesModule` en `apps/api/src/app.module.ts` (imports).

### 2.4 Endpoints
- `GET  /clientes` — listar (búsqueda + paginación) — `comercial.clientes.ver`
- `GET  /clientes/stats` — totales para tarjetas — `ver`
- `GET  /clientes/:id` — detalle — `ver`
- `POST /clientes` — crear — `crear`
- `PATCH /clientes/:id` — actualizar — `editar`
- `DELETE /clientes/:id` — soft delete — `eliminar`

Los 4 checkpoints: `JwtAuthGuard` + `PermissionsGuard` (blacklist automática vía
`JwtStrategy`), auditoría `SUCCESS` y auditoría de fallos con `error_code` (`fallir()`).

## 3. Impacto Frontend

- `apps/web/src/lib/api.ts`: crear `clientesApi` (plantilla `inventarioApi`) +
  tipos `ClienteDTO`, `ClienteCreateInput`, `ClientesStats`.
- `apps/web/src/app/(dashboard)/clientes/page.tsx`: reemplazar mock por `clientesApi`;
  adaptar stats (el campo mock `obrasActivas` no existe en BD → derivarlo de `proyectos`
  activos o simplificarlo en las tarjetas).
- Mantener botones **Ver**, **Historial**, **Nueva Cotización**, **Editar/Eliminar**.

## 4. Validación y Riesgos

- **`obrasActivas` no es campo de BD**: se deriva. En stats usar `totalClientes` +
  `clientesActivos` (y opcionalmente contar proyectos activos). La vista adapta sus
  tarjetas/badges.
- **Hidratación**: la vista ya es `"use client"`, no hay problema de Server Components.
- **Seguridad**: el controlador aplica `@UseGuards(JwtAuthGuard, PermissionsGuard)` y
  `@RequirePermission` por endpoint. Los `actualizado_por`/`creado_por` caen del JWT.
- **Migración del enum**: se aplica vía `db execute` (no `migrate dev`); requiere
  `prisma generate` después.

## 5. Estado
- [x] Migración + schema
- [x] DTOs
- [x] Service + Controller + Module
- [x] Registro en app.module.ts
- [x] Tests unitarios + integración
- [x] Prisma db execute + generate + tsc
- [x] Frontend: clientesApi + conexión
