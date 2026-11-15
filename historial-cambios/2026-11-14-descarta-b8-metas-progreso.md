# 2026-11-14 — B8/P8 (metas de progreso con fecha límite) descartada

## Qué se hizo

Decisión del cliente: se quita B8/P8 de la documentación para no complicar
las cosas (el progreso del proyecto sigue siendo captura manual en
`/proyectos`). Se dejaron trazas mínimas "⛔ DESCARTADA" igual que con P15.

**PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md** (5 ediciones):
- Fila B8 de la tabla §1 → `⛔ DESCARTADA (2026-11-14 — decisión del
  cliente: no complicar las cosas)`; ya no es la siguiente.
- Orden de arranque (§1): `B8 → B9` → `B9` (la siguiente es B9, vendedor
  real en `/cotizaciones`).
- §8 nota de prioridad: "(P2 partidas, P6 vendedor, P8 metas…)" → sin P8.
- §8 hilo de dependencias: "el resto (6.2–6.6, P8, F1…)" → sin P8.
- §10 "Fuera de B2": fuera la viñeta "P8 metas/progreso".

**IMPLEMENTACIONES-A-FUTURO.md** (7 ediciones):
- Sección **§P8 completa (líneas 597–646) reemplazada** por una nota de 2
  líneas: ⛔ DESCARTADA — progreso manual como hoy; `hitos_progreso` se
  conserva tal como está (curva S del modal, hoy mock).
- Intro (lista de series que tocan las vistas): sin P8.
- Orden del plan citado: `B7–B9 → B8–B9` → `B7–B9` (de paso corrige el
  "B7–B9 → B8–B9" que era typo heredado).
- Índice §3: fuera "P8 metas de progreso con fecha límite".
- Tabla de prioridades (🟡 Fáciles-medios): ítem 8 ahora `**P8** ⛔
  DESCARTADA (2026-11-14 — decisión del cliente)`.
- Bullet "Avance/estado: `proyectos.progreso` deriva de metas/hitos — ver
  P8" fuera (sección /proyectos).
- Fila P8 de la tabla de estado (§ series) fuera.
- Fila `/reportes` Tier 1 #8: "progreso ← metas P8 / transacciones por
  costo" → "progreso ← transacciones por costo" (lo de metas era el cruce
  con P8; la transacción por costo es 6.3 y sigue viva).

**No se tocó:** nada de código (`hitos_progreso` existe en el schema y no
se elimina — es deuda del mock del modal 6.6.1, tema aparte); el flujo 6.3
(reportes → progreso) sigue vigente; `docs-svr` intacto.

## Verificación

- grep posterior en ambos archivos: la única aparición de P8/B8/metas es
  la nota de descartada (PLAN línea 56, IMPLEMENTACIONES nota §P8 y trazas
  de las tablas).
- Encoding verificado (0 caracteres corruptos en ambos .md).

## Pendientes / riesgos

- La siguiente tarea del plan es ahora **B9 (vendedor real en
  `/cotizaciones`)**.
