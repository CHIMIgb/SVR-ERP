# Checklist documentado para el Redeploy manual en Railway

**Fecha:** 2026-11-18
**Autor:** Agente (autorizado por el usuario — paso 4 de 4)

## Contexto

El deploy sigue siendo manual porque el usuario descartó pagar por automatizar
Railway. La documentación ya indicaba que hacía falta el Redeploy y el tag
`:latest`, pero los pasos estaban repartidos en un párrafo y no quedaba claro el
orden. El punto 4 del plan acordado es solo documentar el checklist; no se
automatiza nada ni se crea un script de digest.

## Cambios realizados

- `AGENTS.md` (regla 4 de CI/CD) y `.opencode/agent/svr-erp.md` (bullet de
  deploy): el procedimiento queda como checklist de 4 pasos — confirmar `:latest`
  en el servicio Web, tomar SHA y digest del run de `build-web`, ejecutar
  Redeploy, verificar la URL y registrar SHA + digest en `historial-cambios/`.
  Se conservan las notas de GHCR privado y de que el smoke no bloquea la
  publicación.

## Archivos tocados

- `AGENTS.md` (modificado)
- `.opencode/agent/svr-erp.md` (modificado)
- `historial-cambios/2026-11-18-redeploy-checklist.md` (creado)

## Pruebas / verificación

- `git diff --check`: sin errores.
- Solo documentación: no hay código, workflow ni script nuevo que verificar.

## Pendientes y riesgos

- El usuario debe revisar en Railway que el servicio Web apunte a `:latest`; no
  hay acceso ni token para hacerlo por él. Si apunta a un tag por SHA, el
  Redeploy repetirá la imagen vieja.
- El checklist no verifica por él que la URL responda: esa confirmación es
  manual y debe quedar registrada con el SHA y el digest del deploy.
- El punto 5 del plan (quitar el bypass de `main`) quedó fuera de alcance por
  decisión explícita del usuario.
