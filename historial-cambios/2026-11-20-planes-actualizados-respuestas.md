# Planes actualizados con las respuestas del cliente (dudas respondidas)

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** «actualiza los planes que existan con las respuestas recibidas para saber que cambios realizar»

## Cambios realizados
- **`PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md`** — los 5 items que
  estaban EN ESPERA de las claves ahora llevan el estado de la respuesta y
  el diseño resultante:
  1. **F3 motor de retiros: DESBLOQUEADO** (claves 1/2: precio varía por
     cliente — público + especial atado a obras activas, cambio por
     ENCARGADOS; retiro → una obra por viaje; ORIGINAL/COPIA del papel se
     resuelve con una captura + procesamiento posterior).
  2. **Crédito en POS: PARCIAL** (hay clientes con crédito que abonan —
     falta límite/rebase de REGISTRO DE VENTAS).
  3. **Conciliación semanal de proveedores: DESBLOQUEADO — flujo NUEVO**
     (externos de transporte: proveedor envía conciliación de viajes →
     encargado confirma obras → cierre de saldo → abonos; corrección solo
     al momento; la cerrada queda como estado de cuenta con abonos/pagos).
     **El cliente pide una VISITA** al proceso antes de diseñarlo.
  4. **Formatos de estado de cuenta (flete): DESBLOQUEADO** (el CLIENTE
     decide solo material o material y flete → bandera por CLIENTE).
  5. **Desgloses de costo por proyecto: SE AJUSTA** (los gastos de camión
     NO se cargan a la obra — van a PARTE por camión; el desglose por
     proyecto solo con costos directos + rendimiento por camión aparte).
  - **2.2 /proveedores P4:** parcialmente respondida (EX3 por analogía).
  - **2.3 /facturas Fa1:** ✅ RESPONDIDA (estado de cuenta del CLIENTE +
    razón social que ellos envían) — falta el campo de razón social.
- **`IMPLEMENTACIONES-A-FUTURO.md`:** nota de actualización en la sección
  de fuentes — P7 desbloqueado (claves 1/2), P1–P4 parcialmente
  desbloqueado (claves 8/9 + visita pedida), C3 parcial (clave 6).
- **`ANALISIS-DOCS-SVR-...2026-11-12.md` §10:** A9 **AJUSTADA** (el cambio
  de precio lo hacen los ENCARGADOS al negociar) y A1 CONFIRMADA (el
  ORIGINAL/COPIA del papel se resuelve con una captura en la app).

## Archivos tocados
- `docs-prioridades/PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md`
- `docs-prioridades/IMPLEMENTACIONES-A-FUTURO.md`
- `docs-prioridades/ANALISIS-DOCS-SVR-PROCESOS-EXCEL-2026-11-12.md` (§10)
- `historial-cambios/2026-11-20-planes-actualizados-respuestas.md` (creado)

## Verificación / pruebas
- `git diff --check`: sin errores. Cambio solo de documentación.

## Pendientes y riesgos
- Los gaps de implementación (lista de precios, conciliación de externos,
  flete, razón social, condiciones precargadas) quedan analizados en
  `ANALISIS-FLUJOS-DATOS-RESPUESTAS-2026-11-20.md` — para ejecutar requieren
  plan propio + autorización, y el de externos pide VISITA al cliente.
- Sin push: el commit queda local.
