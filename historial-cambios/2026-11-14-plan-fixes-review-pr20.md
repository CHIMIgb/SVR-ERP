# Plan de fixes de la review del PR #20

**Fecha:** 2026-11-14
**Autor:** Agente

## Cosas nuevas
- Plan completo en `docs-planes/PLAN-FIXES-REVIEW-PR20-2026-11-14.md` para atender la review del
  PR #20: (1) `Tabs` con `w-fit` desborda en móvil → `w-fit max-w-full`; (2) el contador de modales
  de `Modal.tsx` decrementa aunque el modal nunca abrió → early-return cuando `!open`; (3) 13 de 20
  migraciones nuevas no idempotentes → `IF NOT EXISTS`/`DO $$ ... $$` (con la advertencia del
  checksum en `_prisma_migrations` y dos opciones: solo idempotencia — recomendada — o también
  renombrar los directorios con prefijo duplicado); (4) GitGuardian: falsos positivos, acción solo
  en el panel, sin código.
- El análisis previo verificó cada punto (mecanismo CSS del `w-fit`, los 3 caminos del bug del
  contador, el inventario exacto de las 13 migraciones y sus patrones, y los veredictos positivos de
  la review: `emitirARol` con try/catch, `usuario_id` en transacción, merge limpio con main).

## Archivos tocados
- `docs-planes/PLAN-FIXES-REVIEW-PR20-2026-11-14.md` (nuevo)

## Verificación
- Solo documentación — sin código.

## Pendientes / riesgos
- Ejecución por fases: fix 1 ya committeado (`6dd6b718`); siguen fix 2, fix 3 (pendiente decisión
  Opción 1/2 del usuario) y la acción externa del punto 4.
