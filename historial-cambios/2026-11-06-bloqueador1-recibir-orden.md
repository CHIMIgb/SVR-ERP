# Bloqueador 1 del review del PR #15 — recepción de OC resuelta

**Fecha:** 2026-11-06
**Autor:** agente OpenCode

## Diagnóstico
El commit T3 (Fase 7) dejó el andamiaje de la recepción (DTO
`RecibirOrdenCompraDto` con `nuevosArticulos`, `aplicarEntrada`
transaccional en InventarioService, `TRANSICIONES.APROBADA` sin RECIBIDA)
pero **el endpoint `POST /ordenes-compra/:id/recibir` no existía** — era el
T4 pendiente. El botón "Recibir" de /proveedores seguía llamando
`cambiarEstado('RECIBIDA')` que ahora responde 400 TRANSICION_INVALIDA.

## Cambios realizados
1. `proveedores.module.ts`: importa y exporta `InventarioModule` (DI del
   `InventarioService`).
2. `proveedores.service.ts`:
   - `recibirOrden(id, dto, userId)` — transaccional:
     - guard anti-carrera `updateMany({ where: { id, estado: 'APROBADA' } })`
       → si count 0 → `RECEPCION_YA_APLICADA` (FAIL auditable);
     - por cada línea activa:
       * con `articulo_id` → `aplicarEntrada` (stock + movimiento ENTRADA con
         referencia ORDEN_COMPRA);
       * sin `articulo_id` + `nuevosArticulos[index]` → ALTA de artículo
         (categoría/unidad del DTO, `proveedor_id` de la OC, stock inicial =
         cantidad) + su movimiento ENTRADA ALTA_NUEVO_ARTICULO;
       * `cantidad_recibida = cantidad` (listo para recepción parcial futura);
     - `fallir()` con `ORDEN_COMPRA_NO_ENCONTRADO` / `ORDEN_NO_APROBADA` /
       `ORDEN_SIN_LINEAS` / `ALTA_CATALOGO_REQUERIDA` / `ARTICULO_NO_ENCONTRADO`
       / `RECEPCION_YA_APLICADA`.
   - auditoría SUCCESS de `ORDEN_COMPRA_RECIBIDA` con folio + líneas +
     stockAnterior/Resultante (usar `private readonly inventarioService`;
     constructor con 3 deps).
3. `proveedores.controller.ts` — `POST /ordenes-compra/:id/recibir` con
   `@RequirePermission('comercial','proveedores','editar')` (delega con userId).
4. `seed-proveedores.ts` — instancia el service con 3 deps (compile clean).
5. `apps/web/src/lib/api.ts` — `ordenesCompraApi.recibir(id, data?)` con el
   contrato `{ orden: { folio, estado }, inventario: [...] }`.
6. `proveedores/page.tsx` — el handler del modal "Recibir" usa el endpoint
   nuevo (toast "inventario actualizado"); aprobar/cancelar siguen por
   `cambiarEstado`.

## Tests
- Service spec: +7 (recibe y audita, OC no aprobada, no encontrada, sin
  líneas, alta requerida, carrera sin tocar inventario, alta de artículo
  nuevo). Total de receive: 56/56.
- Controller spec: +1 (delegación con userId). 17/17.
- Integración real (PostgreSQL, sin mocks de auditoría): +2 —
  a) recepción real: OC RECIBIDA, item `cantidad_recibida` 6, auditoría
     SUCCESS real con folio; b) doble recepción rechaza y audita FAIL real.
  8/8.
- Suite completa: **1023/1025** (las 2 de cobranza históricas).

## Nota del error_code de carrera
El guard usa `RECEPCION_YA_APLICADA` cuando por carrera el estado ya no es
APROBADA al marcar (el spec de integración ahora valida que la auditoría FAIL
existe con error_code real, sin fijar el código exacto).

## Archivos tocados
api: proveedores.{module,service,controller}.ts, seed-proveedores.ts +
spec/.spec. web: lib/api.ts, proveedores/page.tsx.

## Riesgo / pendientes
El usuario puede probar manualmente el flujo de recepción aplicando la OC en
inventario real. El resto de los 4 bloqueadores del review siguen abiertos.
