# Plan — Mejoras futuras de `/m/reportes` (backlog de los mockups)

**Fecha:** 2026-11-20
**Estado:** backlog — NO implementado. Análisis de los 3 mockups del cliente
(2026-11-20) contra la vista implementada. El lote A ya quedó hecho
(tiempo relativo `haceTiempo()`, lupa en la búsqueda con la prop nativa del
kit `Input`, conteos en los chips, botón Ubicación en la tarjeta, scroll
interno con el bloque superior fijo).

## Ordenado por valor/efecto

### 1. KPI mensual del técnico (mockup 3)
«Reportes que has resuelto este mes: 23 — +5 vs. octubre» con barra verde.
- **Backend:** endpoint nuevo (`GET /reportes-campo/mi-rendimiento?mes=`)
  que cuente CERRADO por `asignado_a_id`/`asignado_user_id` del mes actual
  vs el anterior. Permiso `operaciones/reportes_campo/ver`.
- **Front:** tarjeta con `StatsCard`-like + delta del mes anterior.
- **Valor:** motivación directa del técnico (petición explícita del
  cliente en el mockup).

### 2. Flujo «Presionar» del residente (mockup 2)
Cuando un reporte de su equipo no avanza: caja «¿Por qué no se resuelve?»
con motivo calculable + **botón Presionar** (nudge a la torre) y **Llamar
técnico** (`tel:` del asignado).
- **Reglas calculables:** «Ningún técnico lo ha aceptado» = `estado NUEVO`
  sin `asignado_a_id` + edad; «Esperando refacción» es texto libre (última
  actividad) — definir con el cliente qué se muestra.
- **Backend:** endpoint de nudge (notificación ALERTA a la torre/usuario
  asignado — usar el catálogo: clave `REPORTE_PRESIONADO`).
- **Front:** caja + botones en el detalle y/o tarjeta del residente.
- **Pendiente relacionado:** «Llamar técnico» necesita el teléfono del
  asignado en el DTO de lista (hoy está el del reportador).

### 3. Badge «Atrasado» (mockup 2)
- **Regla SLA a definir con el cliente:** ¿cuántas horas en NUEVO sin
  aceptar? ¿o sin cerrar tras aceptar?
- Una vez definida, es calculable en el serializer del service (mismo
  criterio en escritorio y PWA) + badge `error` en la tarjeta.

### 4. Chips específicos por rol (mockups 2-3)
Residente: Abiertos/Atrasados/Resueltos · Técnico:
Disponibles/Mis aceptados/Resueltos — requiere parámetros de filtro
nuevos en el listado (`asignado=mi`, rol según audiencia).

### 5. Menores
- «+ Nuevo reporte» full-width arriba (solo reorganización visual).
- Deep-link por `referencia_id` al abrir una notificación (requiere
  exponer `referenciaTipo/referenciaId` en el provider compartido —
  pieza compartida con el escritorio).
- Ocultar la fecha en la burbuja de alertas si el ancho chico trunca
  demasiado.
- «Sin domicilio registrado» en la modal de la tarjeta: los reportes demo
  viejos no tienen obra/GPS — considerar backfill de demo si molesta.

## Convenciones para ejecutar
- Cada item = análisis + plan propio + autorización (regla del repo).
- Las alertas nuevas SIEMPRE por el catálogo (`construirAlerta(ALERTAS.X, ...)`
  — `APPES/AGENTS`: prohibido inline).
- Los KPIs y badges derivados se calculan en el **service** (misma regla en
  escritorio y PWA) — jamás lógica duplicada en las vistas.
