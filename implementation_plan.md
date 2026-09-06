# Plan de Implementación — Backend /cobranza (cuentas por cobrar, cobros, integración finanzas)

## 1. Resumen del Requerimiento

La vista `/cobranza` quedó reconstruida en el frontend (commit `e192e61c`) con 3 tabs
(Cuentas por cobrar, Movimientos de cobro, Vencimientos), stats, filtros, paginación,
modal de registrar cobro y ledger por cuenta. Actualmente es **fase 1 mock**: no existe
módulo NestJS ni endpoints para `cuentas_por_cobrar` ni `pagos`. Este plan cubre el
backend completo para persistir la cartera y los cobros, cerrar el círculo con
`/finanzas` (transacciones de ingreso) y dejar contratos listos para los flujos futuros
de Operaciones y Comercial.

Cadena de valor objetivo: **cliente → cotización → venta/factura → cuenta por cobrar →
cobro (pago) → ingreso en finanzas**, más el cargo por renta de maquinaria vía
`bitacora_id`.

## 2. Impacto Backend

### 2.1 Schema Prisma — migración aditiva `cobranza_pagos_y_auditoria`

```prisma
// 1. pagos → vínculo directo a la CxC (hoy solo tiene factura_id)
model pagos {
  cuenta_por_cobrar_id String?              @db.Uuid
  cuentas_por_cobrar   cuentas_por_cobrar?  @relation(fields: [cuenta_por_cobrar_id], references: [id])
  @@index([cuenta_por_cobrar_id])
  @@index([cliente_id, fecha_pago])
}

// 2. Enum AuditAction — acciones nuevas
//    CXC_CREADA, CXC_ACTUALIZADA, CXC_CONSULTADA, CXC_CON_PAGOS (FAIL),
//    COBRO_EXCEDE_SALDO (FAIL), COBRO_REGISTRADO, COBRO_REVERTIDO
```

- Severidades en `audit.constants.ts`: INFO para consultas/creación, WARNING para
  reversiones, ERROR no aplica (los FAIL usan `error_code`).
- ✋ **Entorno**: `prisma migrate dev` no funciona (shadow DB falla aplicando el seed
  RBAC). Flujo manual probado en proveedores: `prisma migrate diff --from-config-datasource
  --to-schema prisma/schema.prisma --script` → `prisma db execute --file <migración.sql>`
  → INSERT en `_prisma_migrations` (checksum sha256, `applied_steps_count` 1) →
  `prisma generate`.

### 2.2 Módulo NestJS `apps/api/src/cobranza/`

```
cobranza/
  dto/
    crear-cuenta.dto.ts        # clienteId, facturaId?, bitacoraId?, monto, fechaVencimiento?
    actualizar-cuenta.dto.ts   # monto?, fechaVencimiento?
    registrar-cobro.dto.ts     # monto, fechaPago?, metodoPago, referencia?
    listar-cuentas.query.ts    # estado?, situacion?, clienteId?, search?, page?, limit?
  cobranza.module.ts
  cobranza.controller.ts
  cobranza.service.ts
  cobranza.service.spec.ts
  cobranza.controller.spec.ts
  cobranza.integration.spec.ts
```

### 2.3 Endpoints (referencia viva: módulo `proveedores`)

| Método | Ruta | Permiso (módulo `cobranza`) | Acción |
|--------|------|------------------------------|--------|
| GET | `/api/cobranza` | `ver` | Lista paginada con filtros (estado, situación, cliente, búsqueda) |
| GET | `/api/cobranza/stats` | `ver` | totalPorCobrar, vencido, cobradoMes, clientesConSaldo |
| GET | `/api/cobranza/:id` | `ver` | Detalle CxC (cliente + factura + últimos pagos) |
| POST | `/api/cobranza` | `crear` | Crear CxC (manual, o desde `factura_id`/`bitacora_id`) |
| PATCH | `/api/cobranza/:id` | `editar` | Editar monto/vencimiento (prohibido si hay pagos → `fallir()` CXC_CON_PAGOS) |
| POST | `/api/cobranza/:id/cobros` | `crear` | **Registrar cobro** (transacción multi-tabla) |
| GET | `/api/cobranza/:id/cobros` | `ver` | Ledger de movimientos por cuenta |
| GET | `/api/cobranza/exportar` | `exportar` | CSV de la cartera (mismo shape que el frontend) |

