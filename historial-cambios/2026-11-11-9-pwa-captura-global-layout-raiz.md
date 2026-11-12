# PWA — captura del evento de instalación movida al layout raíz (React 19 no ejecuta <script> en cliente)

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base`

## Diagnóstico

Nuevo error de consola: «Encountered a script tag while rendering React
component» en `(pwa)/layout.tsx`. Causa: React 19 **no ejecuta** los
`<script>` que él mismo renderiza durante un render de CLIENTE — el
script de captura vivía dentro del layout `(pwa)`, que se re-renderiza
por navegación (login → `/m` tras autenticar): React lo encontraba sin
ejecutarlo (warning) y la captura se perdía en ese flujo.

## Fix

1. **Layout raíz** (`app/layout.tsx`, server component, `<head>`): el
   script de captura de `beforeinstallprompt` vive ahora ahí — corre al
   parsear en CADA carga completa, en cualquier página (el usuario
   aterriza primero en el login), y el layout raíz no se re-renderiza en
   navegaciones internas → React nunca lo encuentra en el cliente. Es un
   listener PASIVO (guarda el evento en `window.__svrPrompt`; no cambia
   nada visible del escritorio — excepción justificada de la regla de
   independencia: es plomería del navegador compartida).
2. **`(pwa)/layout.tsx`**: fuera el `scriptCaptura` y sus dos usos. El
   registro del SW queda en el effect (solo producción) y el observer
   del meta theme-color también (corre post-hidratación; el intento de
   fijar el meta al parsear era especulativo y se retiró con el script).

## Archivos tocados

- `apps/web/src/app/layout.tsx` (script de captura global en el head)
- `apps/web/src/app/(pwa)/layout.tsx` (scriptCaptura eliminado)

## Pruebas / verificación

- `tsc --noEmit` ✅; eslint ✅.
- En el teléfono/navegador: entrar por login → `/m` (navegación interna)
  ya no debe lanzar el warning; el modal de instalación con botón
  «Instalar» → diálogo nativo cuando Chrome entregue el evento.

## Pendientes y riesgos

- Sin push (orden del usuario).
- La actualización del `<meta name="theme-color">` al parsear se retiró:
  ahora la hace el `MutationObserver` post-hidratación — si la barra del
  app instalada dejara de seguir el tema al arrancar (versión de Chrome
  que solo lee el meta temprano), se reintroduce con un flag del
  servidor en vez de un script de cliente.
