# Plan de saneamiento offline y sincronizador PWA (para 2026-11-19)

**Fecha:** 2026-11-18
**Autor:** agente

## Cambios realizados
- Se creó `docs-planes/docs-pwa/PLAN-SINCRONIZACION-OFFLINE-PWA-2026-11-19.md` con tres tareas a ejecutar mañana antes de empezar las vistas de Operaciones: (1) estado por registro y distinción de 409 frente a error de red, (2) refresh del token en el sincronizador, (3) arranque del sincronizador en desarrollo.
- Cada tarea incluye la situación real del código con archivos y líneas, qué hay que hacer con plan previo, los callers a revisar, el riesgo específico y la verificación. El plan propone el orden 3 → 2 → 1 y un criterio explícito para arrancar `/m/reportes`.
- Se dejó fuera del plan, como contexto, la deuda del dump de integración sin regenerar y el hecho de que hoy ninguna vista llama a `encolar()`.

## Cosas nuevas
- Plan fechado en `docs-planes/docs-pwa/`, hermano de `VISTAS-PWA.md`.

## Archivos tocados
- `docs-planes/docs-pwa/PLAN-SINCRONIZACION-OFFLINE-PWA-2026-11-19.md` (creado)
- `historial-cambios/2026-11-18-plan-sincronizacion-offline-pwa.md` (creado)

## Verificación / pruebas
- `git diff --check`: sin errores.
- No se corrió ningún gate de código: el cambio es solo documentación.

## Pendientes y riesgos
- El plan no ejecuta nada: los tres puntos siguen abiertos y cada uno exigirá su propio plan y autorización antes de tocar código.
- Riesgo principal si se ignoran: capturas sin feedback visible, capturas perdidas por 401 y entrega imposible de probar en desarrollo.
- Sin push: el commit queda local, como indica la regla del repo.
