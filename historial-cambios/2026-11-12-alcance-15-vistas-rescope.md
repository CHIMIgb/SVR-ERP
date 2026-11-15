# 2026-11-12 — docs: alcance estricto de 15 vistas en los 4 documentos + re-scope del índice de trabajo

## Qué se corrigió

El usuario aclaró que las tareas de máquina (patio, operador, foto, checklist,
despachos, horómetro) NO le tocan — son del módulo Maquinaria. Verificación
contra el código: la vista `/operaciones` es **solo bitácoras de operación**
(`bitacoraApi`); fichas/checklists/despachos viven en `/maquinaria`.

1. **`PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md`**:
   - §1 índice RE-SCOPED: bloque de alcance estricto con las 15 vistas arriba;
     sección A ahora solo contiene lo confirmado que SÍ toca las vistas
     (Pr2 multi-obra `/proyectos` ✅, Fa2 `/facturas` ✅, C1/O12
     `/operaciones` ✅); los O1–O13 (checklist, patio, operador, foto,
     horómetro) pasaron a la sección **FUERA de alcance (módulo Maquinaria)**
     con nota de que el fix del checklist (O2) ya está implementado de punta
     a punta con tests (verificado hoy).
   - B del índice: salió 6.2 (`/incidentes` no está en las 15 vistas) y F5
     config POS (su pantalla vive en `/configuracion`, módulo Sistema — solo
     el gate de `/ventas` sería de este alcance, pendiente de acuerdo).
     Quedan: B1 P2 partidas, B2 6.6 proyecto→obra, B3 FK ventas.cliente_id,
     B4 §10 CxP, B5 F1 notificaciones, B6 6.4 criba, B7 6.5 inventario,
     B8 P8 metas, B9 P6 vendedor.
   - Orden de arranque: **B2 → B1 → B3 → B4 → B5 → B6–B7 → B8 → B9**.
   - §4 OPERACIONES: aclaración de ubicación física (los O-points viven en
     /maquinaria; de esta tabla cuenta bitácoras 6.1, Pr2 y los ✅ del §1).
2. **`ANALISIS-DOCS-SVR-PROCESOS-EXCEL-2026-11-12.md`** — bloque de alcance
   con las 15 vistas al inicio (los puntos que caen en maquinaria/RRHH son de
   otro dueño).
3. **`IMPLEMENTACIONES-A-FUTURO.md`** — el bloque del hilo conductor ahora
   lista qué series tocan las 15 vistas (P2, P3, P4, P6, P7, P8, 6.4, 6.5,
   6.6, C3, §9, §10, F1) y cuáles son de otro módulo (P13–P15, 6.2, F5).
4. **`PLAN-FUERA-DE-ALCANCE-SISTEMA-GPS-RRHH-MAQUINARIA-2026-11-12.md`** —
   nota de alcance: nada de este doc es de las 15 vistas (Sistema, GPS, RRHH,
   Maquinaria).

## Archivos tocados

- Los 4 documentos de `docs-prioridades/`
- `historial-cambios/2026-11-12-alcance-15-vistas-rescope.md` (este registro)

## Verificación / pruebas

- Solo docs — sin código.
- Verificación real: `operaciones/page.tsx` consume solo `bitacoraApi`
  (bitácoras de operación); checklists/despachos viven en `maquinaria/page.tsx`.
- El índice §1 quedó con las tareas re-mapeadas a vistas reales del alcance.

## Pendientes / riesgos

- El fix del checklist (O2) ya está hecho en /maquinaria — si el dueño de ese
  módulo lo toca de nuevo, el índice de ESTE plan ya no lo lista (evitar
  doble trabajo).
- F5 config POS queda sin dueño asignado: su pantalla es de Sistema y su
  gate de /ventas de este alcance — resolver cuando se toque /ventas (B3).
