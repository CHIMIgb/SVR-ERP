# Ignorar .turbo/ de la raíz (caché de Turborepo de builds locales)

**Fecha:** 2026-11-15
**Autor:** Agente (higiene, autorizado implícitamente al reportar el usuario el working tree sucio)

## Cambio

`.gitignore`: línea nueva `.turbo/` — el diagnóstico del build de Railway dejó artefactos de
caché de Turborepo en la raíz (`.turbo/cache/*.tar.zst`, manifests) que aparecían como
sin-rastrear en el editor. Ya existía `apps/web/.turbo/`; faltaba el de la raíz. Los archivos
nunca se commitean (caché regenerable).

## Verificación

- `git status --porcelain` limpio tras el commit ✓
- Push a `main` ✓ (`78b7308e`)

## Pendientes / riesgos

- Ninguno. Los archivos de caché quedan en disco (regenerables; borrarlos a mano no afecta).
