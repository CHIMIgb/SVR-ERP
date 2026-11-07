# F2 tab-first considere + delay demo de 3s en Operaciones/Comercial

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Diagnóstico (con la observación del usuario sobre icono-de-vacío vs skeleton)
- `DataTable` ya muestra skeleton de primera carga cuando recibe `loading={...}`
  (l64-78 del componente). El problema: el flash de "vacío" venía de páginas que
  gateaban la carga con `<EmptyState title="Cargando…">` (el icono vacío) y una
  tabla sin prop `loading`: /reportes sin loading, /cobranza con 4 loaders-vacío,
  /proveedores con 2 loaders-vacío + 4 DataTables sin prop.
- /finanzas: la tabla de flujo neto no tenía loading state propio (flash vacío).

## Cambios realizados
1. **proveedores/cobranza:** los 6 `<EmptyState title="Cargando…">` →
   `<Skeleton variant="table" lines={6} />` (2+4). Con eso la primera impresión
   SIEMPRE es skeleton y el mensaje de vacío solo aparece tras la carga real.
2. **/reportes:** su DataTable recibe `loading={initialLoading}` (nuevo prop).
3. **/finanzas:** estado nuevo `flujoLoading` (set true al pedir flujo-neto, false
   en finally) + prop `loading` en la tabla del flujo (antes carecía por completo).
4. **Complicación del delay demo de 3 s:** helper `src/lib/demo-delay.ts` —
   `sleepDemo(ms=3000)` — insertado como primera línea de la función de carga
   inicial en 11 páginas (operaciones, inventario, proyectos, criba, reportes,
   cotizaciones, facturas, clientes, cobranza, proveedores, finanzas) + manual en
   `ventas` (cargarDatos) y `ventas/corte` (effect async). Comportamiento: skeleton
   ~3s, luego datos. Comentar con marcarlo `// shortcut: quitar tras la demo`.
5. Fuera de alcance pedido: /maquinaria, /horometro, /combustible, /mantenimiento
   (módulo Maquinaria) — mantienen LoadingState/estándar propio; anotado como
   deuda (la regla de AGENTS.md los cobigará cuando se toque ese módulo).

## Incidentes controlados durante la ejecución
- `Set-Content` de PowerShell re-codificó los 3 archivos (proveedores/cobranza/
  reportes) con mojibake (`CrÃ­ítica` etc.) — **revertidos con `git checkout --`**
  y reaplicados vía script node (UTF-8 sin BOM). Verificado 0 mojibake en diff.
- El mismo apersourcing de imports en el paso script anterior había caído dentro
  de un import multilínea — corregido en la pasada v3 (inserta tras el ÚLTIMO
  `...;` real).

## Verificación
- `npx tsc --noEmit`: 0 errores. `grep mojibake` en diff: 0.
- ESLint los 13 tocados: solo 2 warnings preexistente baseline; ninguno nuevo.
- Diff: 13 archivos, +47/-18 aprox.
- Visual (para el usuario): al abrir cada vista espera ~3s con skeleton.

## Pendientes y riesgos
- **El delay de 3s es demo para el martes — removerlo después** (marque en
  detalle cada llamada, y solo 1 helper). Si se olvida, la app cargaria lenta.
- Proveedores: tabs de OC/estados de cuenta no llevan loading per-tab (solo el
  principal) — si al cambiar de tab se percibe flash, se agrega estado de carga
  por tab (pendiente visual).
