# 2026-11-12 — docs: análisis de docs-svr (procesos Excel/Word) mapeado a vistas Comercial/Operaciones

## Qué se documentó

1. **`docs-prioridades/ANALISIS-DOCS-SVR-PROCESOS-EXCEL-2026-11-12.md`** —
   análisis a fondo de los 12 documentos que el cliente entregó en `/docs-svr/`
   (10 Excel + 2 Word) como definición de sus procesos actuales:
   - Inventario de cada documento (qué es, periodo, montos clave).
   - Mapeo documento ↔ vista: Comercial (REGISTRO DE VENTAS→/ventas/corte,
     PRODUCTIVIDAD→/ventas /cobranza /facturas, ESTADOS DE CUENTA→/cobranza
     /clientes, LISTA DE PRECIOS→tabulador, COTIZACIONES Word→/cotizaciones
     /facturas, PROVEEDORES→/proveedores) y Operaciones (PROYECTO AILIN→
     /proyectos /operaciones, lado operativo de PRODUCTIVIDAD).
   - NOMINA y CONTROL DE GASTOS quedan fuera de las 15 vistas (RRHH / finanzas).
   - Semántica confirmada contra los XML: bloque semanal por camión de
     PRODUCTIVIDAD (RENDIMIENTO = generado − diésel − insumos − operativo,
     verificado en fórmulas) y equivalencias camión→placa de los valores
     cacheados del XLOOKUP.
   - Insight transversal: PRODUCTIVIDAD + estados de cuenta + registro de
     ventas son el mismo negocio (retiro/viaje) desde 3 ángulos — una sola
     entidad con vistas derivadas elimina la triple captura.
   - 4 dudas de negocio que bloquean el modelo de datos (folio duplicado,
     precio por quién, tarifa de hora extra, numeración de cotizaciones).
   - Relación con PLAN-COMERCIAL-OPERACIONES del 11-11: cierra la P1
     (conciliación semanal de proveedores externos) y aporta evidencia a O10;
     corrige el "cero impacto" de /cotizaciones /ventas /ventas/corte.
2. **`.gitignore`** — se ignoró `/docs-svr/`: son documentos operativos del
   cliente (Excel/Word con nombres, RFC, montos) que no deben versionarse.

## Archivos tocados

- `docs-prioridades/ANALISIS-DOCS-SVR-PROCESOS-EXCEL-2026-11-12.md` (nuevo)
- `.gitignore` (1 bloque añadido)
- `historial-cambios/2026-11-12-analisis-docs-svr-mapeo-modulos.md` (este registro)

## Verificación / pruebas

- Solo docs + gitignore — sin código.
- Extracción y lectura completa de los 12 archivos (sharedStrings, hojas,
  fórmulas del bloque semanal de PRODUCTIVIDAD, texto íntegro de los Word).
- Git: `git check-ignore docs-svr/` confirma que la carpeta queda ignorada sin
  afectar lo ya versionado (la carpeta no estaba en el repo).

## Pendientes / riesgos

- Los 4 puntos bloqueantes del §5 del análisis requieren respuesta del cliente
  (folio de retiro, regla de precio, tarifa de hora extra, serie de
  cotizaciones) antes de modelar el módulo de retiros.
- `DATOS UNIDADES` (catálogo externo de unidades) no fue entregado: las
  equivalencias camión→placa son parciales, inferidas de valores cacheados.