**No hay DELETE**: en contabilidad no se borran cobros y el RBAC de `cobranza` no
incluye permiso de eliminar. La reversión futura usa `editar`.

### 2.4 Registrar cobro — transacción crítica

```
prisma.$transaction([
  1. Validar saldo: monto ≤ (monto - monto_pagado) → si no: fallir() COBRO_EXCEDE_SALDO
  2. Crear pagos (código secuencial PAG-XXXX, metodoPago, referencia, cuenta_por_cobrar_id)
  3. Actualizar cuentas_por_cobrar: monto_pagado += monto
     estado: PENDIENTE → PARCIAL → SALDADO (saldo 0)
  4. Crear transacciones (finanzas): tipo INGRESO, categoria "COBRANZA",
     entidad_tipo = 'COBRO', entidad_id = pago.id   ← cierra el círculo en /finanzas
  5. AuditService.log(SUCCESS, COBRO_REGISTRADO, metadata con monto)
])
```

La tabla `transacciones` ya tiene `entidad_id`/`entidad_tipo` genéricos (vista previa
de `finanzas`) — no requiere migración.

### 2.5 Estándar obligatorio (AGENTS.md) en cada endpoint

1. `JwtAuthGuard` + `PermissionsGuard` con `@RequirePermission('cobranza', 'ver'|'crear'|'editar'|'exportar')`.
2. Blacklist de token automática (JwtStrategy → `token_blacklist` por `jti`).
3. Auditoría SUCCESS en todas las mutaciones (`AuditService.log`).
4. Patrón `fallir()` en fallos de negocio con `result: 'FAIL'` + `error_code`
   (COBRO_EXCEDE_SALDO, CXC_CERRADA, CXC_CON_PAGOS) antes de lanzar la excepción.
5. Soft deletes: `activo = false`, nunca `delete` físico.
6. DTOs estrictos `class-validator` (`@IsUUID()`, `@IsPositive()`, `@Max(…)`).
7. `AuditContextInterceptor` ya captura metadata/IP/session por HTTP (blindaje commiteado).

### 2.6 Stats (para las 4 StatsCard del frontend)

```
totalPorCobrar   = SUM(saldo) de CxC activas
vencido          = SUM(saldo) donde fecha_vencimiento < hoy
cobradoMes       = SUM(pagos.fecha_pago) dentro del mes actual
clientesConSaldo = COUNT(DISTINCT cliente_id con saldo > 0)
```

### 2.7 Seed `apps/api/scripts/seed-cobranza.ts`

- ~8 cuentas por cobrar ligadas a clientes del seed (variedad PENDIENTE/PARCIAL/SALDADO,
  vencidas y al corriente).
- ~15 pagos con `cuenta_por_cobrar_id` correcto + transacciones INGRESO espejo
  (para que `/finanzas` ya las vea).
- Idempotente (upsert por folio/código), fuente `SYSTEM` en auditoría
  (patrón `scripts/seed-proveedores.ts`).

## 3. Impacto Frontend (conexión final)

Cuando el backend exista, en `apps/web/src/lib/api.ts` se sustituye el bloque de tipos
por el cliente real:

```ts
const cobranzaApi = {
  listar: (params) => apiClient.get<Paginated<CuentaPorCobrarDTO>>('/cobranza', { params }),
  stats: () => apiClient.get<CobranzaStats>('/cobranza/stats'),
  registrarCobro: (id, data: CobroCreateInput) => apiClient.post<CobroDTO>(`/cobranza/${id}/cobros`, data),
  cobros: (id) => apiClient.get<CobroDTO[]>(`/cobranza/${id}/cobros`),
  exportar: () => apiClient.get<Blob>('/cobranza/exportar'),
};
```

En `page.tsx`: fetches con `useEffect` (patrón proveedores), quitar mocks, paginación
server-side, `initialLoading`. La estructura de UI NO cambia (el contrato ya está).

## 4. Roadmap a largo plazo — módulos OPERACIONES y COMERCIAL

### COMERCIAL (ciclo de dinero completo)

