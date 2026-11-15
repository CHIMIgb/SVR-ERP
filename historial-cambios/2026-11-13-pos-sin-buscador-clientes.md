# 2026-11-13 — POS: se retira la barra de búsqueda del selector de clientes

## Qué se hizo

- **`apps/web/src/app/(dashboard)/ventas/page.tsx`** — se elimina la barra de
  búsqueda que se había agregado encima del selector de cliente (a petición del
  cliente: "quita la barra de búsqueda nomas"). El selector queda en una sola
  línea con: **Público en general** + clientes del catálogo +
  **"Otro (escribir nombre)..."** (conservado) + botón Nuevo. Se retiraron el
  estado `clienteBusqueda` y los memos `clienteSeleccionado` /
  `clientesFiltrados` que solo servían al filtro.

## Verificación

- `npx tsc --noEmit` (web): limpio.
- `npx eslint` del archivo: sin hallazgos.

## Pendientes / riesgos

- Con muchos clientes el select puede volverse incómodo; si pasa, se puede
  reintroducir un buscador mejor integrado (o paginar el catálogo).
