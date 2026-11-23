# nómina + proveedores + ventas emiten con el catálogo (commit c de 3)

**Fecha:** 2026-11-20
**Autor:** agente
**Plan de origen:** catálogo de alertas autorizado 2026-11-20 (tras `075e2b80`)

## Cambios realizados
- Los **3 sitios restantes** de emisión ahora usan el catálogo — con esto el
  refactor queda COMPLETO y ya no existe ningún texto de notificación inline
  en el API:
  - `nomina.service.ts`: `NOMINA_PAGADA` (rol Administrativo).
  - `proveedores.service.ts`: `OC_APROBADA` y `ABONO_ORDEN` (rol Administrativo).
  - `ventas.service.ts`: `CIERRE_PENDIENTE` (rol Administrador).
- `TipoNotificacion` quedó sin uso en los 3 services → retirado de los imports
  (el enum solo vive en el catálogo y el prisma client).
- Textos idénticos al copy vivo (el formateo de dinero es-MX/MXN ahora lo
  centraliza la función `moneda` del catálogo).

## Verificación / pruebas
- `npm run build`: OK.
- Unit de los módulos tocados + notificaciones + catálogo: **220/220**
  (13 suites — incluye nomina, proveedores, ventas, notificaciones, catalogo).
- `git diff --check`: sin errores. `npx tsc --noEmit`: 0 errores.

## Archivos tocados
- `apps/api/src/nomina/nomina.service.ts`
- `apps/api/src/proveedores/proveedores.service.ts`
- `apps/api/src/ventas/ventas.service.ts`
- `historial-cambios/2026-11-20-catalogo-resto-modulos.md` (creado)

## Pendientes y riesgos
- El catálogo completo del plan quedó en 3 commits: (a) `abea901e`, (b)
  `075e2b80`, (c) este. Siguientes pasos del sistema identificados: deep-link
  por `referencia_id` en el escritorio y conectar la PWA.
- Sin push: el commit queda local.