| # | Flujo | Depende de | Valor |
|---|-------|-----------|-------|
| C1 | Cotización Aceptada → Factura + CxC (P1 de IMPLEMENTACIONES-A-FUTURO) | módulo `facturas` | El negocio mismo genera la deuda |
| C2 | Módulo `facturas` (CFDI: timbrado, xml/pdf, factura_conceptos) | — | Facturar es requisito legal |
| C3 | Venta POS a crédito → factura → CxC | C2 | Hoy el POS es solo contado |
| C4 | Ledger por cliente (tabs consolidados en `/clientes`) | backend cobranza | Historial completo del cliente en un lugar |
| C5 | Reporte cruzado CxC vs CxP (finanzas: flujo neto proyectado) | cobranza + proveedores | Tesorería predictiva |
| C6 | Reversión de cobro (nota de crédito, motivo, auditoría WARNING) | permiso cobranza.editar | Corrección contable rastreable |
| C7 | Conciliación bancaria (pagos ↔ transacciones ↔ estado de cuenta) | finanzas | Cierra el dinero real |

### OPERACIONES (contexto que enriquece la cartera)

| # | Flujo | Depende de | Valor |
|---|-------|-----------|-------|
| O1 | `proyecto_id` en `cuentas_por_cobrar` → cartera por obra | migración + módulo proyectos | Saber qué obra debe dinero |
| O2 | Reporte de cartera por obra/proyecto (export agrupado) | O1 | Dirección ve morosos por obra |
| O3 | Bitácora de renta cerrada → CxC automática (`bitacora_id`) | módulo bitacoras-renta (solo se consume) | El cargo nace sin digitación |
| O4 | Costo de venta → utilidad por proyecto (inventario ↔ facturas ↔ proyectos, flujo 6.8) | C2 + inventario | Margen real por obra |
| O5 | Cobranza del reporte de campo (reportes-campo → transacciones → CxC) | módulo reportes-campo | Cobrar trabajo ejecutado en campo |

### Orden de ejecución

```
Fase 1 (2-3 días): migración + módulo cobranza + seed + tests        ← PRÓXIMO PASO
Fase 2:            conectar frontend a API real (cobranza.page.tsx)
Fase 3 (C2 → C1):  módulo facturas → cotización aceptada → CxC
Fase 4 (O1, O2, O3): proyecto en CxC + bitácora → CxC
Fase 5 (C4-C7, O4-O5): reportes consolidados y conciliación
```

## 5. Testing — obligatorio (AGENTS.md)

- **Unit (Jest, `*.spec.ts`)**: servicio (cada método público ≥ 1 test), controller
  (cada endpoint ≥ 1), DTOs validados con `class-validator`, guards (casos true/false).
  Mocks de PrismaService con `@nestjs/testing`.
- **Integración (`*.integration.spec.ts`, `npm run test:integration`)**: flujo real de
  auditoría en PostgreSQL — crear CxC registra `CXC_CREADA`; cobro registra
  `COBRO_REGISTRADO` + transacción en `transacciones`; FAIL registra `COBRO_EXCEDE_SALDO`.
  Limpieza en orden FK-safe; `registro_auditoria` es inmutable (se deja).
- Ejecutar `npx tsc --noEmit` y eslint tras cada cambio.

## 6. Validación y Riesgos

1. **`facturas` sin módulo NestJS**: C1/C3 no pueden ejecutarse hasta construir
   facturación; el POST `/cobranza` manual cubre el interín.
2. **`cuentas_por_cobrar` sin `proyecto_id`**: O1 requiere migración adicional
   (recomendado) o derivar obra vía factura → cotización → proyecto (frágil).
3. **Dos mundos de venta**: POS (contado, cliente string) vs facturación CFDI
   (crédito). El plan los une solo en C3.
4. **Reversión (C6)**: nunca `delete` de `pagos`; crear transacción de reversión
   (INGRESO negativo / nota de crédito) y auditar.
5. **Plantilla `proveedores`**: el módulo `cobranza` replica endpoint por endpoint el
   patrón ya probado (auditoría, DTOs, tests) — minimiza riesgo de implementación.
6. **Monorepo**: no hay paquete compartido de tipos en uso; los DTOs viven en el
   backend y los contratos espejo en `apps/web/src/lib/api.ts` (consistente con
   `proveedores`). Validar la fuente en el backend siempre.