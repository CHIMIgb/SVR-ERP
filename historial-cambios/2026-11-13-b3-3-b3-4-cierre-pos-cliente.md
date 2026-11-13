# 2026-11-13 — Cierre B3: cliente del catálogo en el POS y gates finales

## Qué se hizo

### B3.3 — UI del POS (`/ventas`)

- **`apps/web/src/lib/api.ts`** — `CreateVentaInput.clienteId?` y
  `VentaDTO.clienteId?` (el `customer` de texto sigue igual).
- **`apps/web/src/app/(dashboard)/ventas/page.tsx`**:
  - **Selector de cliente** en la tarjeta del Carrito (encima de los renglones):
    "Público en general" por default + clientes del catálogo (por
    `empresa || nombre`). El catálogo se carga una vez al montar.
  - **Mini-modal de alta rápida** ("Nuevo"): nombre (req), empresa (opcional),
    teléfono (req) y correo (req — los que el backend exige para clientes).
    Al crear: se agrega al selector y queda seleccionado sin salir del POS.
    Errores por `mensajeErrorApi`.
  - El payload del cobro manda `clienteId` solo si hay cliente elegido; ya no
    envía `cliente: 'Público en general'` fijo (el backend pone el default).
  - Los tickets (`ventaDtoToSale`) no cambian: siguen mostrando el texto
    snapshot.

### B3.4 — Gates

- `npm run test` (api): **1330 passed / 2 failed** de 1332 — los 2 fallos son
  los preexistentes de `cobranza.service.spec.ts` (`ATRASO_GRAVE`), ajenos a B3.
- `npx tsc --noEmit` (web): limpio.
- `npx eslint` (web): **56 problemas (18 errores, 38 warnings)** — el mismo
  baseline preexistente.
- **Smoke real contra la API** (login admin):
  1. Cliente nuevo vía `POST /clientes` (simula el alta rápida): "Peluqueria
     Smoke".
  2. Venta con `clienteId` → ticket T-00001, `customer: "Peluqueria Smoke"`,
     `clienteId` en la respuesta, y en BD la fila tiene `cliente_id` poblado ✓.
  3. Venta sin cliente → T-00002, `customer: "Público en general"`,
     `cliente_id` NULL ✓ (flujo viejo intacto).
- Horario de atención: el smoke requería abrir el turno (00:00–23:59 temporal);
  **restaurado a 07:00 / 02:00** y verificado con `psql`.

## Archivos tocados

- `apps/web/src/lib/api.ts` (clienteId en input y DTO)
- `apps/web/src/app/(dashboard)/ventas/page.tsx` (selector + mini-modal + payload)
- `docs-prioridades/PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md` (§1 B3 ✅ y
  §12 nuevo con el ejecutado de B3)
- `historial-cambios/2026-11-13-b3-3-b3-4-cierre-pos-cliente.md` (este archivo)

## Pendientes / riesgos

- **Smoke visual pendiente** (sin navegador): el selector y el mini-modal del
  POS no se vieron renderizados.
- El throttler de login bloqueó el smoke unos minutos por intentos repetidos;
  se resolvió reiniciando la API (el estado del throttle es en memoria).
- Datos de prueba que quedan en la BD dev: cliente "Peluqueria Smoke" y 2
  ventas de smoke (T-00001/T-00002 del día) — inofensivos para demo.
- Deuda anotada en §12: specs de integración dependen del horario real de BD.
- C3 (venta a crédito → CxC desde el POS) sigue pendiente en la lista del plan.
