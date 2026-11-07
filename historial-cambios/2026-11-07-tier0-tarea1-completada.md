# Avance — Tier 0 tarea 1 marcada completada (diagnóstico /operaciones)

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Cambios realizados (docs)
Índice de `IMPLEMENTACIONES-A-FUTURO.md`: tarea 1 del Tier 0 marcada **✅
completada** según decisión del usuario (la tarea se consideraba el diagnóstico).

## Qué quedó diagnosticado (resumen ejecutivo)
- /operaciones mostraba 3 de 6 proyectos EN_PROCESO porque el catálogo lista
  **obras**, no proyectos: la BD tiene solo 3 obras y 4 proyectos EN_PROCESO nunca
  tuvieron obra registrada (el flujo proyecto→obra no existe — doc 6.6).
- Verificado: sin bug de filtro (`GET /bitacora/catalogos` devuelve sin take y con
  filtro `estado != FINALIZADA` correcto), sin límite de código.

## Pendiente y riesgo
- El fix físico (sembrar las 4 obras) NO se ha ejecutado — espera el "go" del
  usuario; mientras no corra, el dropdown de /operaciones sigue mostrando 3.
- Siguiente tarea del Tier 0: #2 contraste dark en modal Ver Detalle.
