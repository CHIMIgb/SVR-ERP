# IMPLEMENTACIONES-A-FUTURO.md actualizado a la realidad del código

**Fecha:** 2026-11-04
**Autor:** agente OpenCode (a petición del usuario)

## Cambios realizados
Corrección documental: el doc decía cotizaciones aisladas/endpoints por construir
(fase 1 histórica); se actualizó a lo verificado contra `schema.prisma` y el código:

- **Encabezado y §1:** estado real — la cadena cotización→factura→CxC→pago ya opera
  (`facturar()` transaccional en `cotizaciones.service.ts`). Antes decía "CRUD aislado /
  cotización que muere ah".
- **§2.2:** tabla re-hecha — Cotización→factura/CxC/pago = ✅ existen; quedan abiertos
  P2 (partidas), P3 (proyecto), P4 (inventario), venta a crédito (C3).
- **P1 y P5:** cambiados a "✅ REALIZADO" con cómo se implementaron
  (folio anti-colisión, transición condicional, updates condicionales de cobro).
- **Intro §6:** corregida la lista real de archivos en mock (`@/lib/data`):
  dashboard, gps, documentos, Topbar, MachineCard, ProjectCard, ProjectDetailsModal
  (el doc afirmaba que solo ProjectDetailsModal).
- **6.1:** ✅ Realizado (Fase 4, workflow 02 — bitácoras-renta facturable con firma).
- **6.8:** endpoints ya existen (facturas/cobranza/flujo-neto); restan desgloses
  (Fase 3 de FLUJO-PROGRESO-PROYECTOS) y C3.
- **§7 (tabla maestra):** P1/P5/6.1/6.7/6.8 → ✅; P2/P3/P4/P6/P7 y 6.2-6.6 → ⏳ con
  evidencia de verificación (grep/schema) en cada fila. Orden sugerido actualizado:
  P2 → P4 → P7 con 6.4 → 6.5 en paralelo.
- **§8.4:** el ciclo del dinero del lado INGRESOS ya está construido; lo faltante:
  C3 (venta POS a crédito → CxC), §9 y §10.
- **§10:** nota de que la columna `cuentas_por_pagar.fecha_vencimiento` YA existe en
  schema pero ningún service la propaga — el pendiente real es OC→propagación+UI.

## Cosas nuevas
- Ninguna funcionalmente; documentación sincronizada con el código.

## Archivos tocados
- `IMPLEMENTACIONES-A-FUTURO.md` (modificado)

## Pruebas / verificación
- Verificadores usados (grep/schema, no navegador):
  - `cotizaciones.service.ts` facturar() → factura+CxC transaccional ✔
  - grep `vendedor_id` en api = 0 usos → P6 pendiente ✔
  - grep `registros_mantenimiento|reportes_campo` en incidentes = 0 → 6.2 pendiente ✔
  - schema `registros_criba` sin FK máquina/obra → 6.4 pendiente ✔
  - schema sin `cotizacion_items` → P2 pendiente ✔
  - schema `cuentas_por_pagar.fecha_vencimiento` existe; grep proveedores =
    0 usos → §10 parcial ✔
  - grep `@/lib/data` en web = 7 archivos en mock ✔
  - `ConsolidadoClienteDTO` tabs: cuentas/facturas/cobros/cotizaciones (sin
    trabajadores) → 6.7 realizado parcial ✔
- Endpoints del backend verificados contra las rutas mapeadas de la API.

## Pendientes y riesgos
- El flujo del dinero implementado se confirmó por código; NO se verificó
  navegandolo en el navegador (flujo punta a punta con datos reales).
- Quedan abiertos: C3, §9, §10, P2→P4→P7, 6.2-6.6, workflow 06 (Fase 6),
  export agrupado de morosos (`PENDIENTES.md` punto 1).
