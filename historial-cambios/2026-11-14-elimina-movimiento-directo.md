# 2026-11-14 — Eliminado el endpoint de movimiento directo de inventario

## Qué se hizo

- **`POST /api/inventario/movimiento` eliminado** (quedó huérfano tras quitar
  el botón "Pedir" de la UI — nadie lo consumía). En el backend:
  - `inventario.controller.ts`: ruta + import fuera.
  - `inventario.service.ts`: método `crearMovimiento` completo fuera
    (incluido el bloque triplicado `if (tipo === 'SALIDA')` con ifs anidados
    muertos que traía). **`aplicarEntrada` se queda** — lo usan la recepción
    de órdenes de compra (Fase 7) y el envío de criba a inventario (B7.2).
  - `dto/create-movimiento.dto.ts`: archivo eliminado.
- **`apps/web/src/lib/api.ts`**: `inventarioApi.movimiento` + interface
  `MovimientoInput` fuera.
- **`audit.constants.ts` NO se tocó**: `MOVIMIENTO_REGISTRADO` queda en el
  enum (hay filas históricas en `registro_auditoria`, inmutable) y los
  `STOCK_BAJO_*` / `STOCK_INSUFICIENTE` siguen vivos en crear/editar
  artículo y en ventas (POS).

## Verificación

- `npx tsc --noEmit` (api y web): limpios.
- Unit `src/inventario`: **26/26** (quedaron los describes de CRUD y
  `aplicarEntrada`).
- Integración (BD real): **7/7** (los describes que usaban `crearMovimiento`
  se retiraron; los de crear/editar con STOCK_BAJO quedan).
- **Smoke real**: `POST /api/inventario/movimiento` → **404 NOT_FOUND** ✓.

## Pendientes / riesgos

- Si algún día se quiere "registrar entrada manual" fuera del flujo de
  OC/criba, se volverá a agregar como parte del flujo real (no directo).
