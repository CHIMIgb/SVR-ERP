# 2026-11-12 — docs: índice de trabajo arrancable sin dudas en el plan comercial + rama comercial-operaciones

## Qué se hizo

1. **Rama nueva `comercial-operaciones`** creada desde `main` (`5ecdf884`... en
   realidad desde `1c3b6628` tras el último commit) — aquí arranca el trabajo
   de los planes de docs-prioridades.
2. **`PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md`** — nuevo **§1 "ÍNDICE DE
   TRABAJO — arrancable SIN respuestas"** al inicio del documento:
   - **Sección A** — reglas ya confirmadas del propio plan (F1): O2 checklist
     fix ⏳, O5 patio ⏳, O6 operador lista obligatoria con nombre completo ⏳,
     O8 foto de máquina ⏳; Fa2 ✅ (workflow 02, solo verificar), C1+O12 ✅,
     Pr2 ✅.
   - **Sección B** — de IMPLEMENTACIONES sin dependencia de dudas: B1 P2
     partidas + plantilla Word, B2 6.6 proyecto→obra, B3 FK ventas.cliente_id
     + alta rápida POS, B4 §10 vencimiento CxP, B5 F5 config POS, B6 F1
     notificaciones, B7 6.2, B8 6.4, B9 6.5, B10 P8 metas, B11 P6 vendedor.
   - **Orden de arranque**: A1–A4 → B2 → B1 → B3 → B4–B6 → B7–B9 → B10–B11.
   - **⛔ Excluido (espera respuestas)**: motor de retiros (precio/obra),
     validación de límite de crédito, conciliación semanal, formatos flete,
     desgloses de costeo.
   - Secciones renumeradas: COMERCIAL 2→3, OPERACIONES 3→4, Corrección 4→5,
     Entregables 5→6, Orden 6→7, Vínculo 7→8, Hilo 8→9.
3. **Incidente corregido:** un primer intento de renumeración vía PowerShell
   (Get-Content -Raw + WriteAllText) corrompió la codificación UTF-8 de todo
   el archivo (mojibake double-encoded). Se restauró desde git
   (`checkout HEAD --`) y se rehízo todo con el editor (UTF-8 limpio,
   verificado leyendo el archivo). Lección: no reescribir docs UTF-8 vía
   Get-Content de PowerShell.

## Archivos tocados

- Rama `comercial-operaciones` (nueva, desde `main` @ `1c3b6628`)
- `docs-prioridades/PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md` (§1 nuevo
  + renumeración §2–§9)
- `historial-cambios/2026-11-12-indice-trabajo-arrancable-plan.md` (este registro)

## Verificación / pruebas

- Lectura completa del archivo tras la restauración: acentos y emojis
  íntegros (UTF-8 correcto).
- Headers verificados: §1 índice, §2 vistas, §3 comercial, §4 operaciones,
  §5 corrección, §6 entregables, §7 orden, §8 vínculo, §9 hilo.

## Pendientes / riesgos

- La primera tarea concreta de la rama: **A1 (fix checklist luces/alarmas en
  /operaciones)** — requiere tocar código existente, se presenta su plan
  antes de escribirlo (regla dura del repo).
