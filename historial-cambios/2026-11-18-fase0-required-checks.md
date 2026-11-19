# Fase 0: checks obligatorios en el ruleset de main

**Fecha:** 2026-11-18
**Autor:** Agente (autorizado por el usuario — "comienza con la Fase 0")

## Contexto

El plan `docs-planes/PLAN-CI-CD-ENDURECIMIENTO.md` identificó que los workflows
estaban verdes pero ningún check era obligatorio para mergear. La Fase 0 agrega
la regla `required_status_checks` al ruleset `Protección main` (id `21267691`)
sin tocar el `bypass_always` de `CHIMIgb`, que el usuario declaró intocable.

## Cambios realizados

- **GitHub (ruleset `21267691`):** agregada la regla `required_status_checks`
  con contexts `web`, `api` e `integration` y
  `strict_required_status_checks_policy: true`. Se preservaron las 5 reglas
  previas (`deletion`, `non_fast_forward`, `pull_request`, `creation`,
  `update`), las condiciones (`refs/heads/main`), el `enforcement: active` y
  el `bypass_actors` (`User` `156728324`, `always`).
- Durante el primer PUT el nombre del ruleset se guardó mojibakeado por un BOM
  de PowerShell; se corrigió a `Protección main` con un segundo PUT y se
  verificó por codepoints (`ó` = 243).
- Documentación: `AGENTS.md` (regla 8), `.opencode/agent/svr-erp.md` y el plan
  (Fase 0 marcada como ejecutada, brecha B1 cerrada) registran el cambio.

## Archivos tocados

- `AGENTS.md` (modificado)
- `.opencode/agent/svr-erp.md` (modificado)
- `docs-planes/PLAN-CI-CD-ENDURECIMIENTO.md` (modificado)
- `historial-cambios/2026-11-18-fase0-required-checks.md` (creado)

## Pruebas / verificación

- `gh api repos/CHIMIgb/SVR-ERP/rulesets/21267691`: 6 reglas, la nueva con
  `web`/`api`/`integration` y `strict: true`; bypass y enforcement intactos;
  nombre correcto por codepoints.
- Los check runs publicados por GitHub en el SHA de `main` se llaman
  `integration`, `api` y `web`: los contexts del ruleset coinciden con los
  nombres reales de los jobs.
- `git diff --check`: sin errores.
- No se probó el bloqueo con un PR de prueba: no hay PR autorizado.

## Pendientes y riesgos

- **Bloqueo real detectado:** en el head de `main` el check `api` está en
  `failure` (run `44422735359`): 2 tests de `ventas.service.spec.ts` dependen
  del turno de cierre y fallaron a las 23:41 UTC (1415/1417 pasaron). Con el
  gate activo, cualquier PR queda bloqueado hasta que esos tests dejen de
  depender de la hora. Arreglarlos requiere autorización y plan aparte; no se
  hizo en esta fase.
- El `bypass_always` de `CHIMIgb` se mantiene por decisión del usuario: los
  push directos del owner siguen saltándose los gates.
- `origin/main` ya contiene el commit del plan (`4d82208c`); no se hizo push
  de este cambio porque el usuario no lo ordenó.
