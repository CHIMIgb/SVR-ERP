# Planificación — 11 ítems nuevos en `IMPLEMENTACIONES-A-FUTURO.md`

**Fecha:** 2026-11-06
**Autor:** agente OpenCode

## Cambios realizados
Actualización de `docs-planes/IMPLEMENTACIONES-A-FUTURO.md` (solo docs, sin código):

1. **Índice al inicio** (tabla §0–§11) — navegación, incluye los bloques P1–P7 y
   el nuevo F1–F6.
2. **§9 conciliación — decisión documentada:** la asignación queda **POR VISTA**
   (no por concepto), para simplificar el flujo; nota explícita de que no se
   agregará capa concepto→cuenta. El resto de §9 queda tall como estaba
   (movimientos esperados automáticos + CSV + auto-conciliación).
3. **P4 ampliado con sub-flujo P4b:** la venta del POS descuenta inventario y
   registra `movimientos_inventario` — verificado en schema que `ventas_items`
   YA cruza a `articulos_inventario`, así que P4b NO depende de P2. Incluye
   medida sin factor (`MEDIDA_SIN_FACTOR`), idempotencia del POS y tests.
4. **P7 ampliado:** registro de tipo de unidad ligado a precio **editable fácil
   por los encargados** (editor de tabla medida+precio, RBAC `puede_editar` de
   `/inventario`); nota de unique `(articulo_id, medida)` → `CODIGO_DUPLICADO`.
5. **§11 nueva "Plataforma, POS y experiencia" (F1–F6):**
   - **F1** notificaciones funcionales: modelo `notificaciones` (hoy no existe —
     verificado), API con 4 checkpoints, emisión desde 3–4 eventos de dinero,
     coser el centro del Topbar al API (hoy mock en memoria), audiencia por rol.
   - **F2** loaders/skeletons: auditoría de vistas con spinners manuales →
     unificar sobre `LoadingState`/`Skeleton` ya existentes (nada nuevo).
   - **F3** validación en todos los formularios: el API ya responde 422 con
     `details`; faltan toasts `details.join(' · ')` universalizados (un helper,
     no 30 copias) + inventario de FormModal.
   - **F4** comprobación de flujos de datos Operaciones/Comercial: matriz
     vista→insumos; ya al 100% el ciclo de dinero y la OC→recepción→stock
     (Fase 7), referencia a §6 y `workflow/README.md`.
   - **F5** config POS: **verificado que `aperturas_caja`/`cierres_caja` NO
     tienen campos de horario** — el gate no existe; incluye venta fuera de
     horario con override admin y TZ America/Mexico_City; **F5b** categorías
     visibles del POS configurables (por ahora solo Materiales de Construcción,
     sin hardcode).
   - **F6** seeds demo de workflows completos (`seed-demo-workflows.ts`,
     idempotente, **NO correr en producción** — gate explícito).
6. **§7:** filas F1–F6 agregadas con estados verificados + P4 actualizado (P4b
   no depende de P2) + nota de orden sugerido actualizada (F5 y P4b van juntos).

## Verificación contra `schema.prisma` (para redactar los textos)
- `ventas_items.articulo_id` FK real a `articulos_inventario` ✔ (línea ~1815)
- `articulos_precio` unique `(articulo_id, medida)` ✔ (línea ~1765)
- `aperturas_caja`/`cierres_caja`: sin campos de horario ✔ (el gate de F5 no existe)
- No existe modelo `notificaciones` ✔ (F1 parte de cero)
- No existe `config_cuentas_origen` ✔ (§9 sigue pendiente por completo)

## Archivos tocados
- `docs-planes/IMPLEMENTACIONES-A-FUTURO.md`

## Pendientes y riesgos
- Este documento es planificación: los F1–F6 y P4b NO están implementados; los
  estados "⏳" se verificaron contra el código/schema de hoy, pero habrá que
  re-verificarlos al ejecutar cada uno.
- F5 necesita decidir dónde vive la configuración del POS (tabla nueva vs.
  settings existentes) — se deja abierto en §11 F5a, punto 1.
