# 2026-11-12 — docs: el proyecto ES la obra — se elimina el flujo "proyecto → varias obras"

## Qué se decidió

El usuario decidió que **no existirá el botón/acción «Agregar obra» ni el diseño de
un proyecto con una o varias obras**. El sistema maneja **un solo nivel: `proyectos`**
— el proyecto es la obra en sí. Se elimina: obra base automática, multi-frente,
retiro de la base al crear la primera manual, sync de estados obra↔proyecto y
`obras[]`.

Lo que antes era la tarea **B2 (flujo proyecto→obra, 6.6)** pasa a ser la
**consolidación P15** (`obras` → `proyectos`), que además resuelve el catálogo cojo
de `/operaciones` (4 de 6 proyectos activos sin obra).

## Qué se tocó

1. **`docs-prioridades/PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md`**
   - §1: B2 redefinida como P15 + nota de la decisión del 2026-11-12.
   - Orden de arranque: B2 = consolidar `obras` en `proyectos`.
   - A1/Pr2 "varias obras" → "varios proyectos"; Pr3/Pr4/Pr5, Fa1, C4 y
     entregables §6 alineados a proyecto (la obra = el proyecto).
   - Nota de F3: el retiro se amarra al proyecto (CLAVE 2).
2. **`docs-prioridades/IMPLEMENTACIONES-A-FUTURO.md`**
   - §6.6: el bloque "DEBE SER (obra base / multi-frente / botón Agregar obra)" se
     reemplaza por la nota de **ELIMINADO** + la vía P15; header, impacto, workflow
     y "flujo pendiente" depurados de `obras[]`.
   - P15: nota "Reforzada 2026-11-12" (el proyecto ES la obra, es B2 del plan).
   - P3, diagramas §4/§6, §6.3, §6.4, §6.7, tabla §7 (P3, 6.1, 6.6), §8 y matriz
     §11 F4 alineados a `proyectos` (sin `obras`).

## Verificación / pruebas

- Solo documentación — sin código ni migraciones.
- Confirmado antes del cambio: `proyectos.service.ts` no escribe en `obras` y no
  existe backend de `obras`, así que no había nada construido que deshacer.

## Pendientes / riesgos

- **P15 es una migración destructiva** (FK `obra_id`/`obra_texto` en
  `bitacoras_operacion`, `reportes_campo`, asistencia, bitácoras-renta y nómina;
  `DROP TABLE obras`): requiere dump de respaldo y revisión módulo por módulo
  antes de ejecutarse.
- El catálogo `/catalogos/obras` y sus usos en el front se retiran hasta que P15
  esté lista — mientras tanto `/operaciones` sigue viendo solo las 3 obras del
  dump.
