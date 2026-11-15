# 2026-11-12 — docs: B2 = obra 1:1 con el proyecto (se descarta P15 / consolidar `obras` en `proyectos`)

## Qué se decidió

El usuario revirtió la decisión anterior: **la tabla `obras` NO se elimina**. Se
conserva con **relación 1:1 con el proyecto** — un proyecto crea **UNA** obra en
la misma `$transaction` y esa obra alimenta `/operaciones`, asistencia (geocerca)
y bitácoras. Se descartan:

- el diseño **multi-frente** (obra base automática, botón «Agregar obra», `obras[]`);
- la **consolidación P15** (`obras` → `proyectos`, `DROP TABLE obras`).

Esto sustituye lo registrado en `2026-11-12-proyecto-es-la-obra.md` (commit
`6612a501`), que queda como antecedente revertido.

El plan de B2 se registró **por fases** en
`PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md` §10 (B2.1 datos → B2.2 backend →
B2.3 UI → B2.4 gates), porque toca datos, backend y UI y cada fase debe
verificarse y commitearse sola.

## Qué se tocó

1. **`docs-prioridades/PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md`**
   - §1 fila B2: "obra 1:1 con el proyecto" (el proyecto nace con UNA obra,
     sync de estados, se retira multi-frente y «Agregar obra») + estado
     "plan por fases en §10".
   - Nota de decisión 2026-11-12 reescrita (1:1, P15 descartada) y orden de
     arranque actualizado (B2 = obra 1:1).
   - Pr3/Pr4 y entregables §6: coordenadas y radio viven en la obra 1:1.
   - §9: P13–P15 → P13–P14 (P15 ya no existe como tarea).
   - **§10 nuevo:** plan B2 por fases con estado real de la BD (9 proyectos /
     3 obras, faltan 6), migración con índice único + backfill + normalización
     de estados, cambios de `proyectos.service.ts` (create/update/remove en
     `$transaction`), tests unit + integración, UI mínima y gates.
2. **`docs-prioridades/IMPLEMENTACIONES-A-FUTURO.md`**
   - §6.6: el bloque "❌ ELIMINADO" vuelve al diseño **1:1** (nace la obra con el
     proyecto, `proyecto_id` único, sync de estados, soft-delete en cascada,
     catálogos sin cambio, labels de `/proyectos`).
   - P15 marcada **❌ DESCARTADA** (su inventario queda como histórico, "no se
     ejecuta").
   - Tier 0 #1, Tier 2 #11, §6.3, §7 (filas 6.1 y 6.6) y matriz §11 F4 alineados
     a la obra 1:1 / B2.

## Verificación / pruebas

- Solo documentación — sin código ni migraciones.
- Datos verificados en la BD local: 9 proyectos vivos (6 EN_PROCESO), 3 obras
  (las 3 ya 1:1 con un proyecto del mismo nombre, sin geocerca), 6 proyectos sin
  obra, 3 `registros_asistencia` con `obra_id`, 0 bitácoras/reportes con
  `obra_id`. "Puente Atizapán": proyecto FINALIZADO con obra EN_PROCESO (lo
  corrige la fase B2.1).

## Pendientes / riesgos

- **B2 no está implementado** — requiere autorización previa; el plan §10 es
  solo el diseño.
- La fase B2.1 **inserta datos** (6 obras) y agrega un índice único: exige
  respaldo (`pg_dump`) y `migrate deploy` en el servidor.
- `PAUSADO` no tiene equivalente en `EstadoObra`: la obra de un proyecto pausado
  no cambia de estado (decisión documentada en §10; si el cliente quiere
  ocultarla del catálogo, se agrega el valor del enum en otra fase).
