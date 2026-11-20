# Instrucciones del agente sincronizadas con COMPONENTS-PWA.md

**Fecha:** 2026-11-19
**Autor:** agente
**Continuación de:** `2026-11-19-components-pwa-doc.md`

## Cambios realizados
- `.opencode/agent/svr-erp.md` (instrucciones operativas del agente) ya no
  manda documentar los componentes PWA en `COMPONENTS.md` — tres ediciones:
  1. Regla PWA: los nuevos de `src/components/pwa/*` se documentan en
     `COMPONENTS-PWA.md`.
  2. Árbol de decisiones («¿Componente nuevo?»): doc en `COMPONENTS.md`
     (kit `ui/`) o `COMPONENTS-PWA.md` (componentes `pwa/`), según carpeta.
  3. Guía de estilos: `COMPONENTS.md` documenta el kit compartido y
     `COMPONENTS-PWA.md` los de la PWA.
- Las menciones de kit (`components/ui/*` → `COMPONENTS.md`) quedaron como
  estaban: ahí el archivo sigue siendo el correcto.

## Archivos tocados
- `.opencode/agent/svr-erp.md` (3 líneas)
- `historial-cambios/2026-11-19-agente-sync-components-pwa.md` (creado)

## Verificación / pruebas
- `git diff --check`: pendiente de validar en el commit (solo docs).

## Pendientes y riesgos
- Ninguno identificado: es documentación operativa; las demás referencias a
  `COMPONENTS.md` del archivo son del kit y siguen correctas.
- Sin push: el commit queda local.
