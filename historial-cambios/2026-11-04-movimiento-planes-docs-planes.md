# Reorganización: planes e implementaciones a docs-planes/

**Fecha:** 2026-11-04
**Autor:** agente OpenCode (a petición del usuario)

## Cambios realizados
- Se movieron a la nueva carpeta `docs-planes/` (raíz) los 11 `.md` de planes,
  hojas de ruta e implementaciones:
  - `PLAN-VISTAS.md`, `PLAN-ARQUITECTURA.md`
  - `IMPLEMENTACIONES-A-FUTURO.md`
  - `FLUJO-PROGRESO-PROYECTOS.md`
  - `PENDIENTES.md`
  - `implementation_plan.md`, `implementation_plan copy.md`,
    `implementation_plan_fase3_facturas_backup.md`, `_fase4`, `_fase5`, `_fase6`
  (movidos con `git mv` para conservar historial).
- Quedan en la raíz solo los documentos de la aplicación:
  `README.md`, `AGENTS.md`, `COMPONENTS.md`, `RBAC.md`, `DECISIONS.md`,
  `audit-service-guide.md`.
- Referencia viva actualizada: `.github/PULL_REQUEST_TEMPLATE.md` apunta ahora a
  `docs-planes/IMPLEMENTACIONES-A-FUTURO.md`. Las menciones históricas dentro de
  `workflow/` e `implementation_plan*` (atribuciones "Fuente:") se dejan tal cual:
  siguen siendo rastreables en `docs-planes/`.

## Cosas nuevas
- Carpeta `docs-planes/` (solo planes/implementaciones).

## Archivos tocados
- `docs-planes/` (creada) + 11 .md movidos
- `.github/PULL_REQUEST_TEMPLATE.md` (ruta actualizada)

## Pruebas / verificación
- `git status` limpio tras el commit; archivos presentes en `docs-planes/` y raíz
  reducida a los 6 .md de la app.

## Pendientes y riesgos
- Ningún riesgo funcional (solo docs). Menciones históricas en `workflow/` no
  apuntan a `docs-planes/` — quedan como contexto de origen.
