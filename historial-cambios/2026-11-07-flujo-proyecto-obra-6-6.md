# Diagnóstico — flujo de datos proyecto↔obra (no existe) documentado como "DEBE SER" en 6.6

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Diagnóstico (verificado en código y BD)
- La vista `/proyectos` le dice "obra" a lo que crea ("Registra una nueva obra...",
  "Ubicación de la obra" — líneas 729/792/944 de proyectos/page.tsx) — nomenclatura
  heredada — pero `proyectos.service.create` solo inserta en `proyectos`; nunca
  toca `obras`.
- La tabla `obras` NO tiene endpoint de creación ni UI: solo se lee por catálogos
  (`/catalogos/obras`, `/bitacora/catalogos`) y escriben specs; sus 3 filas son
  del dump/seed manual.
- Consecuencia en BD: 9 proyectos vs 3 obras; 4 proyectos EN_PROCESO sin obra →
  el catálogo de /operaciones muestra solo 3.

## Cambios realizados (docs)
- §6.6: nueva rama "Flujo de datos proyecto ↔ obra — HOY (verificado)" +
  "DEBE SER (diseño)": crear proyecto EN_PROCESO nace obra base (misma $transaction,
  guard idempotente), botón "Agregar obra" multi-frente con endpoint de obras (4
  checkpoints), sincronización de estados proyecto→obras, catálogos agrupados
  obra→proyecto, labels UI corregidos, tests unit + integración.
- Índice: el flujo proyecto→obra entra al **Tier 2** como tarea 11 (se renumeraron
  12–14 y el Tier 3 arranca en 15).

## Archivos tocados
- `docs-planes/IMPLEMENTACIONES-A-FUTURO.md`

## Pendientes y riesgos
- Cero código implementado del flujo; el seed de las 4 obras (Tier 0 tarea 1) sigue
  pendiente de confirmación del usuario (SQL ya propuesto: insert idempotente
  `WHERE NOT EXISTS`).
- El flujo "DEBE SER" puede ajustarse cuando se implemente (p.ej. si se decide que
  la obra base hereda ubicación del proyecto en lugar de capturarse después).
