# Rama al día con main después del PR #15

**Fecha:** 2026-11-07
**Autor:** P4chec0php

## Cambios realizados
Se fusionó `main` (con el PR #15 ya integrado) en `ui-limpia-rrhh-maquinaria`.

Choques:
- **`RecibosNominaModal.tsx` y `LiquidacionModal.tsx`:** se conserva la versión limpia de esta rama. En `main`
  el único cambio a estos dos archivos fue `bg-slate-900` → `bg-secondary dark:bg-ui-200` en 4 elementos
  (encabezado del modal, etiqueta de método de pago, total neto y etiqueta del convenio). Esos elementos ya no
  existen en la versión limpia. El recibo y la carta de finiquito siguen en blanco a propósito, también en modo
  oscuro, porque son documentos que se imprimen y se firman.
- **`schema.prisma`, `audit.constants.ts`, `globals.css` y `lib/api.ts`:** se fusionaron solos. Se revisó
  que el enum `AuditAction` (136 valores) no tenga duplicados y que todos estén en `ACTION_SEVERITY_MAP`.

## Archivos tocados
- `apps/web/src/components/layout/RecibosNominaModal.tsx`
- `apps/web/src/components/workers/LiquidacionModal.tsx`
- Lo que trae `main` del PR #15.

## Verificación
- `npx prisma validate` y `npx prisma generate`: OK.
- `npx tsc --noEmit` en `apps/api` y en `apps/web`: sin errores.
- `npm run build` en `apps/web`: OK.
- Unitarias de la API: 1179 de 1181. Las 2 que fallan son las de `cobranza.service.spec` que dependen de la
  fecha (ya conocidas).
- `npm run lint` en `apps/web`: ninguno de sus 19 errores está en archivos de esta rama; vienen de `main`.

## Pendientes
- Aplicar en la BD local las migraciones de `main` que le faltan (13 de septiembre y las del PR #15).
