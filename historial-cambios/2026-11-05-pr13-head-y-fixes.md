# PR #13 — fixes de review en el head (rama del autor force-pusheada)

**Fecha:** 2026-11-05
**Autor:** agente OpenCode (a orden del usuario)

## Cambios realizados
- El dev había puesto sus fixes de revisión (commit `42d40dd`) en la rama
  `ui-limpia-rrhh-maquinaria-2`, pero el **head del PR #13 seguía en
  `88e839f** (efecto de un force-push: GitHub no recalcula el head del PR solo).
- Diagnóstico hallado: `git/refs/heads/ui-limpia-rrhh-maquinaria` ya apuntaba a
  `42d40dd` (commit), pero el objeto del PR (head record/9 commits/88 files)
  conservaba el valor viejo.
- Resuelto cerrando y re-abriendo el PR (con comentario explicativo, sin tocar
  contenido): head actualizado a `42d40dd`, 89 archivos (+1 = el registro nuevo).
- Los 3 fixes verificados dentro del diff del PR ahora:
  1. test del trigger inmutable de registro_auditoria (rechaza DELETE y UPDATE),
  2. `LIMITE_CRUCES_HISTORIAL = 200` + take en findHistorialMaquina,
  3. registro complementario de Commits GPS/responsividad
     (`2026-11-05-registro-gps-y-revision-pr13.md`).
- No se pusheó el commit de Nómina (`a024ba1` — "Nomina limpia…"). Está unicado
  en la rama `-2` para su PR aparte, como el propio autor declaró.

## Archivos tocados
- Remoto (GitHub): PR #13 cerrado y re-abierto + comentario de re-revisión
  (`https://github.com/CHIMIgb/SVR-ERP/pull/13#issuecomment-6665492876`).
- Repo local: nada (la rama `-2` pasó de servir de descanso de fixes).

## Pruebas / verificación
- `pulls/13.head.sha = 42d40dd` ✔; `files.length = 89` ✔;
  diff contiene los 3 fixes ✔ (grep en el diff).

## Pendientes y riesgos
- PR #13 listo para merge cuando el usuario ordene (Our review remains).
- La rama `-2` sobra una vez fusione (se puede borrar).
- Nómina (a024ba1) queda para su PR propio.
