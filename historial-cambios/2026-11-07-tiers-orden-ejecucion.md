# Planificación — orden de ejecución por dificultad (tiers) en el índice

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Cambios realizados
- `docs-planes/IMPLEMENTACIONES-A-FUTURO.md`: debajo del índice se agrega la tabla
  **"Orden de ejecución por dificultad (meta: revisión del martes)"** con los 4 tiers
  (0 Triviales → 3 Difíciles), numeración 1–14 y referencia cruzada a la sección de
  cada tarea. Incluye nota de la rama de trabajo `plataforma-experiencia`.
- El cuerpo del documento queda organizado por dominio (flujos P, §6 por vista,
  §11 F1–F6) — NO se reordenó el contenido: el índice es la vista por dificultad.

## Contexto
- Rama: `plataforma-experiencia` (creada hoy desde `0ece6167`, tip de main que ya
  incluye el doc y el merge del PR #15 — verificado que `origin/main` contiene
  los 2 commits de docs de ayer).
- Criterio de orden: dificultad de implementación + visibilidad para la demo del
  martes (propuesta presentada y acordada con el usuario el 2026-11-06).

## Pendientes y riesgos
- Ninguna tarea de los tiers está implementada todavía; hoy empieza Tier 0 (la primera:
  sembrar las obras de los 4 proyectos EN_PROCESO — se presentará el SQL antes de
  ejecutar inserts en la BD real).
