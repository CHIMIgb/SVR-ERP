# 2026-11-12 — B1.2: partidas en el backend de cotizaciones y facturación por renglón

## Qué se hizo

Fase B1.2 (partidas de cotización, §1 fila B1) en `apps/api/src/clientes/`:

- **DTO nuevo `dto/cotizacion-item.dto.ts`** — renglón: `descripcion`,
  `cantidad` (>0), `unidad`, `precioUnitario`. El `importe` NO se acepta del
  cliente: se calcula en servidor.
- **`create-cotizacion.dto.ts` / `update-cotizacion.dto.ts`** — ganan
  `condiciones?` (texto precargado del Word, máx 2000) e `items?`
  (`@ArrayMaxSize(100)` + `@ValidateNested`). En update, `items: undefined` no
  toca partidas; `items: []` las elimina todas (vuelve a cotización plana).
- **`cotizaciones.service.ts`**:
  - Helper `itemsDe()`: importa calculado (`round2(cantidad × precio)`), `orden`
    por índice y monto de cabecera = Σ importes.
  - `create`: con partidas, cabecera + renglones nacen en la MISMA
    `$transaction`; el `monto` enviado se ignora (siempre Σ importes). Sin
    partidas conserva el flujo plano actual (las cotizaciones viejas intactas).
  - `update`: reemplazo completo de partidas en transacción
    (`deleteMany + create`), monto recalculado; `condiciones` editable.
  - `serialize` incluye `condiciones` y `items` (solo cuando la relación vino
    cargada: detalle y respuestas de create/update — los listados evitan N+1).
  - `findOne` incluye `items` ordenados.
  - **`facturar` por renglón**: un `factura_conceptos` por partida (cantidad,
    unidad, descripción, valor unitario, importe) con IVA 16% calculado
    renglón a renglón; cabecera de la factura = Σ conceptos (subtotal,
    impuestos, total consistentes). Cotizaciones sin partidas conservan el
    concepto único de siempre. El audit `COTIZACION_FACTURADA` lleva
    `conceptos: N`.

## Verificación

- `npx tsc --noEmit` (api): limpio.
- Unitarios `src/clientes`: **83/83** (35 del service, incluye los nuevos:
  create con partidas recalcula monto y no pasa por el create plano, update
  reemplaza con deleteMany+create, facturar crea 2 conceptos con IVA por
  renglón 880/2560 y total 24940).
- Integración (BD real, `npm run test:integration`): **262/263** — los 4 tests
  nuevos de `PARTIDAS (cotizacion_items)` en `cotizaciones.integration.spec.ts`
  pasan: creación con importes reales en BD + audit SUCCESS, reemplazo al
  editar, facturación por renglón (conceptos 5500/16000, IVA 880/2560, total
  24940, audit con `conceptos: 2`) y CASCADE al eliminar la cotización.
- El 1 fallo es `src/auth/pin/pin.integration.spec.ts` (test 2): **flake
  preexistente de bloqueo por IP** — el spec pega PINs fallidos desde la IP
  fija `10.98.0.2`; corridas dentro de 15 min acumulan 10+ fallos y el
  bloqueo automático por IP (423 LOCKED) precede al 401 que el test espera.
  No toca código de auth ni de B1; la fila sembrada se desactivó con un
  `UPDATE usuarios_bloqueados SET activo=false` para no contaminar corridas
  siguientes.

## Pendientes / riesgos

- `facturar` sigue generando CxC por el total con IVA: correcto, pero el
  saldo por concepto no existe (la CxC es de cabecera, igual que hoy).
- Los listados no regresan partidas (detalle sí): si algún consumidor futuro
  necesita partidas en el listado, requiere su propio `include` — decisión
  deliberada para no cargar N+1.
- El spec de PIN acumula fallos de IP entre corridas: deuda de auth (fuera de
  B1), con mecanismo verificado esta sesión.
