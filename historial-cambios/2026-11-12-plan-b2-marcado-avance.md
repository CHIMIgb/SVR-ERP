# 2026-11-12 — Plan comercial/operaciones: marcado el avance de B2 (obra 1:1 con el proyecto)

## Qué se hizo

Solo documentación: `docs-prioridades/PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md`.

- **§1, tabla de pendientes**: la fila **B2** pasa de `⏳` a
  `✅ hecho (83fb6198, c8423b02)` con la nota de que faltan B2.3 y B2.4.
- **§10**: bloque **"Avance (2026-11-12)"** con tabla fase → estado → evidencia
  (B2.1 y B2.2 ✅; B2.3 y B2.4 ⏳ parciales), las **desviaciones** respecto al
  plan (`migrate dev` no aplica en esta BD, se usó `db execute` +
  `migrate resolve --applied`; el catálogo de `/operaciones` quedó estricto
  `EN_PROCESO` en `230c2d60`) y la lista de ajustes posteriores de `/proyectos`
  con sus commits.
- Los encabezados de fase llevan su estado: B2.1 ✅ HECHA, B2.2 ✅ HECHA,
  B2.3 ⏳ PENDIENTE (parcial), B2.4 ⏳ PENDIENTE (parcial).
- El snapshot de BD del plan pasa a **"Estado ANTES de B2.1"** y se agrega
  **"Estado DESPUÉS de B2.1/B2.2"**: 16 proyectos vivos / 16 obras / 0 sin obra
  (verificado con `psql`).

## Verificación

- Archivo sigue siendo UTF-8 válido (0 caracteres de reemplazo) y sin
  duplicados de sección; 425 líneas.
- Conteo real en la BD: `proyectos vivos = 16`, `obras vivas = 16`,
  `proyectos sin obra = 0`.

## Pendientes / riesgos

- Lo que queda de B2 es **B2.3** (renombrar "obra" → "proyecto" en los labels del
  alta de `/proyectos`) y **B2.4** (`npm run test` completo, `npm run lint` y
  smoke manual de `/asistencia`); ninguno tiene autorización todavía.
- Los conteos del snapshot cambian con el uso normal de la app: son una foto,
  no un invariante (el invariante es 1:1, garantizado por el índice único).
