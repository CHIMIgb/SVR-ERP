# Hoja de ruta: P4b confirmado implementado + limpieza del doc

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

- Verificado contra el código que el flujo **P4b (venta POS descuenta inventario)** ya
  está implementado: `ventas.service.ts` descuenta stock en la `$transaction` de la
  venta con `updateMany` condicional (guard anti-carrera), inserta
  `movimientos_inventario` SALIDA con motivo `Venta POS` / `referencia_tipo
  'VENTA_POS'`, y audita `STOCK_INSUFICIENTE` en fallo. El doc
  `docs-planes/IMPLEMENTACIONES-A-FUTURO.md` ya lo marcaba ✅ en las 3 partes
  (tabla Tier 1, §3 P4b, §7) — nada que marcar de más.
- Limpieza del mismo doc: quitado el pegado crudo del error `categoriaId must be a
  UUID` que quedó incrustado dentro de la tabla del Tier 1, reemplazado por una nota
  que referencia el fix `20261108000000_fix_uuids_categorias_unidades` (commit
  `822a2daf` de este día, ver historial-cambios), fue al punto de decisión del
  roadmap.

## Cosas nuevas

- Ninguna (la hoja de ruta queda congelada ahí por instrucción del usuario hasta los
  próximos cambios).

## Archivos tocados

- `docs-planes/IMPLEMENTACIONES-A-FUTURO.md` (modificado — limpieza + nota del fix)

## Pruebas / verificación

- Grep en `ventas.service.ts`: `updateMany` anti-carrera, `movimientos_inventario`,
  `'Venta POS'`/'VENTA_POS', `STOCK_INSUFICIENTE` — implementación presente.
- Doc re-leído post-edición: la tabla del Tier 1 queda íntegra y sin el pegado.

## Pendientes y riesgos

- Roadmap congelado por decisión del usuario: P8 y P6 siguen pendientes como próximo
  paso natural del Tier 1 cuando se rete.
