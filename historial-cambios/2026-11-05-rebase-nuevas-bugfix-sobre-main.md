# Rebase de `nuevas-feature/bugfix` sobre `main` (PR #13 incluido)

**Fecha:** 2026-11-05
**Autor:** agente OpenCode (a orden del usuario)

## Cambios realizados
- **Rebase**: los **69 commits** de `nuevas-feature/bugfix` se re-aplicaron
  sobre `main` (que ya traía el merge del PR #13 — modo oscuro, marco
  responsivo, Asistencia limpia, módulo GPS). La rama quedó **solo adelantada
  a main** (nada detrás), cumpliendo la instrucción.
- **Conflicto resuelto a mano**: solo apareció uno — `Topbar.tsx` (sus tokens
  `ui-*`/ThemeToggle vs. nuestra remoción del recuadro emergente del usuario).
  Resolución final: **ambos** — tokens de modo oscuro + ThemeToggle (de él) sin
  el popup del menu (nuestro ajuste; cerrar sesión sigue en el sidebar).
- Verificación del árbol combinado:
  - `app.module.ts` conserva `GpsModule` (PR13) y NO restaura `IncidentesModule`
    (nuestra unificación) ✔; `src/incidentes/` sigue eliminado; `src/gps/` ✔.
  - `prisma generate` ✔ (schema con gps + unidades/reportes/proyectos).
  - **tsc --noEmit: api 0 errores ✔, web 0 errores ✔** (Fix del cierre extra de
    `</div>` introducido en la resolución).
  - Suite API: **1015/1017** — las mismas 2 fallas históricas de
    cobranza.service.spec (fecha-dependientes, no en el rebase).

## Comandos corregidos
- Primer `git rebase --continue` saltó conflictos de rebase tras resolución
  (69/69 firmes).

## Archivos tocados
- `apps/web/src/components/layout/Topbar.tsx` (conflicto; fix final).

## Pruebas / verificación
- `git log main..nuevas-feature/bugfix` = 69 ✔; `git status` limpio ✔.
- Verificación del rebase: main igual a origin/main; Se pudo correr tests ✔.

## Pendientes y riesgos
- La rama quedó con 69 commits para push solo con orden explicito. Fuerzas de
  trabajo del otro dev — no pushear hasta la orden del usuario.
- Historial confuso con el branch tracking para el origin — normal.
