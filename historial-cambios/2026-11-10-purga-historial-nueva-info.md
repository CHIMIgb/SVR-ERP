# Purga del historial: datos personales del cliente fuera del repo (nueva-info)

**Fecha:** 2026-11-10
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

Hallazgo CRÍTICO de la review del PR #17: `nueva-info/INFORMACION DE
EMPLEADOS.xlsx` con **datos personales de trabajadores** se había versionado
en un repo público. Borrar el archivo en un commit nuevo no lo elimina de la
historia (queda en commits previos consultables).

**Ejecutado:**
1. Respaldo de seguridad local: branch `backup-plataforma-pre-purga-20261110`
   (SIN pushear — contiene los datos purgados; borrarlo cuando se confirme el
   cierre con GitHub support).
2. Reconstrucción quirúrgica del historial: solo UN commit (c2093d82)
   introducía la carpeta. Se retrocedió a `61cc867d` y se reconstituyó:
   - Commit reducido `3e043f20` — conserva ÚNICAMENTE el registro de
     `historial-cambios/2026-11-09-versionado-nueva-info.md` (registro
     inmutable; explica el repositorio de entonces).
   - `14a15ad0` y `32dca833` = re-aplicación exacta de los 2 commits
     posteriores (resumen cliente + plan review PR17), SHAs nuevos.
3. `git push --force origin plataforma-experiencia` (70243323 → 32dca833).
4. Verificación en remoto: `gh api repos/CHIMIgb/SVR-ERP/commits?path=nueva-info`
   → **0 commits** la alcanzan.
5. Body del PR #17 reconstruido desde fuente limpia (el edit anterior había
   metido mojibake por encoding de PowerShell) y actualizado: cifras (145
   archivos / +8,747), nota de purga, registros 60+.

## Archivos tocados

- Historial de `plataforma-experiencia` (rewritten; 3 commits nuevos SHAs).
- Ningún archivo de código: solo historia + este registro + PR body.

## Pruebas / verificación

- Local: `git log -- nueva-info` → 0 commits en rama; `git ls-files nueva-info`
  vacío; working tree sin carpeta.
- Remoto: API de GitHub → 0 commits con la ruta, tras force push.
- Diff de la rama recalculado: 145 archivos (+8,747/−2,369).

## Pendientes y riesgos

- **Los commits viejos pueden seguir alcanzables por SHA directo** en GitHub
  (copias vía PR/caché) hasta el GC de la plataforma — pedir a GitHub support
  la purga del objeto (detalle por WhatsApp). Mientras tanto los datos del
  Excel ya no están en ninguna rama ni en el PR #17.
- El branch local `backup-plataforma-pre-purga-20261110` aún contiene el
  archivo — NO pushearlo; eliminarlo cuando se confirme cierre.
- El equipo que tenga la rama clonada debe `git fetch && git reset --hard
  origin/plataforma-experiencia` (reescritura).
- La referencia del seco `7024332` (citada por el revisor) ya no existe: la
  punta vigente es `32dca833` (aclarado el paso en el PR).
