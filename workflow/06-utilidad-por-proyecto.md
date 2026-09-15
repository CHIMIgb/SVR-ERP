# Workflow 06 — Utilidad / margen por proyecto (O4)

> Fase 6 de `implementation_plan copy.md` (O4), movida de la Fase 5 por requerir
> preparación de datos de costo. ⏳ Futuro — plan en `implementation_plan_fase6.md`.

## Origen → Destino

```
/proyectos ── se quiere saber: ¿cuánto gané/perdí en esta obra? ──► /finanzas

Ingresos  = facturas emitidas contra el proyecto (vía cuentas_por_cobrar)
Costo     = costo de lo facturado
             ├─ Opción A (confirmada): articulos_inventario.costo_unitario
             │   (costo manual, último costo conocido; B/C: costo promedio vía
             │    movimientos_inventario)
             └─ política anti doble conteo:
                  costosConceptos → líneas facturadas con artículo + costo
                  proyectos.gastado → solo lo no cubierto por conceptos
Utilidad  = Ingresos − Costo   → margen % = utilidad / ingresos
```

## Pasos

1. **Migración aditiva (6a):** `articulos_inventario.costo_unitario` +
   desnormalización de facturas: `facturas.proyecto_id` (FK), `factura_conceptos.articulo_id`
   (FK, soft-friendly), índices.
2. **Backend (6b):** servicio de utilidad por proyecto que consolida ingresos vs costo
   bajo la política anti doble conteo (DAG de fuentes de costo).
3. **Frontend (6c):** en `/proyectos` (detalle) y `/finanzas`, bloque de utilidad por
   obra con KPIs y desglose por concepto.

## Dónde se valida el dinero

- La utilidad es **derivada**, nunca digitada: se calcula de facturas + costos.
- La fuente de costo **única** evita contar dos veces (regla anti doble conteo).
- Requiere preparación de datos: costo histórico de artículos (si está vacío, la
  utilidad no es confiable → no mostrarla antes que mostrarla mal).

## Puntos delicados

- **No mostrar números sin base:** si los artículos facturados no tienen costo, la
  utilidad sería 100% errónea — la Fase 6 prepara los datos primero.
- Cruce transaccional: costo entró por compra/entrada de inventario; ingreso salió por
  factura; ambos deben vivir en la misma moneda (MXN) y ventana.