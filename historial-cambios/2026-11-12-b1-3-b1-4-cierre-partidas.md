# 2026-11-12 — Cierre B1: partidas en la vista, "Creada por" y gates finales

## Qué se hizo

### B1.3 — UI de partidas (`/cotizaciones`)

- **`apps/web/src/lib/api.ts`** — `CotizacionItemDTO` / `CotizacionItemInput`;
  `CotizacionDTO` con `condiciones`, `items?` y `creadoPor?`; inputs de
  create/update con `condiciones?` e `items?`.
- **`apps/web/src/app/(dashboard)/cotizaciones/page.tsx`** (el editor ya
  aparecía en `2c43917d`; aquí el resto):
  - Detalle: tabla de partidas (descripción / cantidad / unidad / precio
    unitario / importe) + caja de condiciones (`whitespace-pre-line`). El
    detalle ahora pide `cotizacionesApi.obtener()` porque el listado omite las
    partidas (sin N+1).
  - **"Creada por"** en el detalle (icono User), junto a Cliente y Fecha.
  - Validación: partidas requieren descripción, unidad, cantidad > 0 y precio
    ≥ 0; sin partidas se valida el subtotal manual de siempre.

### "Creada por" (pedido del cliente en el cierre)

- **`apps/api/src/clientes/cotizaciones.service.ts`** — `findOne` incluye la
  relación `users_cotizaciones_creado_porTousers → personas_users_persona_
  idTopersonas`; `serializeGlobal` expone `creadoPor` con nombre + apellidos.
- No se toca el seed ni permisos (misma ruta, mismo permiso).

### B1.4 — Gates

- `npm run test` (api): **1328 passed / 2 failed** de 1330 — los 2 fallos son
  los preexistentes de `cobranza.service.spec.ts` (`ATRASO_GRAVE`), ajenos a B1.
- `npx tsc --noEmit` (api y web): limpios.
- `npx eslint` (web): **56 problemas (18 errores, 38 warnings)** — el mismo
  baseline preexistente; los archivos tocados solo arrastran su error previo
  de `set-state-in-effect` en el efecto de carga.
- **Smoke real con la API en :3001** (login admin → Constructora ABC / SCT):
  1. `POST /clientes/:id/cotizaciones` con 3 partidas (vibrocompactador 1×5,500,
     traslado 1×9,000, pipa 2×8,000) y `monto: 1` a propósito → nace
     `COT-20261112-DD7945` con **monto recalculado 30,500**, 3 partidas y
     condiciones guardadas.
  2. `GET /cotizaciones/:id` → `creadoPor: "Carlos SVR"`, 3 items.
  3. `POST /cotizaciones/:id/facturar` → factura `FAC-2026-0003` con **3
     conceptos por renglón** (16,000 / 9,000 / 5,500), subtotal 30,500,
     IVA 4,880, **total 35,380** ✓.

## Archivos tocados

- `apps/web/src/lib/api.ts` (partidas + condiciones + creadoPor)
- `apps/web/src/app/(dashboard)/cotizaciones/page.tsx` (detalle + creadoPor)
- `apps/api/src/clientes/cotizaciones.service.ts` (creadoPor en el detalle)
- `docs-prioridades/PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md` (§1 B1 ✅ y
  §11 nuevo con el ejecutado de B1)
- `historial-cambios/2026-11-12-b1-3-b1-4-cierre-partidas.md` (este archivo)

## Pendientes / riesgos

- **Smoke visual pendiente** (sin navegador): el modal con partidas, el detalle
  con tabla y la línea "Creada por" no se revisaron renderizados.
- El detalle hace un fetch extra por apertura (`obtener`) — aceptado: el
  listado sigue liviano.
- Spec de PIN (auth) acumula fallos de IP entre corridas: deuda preexistente
  anotada en el plan §11; no se tocó auth en B1.
- P4 (bajar inventario por partida) y P7 (precios por medida) siguen pendientes
  para cuando se acuerden.
