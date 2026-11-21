# Guías profundas de desarrollo en AGENTS.md y en el agente

**Fecha:** 2026-11-18
**Autor:** agente

## Cambios realizados
- Se agregaron 11 secciones nuevas al final de `AGENTS.md` bajo «Guías de desarrollo (web, PWA, componentes y CI/CD)»: arquitectura web (Next.js 16 App Router), arquitectura PWA (topología, ciclo de vida de la captura offline, RBAC y sesión), buenas prácticas web, buenas prácticas PWA, código mantenible, responsividad web, responsividad PWA, UI/UX web, UI/UX PWA, librería de componentes reutilizables, y CI/CD + DevOps + pipelines. Cada sección explica el criterio y el porqué, con reglas concretas para este repo (no texto genérico).
- Se agregó al agente `.opencode/agent/svr-erp.md` el bloque «Guías de desarrollo — aplicación operativa»: mapa de impacto previo, árbol de decisiones, tabla de verificación por tipo de cambio y cuatro checklists (web, PWA, componente de kit, pipeline). Apunta a las secciones de `AGENTS.md` para el detalle, sin duplicarlo.
- Se dejó constancia en `AGENTS.md` de que el contenido viejo («No backend», «Jest coming soon», `cn()` en `Sidebar.tsx`, raíz `src/`) describe una fase anterior y no se reescribió: las guías nuevas reflejan la realidad actual (`apps/api`, `apps/web/src`, `cn()` en `@/lib/utils`).

## Cosas nuevas
- Sección «Guías de desarrollo (web, PWA, componentes y CI/CD)» en `AGENTS.md` (11 subsecciones).
- Sección «Guías de desarrollo — aplicación operativa» en `.opencode/agent/svr-erp.md` (4 subsecciones).

## Archivos tocados
- `AGENTS.md` (se agregaron ~340 líneas al final; no se modificó nada existente)
- `.opencode/agent/svr-erp.md` (se agregó un bloque al final)
- `historial-cambios/2026-11-18-guias-desarrollo-agente.md` (creado)

## Verificación / pruebas
- `git diff --check` sobre los tres archivos del cambio: sin errores.
- Revisión manual del diff: solo documentación, sin cambios de código, BD ni workflows.
- Se corrigieron dos deslizamientos de texto detectados en el diff antes del commit (caracteres ajenos en una frase y una palabra en inglés).
- No se corrieron `tsc`, lint ni tests: el cambio no toca código.

## Pendientes y riesgos
- El contenido viejo y contradictorio de `AGENTS.md` sigue presente porque no autorizaron reescribirlo; la sección nueva manda aplicar la realidad actual. Riesgo: un agente que lea solo las primeras secciones puede seguir las instrucciones obsoletas.
- Había un cambio ajeno sin commitear en `docs-planes/docs-pwa/VISTAS-PWA.md` (guiones agregados a varias filas de la tabla). Se dejó intacto y **fuera** de este commit; sigue pendiente de que su autor lo commitee.
- Sin push: el commit queda local, como indica la regla del repo.
