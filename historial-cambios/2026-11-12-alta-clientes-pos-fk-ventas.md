# 2026-11-12 — docs: alta de clientes en el POS — no se necesita vista nueva, falta FK ventas.cliente_id + alta rápida

## Qué se resolvió

Pregunta del usuario: ¿los clientes necesitan una vista para crearlos?

**Respuesta: NO una vista nueva** — `/clientes` ya existe con CRUD completo
(crear/editar/eliminar + consolidado 6.7). Lo que SÍ es un hueco real y
prerrequisito del crédito en el POS (C3):

1. **FK `ventas.cliente_id`** — verificado en schema: `ventas.cliente` es
   texto libre con default "Público en general"; el POS no vincula la venta
   a un cliente real (sin esto el crédito no sabe a quién cobrarle).
2. **Mini-modal de alta rápida de cliente dentro de `/ventas`** — para el
   cliente nuevo que llega sin registro: nombre + teléfono mínimo, el detalle
   se completa después en `/clientes`.

## Dónde quedó documentado

- **`PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md`** — nueva fila en §2.6
  (tabla /ventas): fuente "Requisito de crédito (análisis §9.3)", estado
  ⚠️→decisión de diseño, con la verificación del schema citada.
- **`ANALISIS-DOCS-SVR-PROCESOS-EXCEL-2026-11-12.md`** — §9.3, nuevo punto 4
  del orden sugerido: FK ventas.cliente_id + alta rápida en POS + nota
  explícita de que NO se necesita vista nueva de alta de clientes.

## Archivos tocados

- `docs-prioridades/PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md` (§2.6)
- `docs-prioridades/ANALISIS-DOCS-SVR-PROCESOS-EXCEL-2026-11-12.md` (§9.3)
- `historial-cambios/2026-11-12-alta-clientes-pos-fk-ventas.md` (este registro)

## Verificación / pruebas

- Solo docs — sin código.
- Verificación real en schema.prisma: `ventas.cliente` String default
  "Público en general" (sin FK); `ventas_items` solo cruza `articulo_id`.

## Pendientes / riesgos

- La decisión de "alta rápida" (nombre+teléfono mínimo) es diseño nuestro —
  si el cliente dice que en el POS nunca se registra gente nueva (siempre
  llega ya registrada), el mini-modal se puede quitar y solo queda la FK.
- La migración de `ventas.cliente → ventas.cliente_id` debe preservar el
  histórico (texto libre → FK nullable con el texto como respaldo).
