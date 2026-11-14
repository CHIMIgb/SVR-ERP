# 2026-11-14 — B9/P6: vendedor visible y filtrable en /cotizaciones (web)

## Qué se hizo

Segunda mitad de B9 — la parte web del vendedor real:

- **`lib/api.ts`**:
  - `CotizacionDTO`: `vendedorId` / `vendedorNombre` (null en legados).
  - `cotizacionesApi.listar`: acepta `vendedorId`.
  - Nuevo `cotizacionesApi.vendedores()` → `GET /cotizaciones/catalogos`.
- **`/cotizaciones/page.tsx`**:
  - Catálogo de vendedores cargado una vez (mismo patrón que el de clientes).
  - **Columna "Vendedor"** en el DataTable (texto neutro; "—" en registros
    sin vendedor — los 2 legados que no tienen `creado_por`).
  - **Filtro "Vendedor"** en el panel de filtros (select "Todos" + usuarios
    activos) y chip activo al filtrar.
  - Detalle: línea "Vendedor" junto a "Creada por".

## Verificación

- `npx tsc --noEmit` (web): limpio.
- eslint: solo el error **preexistente** de setState en effect (línea ~168,
  deuda conocida de esta vista).
- Backend ya verificado en el commit anterior con smoke real (catálogo 35
  vendedores, filtro devuelve 5 con "Carlos SVR" gracias al backfill).
- Smoke visual en navegador pendiente (sin navegador).

## Pendientes / riesgos

- El formulario de crear NO tiene select de vendedor: el vendedor es
  SIEMPRE el usuario logueado (decisión de diseño de P6). Si el admin
  captura por otro, queda atribuido al admin — si eso pasa en la práctica,
  se agrega select después.
- La lista de cotizaciones anidada en `/clientes` no muestra vendedor
  (fuera del alcance de B9).
