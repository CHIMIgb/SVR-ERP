# 2026-11-13 — POS: buscador de clientes y nombre a mano en el selector

## Qué se hizo

Ajustes pedidos por el cliente sobre el selector de cliente del POS
(`apps/web/src/app/(dashboard)/ventas/page.tsx`):

- **Barra de búsqueda** "Buscar cliente por nombre o empresa..." encima del
  select: filtra el catálogo por empresa o nombre mientras se escribe. El
  cliente YA seleccionado siempre queda visible aunque el filtro no lo
  encuentre (evita que se pierda la elección al buscar).
- **Opción "Otro (escribir nombre)..."**: al elegirla aparece un input de
  texto para capturar el nombre a mano — va como texto libre en
  `ventas.cliente` (el backend lo soportaba desde siempre, es el flujo previo
  a B3). Útil para clientes ocasionales que no merecen alta en el catálogo.
- Sin elegir nada sigue quedando **"Público en general"** (confirmado: así
  funciona hoy).

## Verificación

- `npx tsc --noEmit` (web): limpio.
- `npx eslint` del archivo: sin hallazgos.
- Sin smoke visual (sin navegador).

## Pendientes / riesgos

- El nombre a mano no llena `ventas.cliente_id` (es texto): esas ventas no
  alimentan el historial del catálogo — es el comportamiento acordado.
- La búsqueda filtra solo los 100 primeros clientes (`limit: 100` del
  catálogo): con más clientes habría que paginar el selector.
