# web-push import lazy — la suite completa de la API volvía a fallar

**Fecha:** 2026-11-20
**Autor:** agente

## Causa raíz (detectada en el pre-vuelo del PR)
El import estático `import * as webpush from 'web-push'` en
`notificaciones.service.ts` cargaba el paquete CJS en CADA módulo que
importa notificaciones transitivamente (ventas, nomina, proveedores,
reportes-campo) — y Jest no puede parsear `web-push` desde node_modules
("unexpected token") → **8 suites de controllers/specs fallaban por
compilación** en la suite completa (aunque los módulos sueltos pasaban
porque sus specs mockeaban `web-push`).

## Cambios realizados
- `notificaciones.service.ts`: import estático → **import dinámico lazy**
  dentro de `enviarPushesBestEffort` — el paquete solo se carga cuando
  realmente se envía (los specs lo mockean con `jest.mock`, que también
  intercepta import()). Comentario explicando el porqué.

## Verificación / pruebas
- **Suite completa de la API: 95 suites, 1449 tests — todas verdes**
  (antes: 8 suites fallidas por compilación).
- Integración notificaciones (BD real): 5/5 — el mock intercepta el
  import dinámico.
- `npm run build`: OK.

## Archivos tocados
- `apps/api/src/notificaciones/notificaciones.service.ts`
- `historial-cambios/2026-11-20-web-push-lazy.md` (creado)

## Pendientes y riesgos
- Ninguno identificado: el import dinámico es también arquitectónicamente
  correcto (solo se carga el paquete cuando se envía).
- Sin push: el commit queda local.
