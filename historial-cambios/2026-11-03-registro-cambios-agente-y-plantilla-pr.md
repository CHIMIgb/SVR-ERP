# Registro de cambios: carpeta historial-cambios + reglas de flujo

**Fecha:** 2026-11-03
**Autor:** agente OpenCode (sesión restauración BD + setup)

## Cambios realizados
- Se establece la regla dura de trabajo para todos los agentes: un commit por cambio
  (en español), cada commit con su registro fechado en `historial-cambios/`, y
  push/PR **solo por orden del usuario**.
  - Agregada a `AGENTS.md` (sección "Registro de cambios obligatorio").
  - Agregada a `.opencode/agent/svr-erp.md` (sección "Git y Pull Requests").
- Se expandió la plantilla `.github/PULL_REQUEST_TEMPLATE.md` a este stack real
  (Next 16/Turbopack, NestJS, Prisma 7, PostgreSQL 18; se eliminaron refs a Expo/mobile).
- Se creó el agente especializado del proyecto `.opencode/agent/svr-erp.md`
  (contrato API, 23 módulos, receta de endpoints, BD local, gotchas).
- Se creó esta carpeta con la convención y plantilla en su `README.md`.

## Cosas nuevas
- `historial-cambios/` (esta carpeta).
- `.opencode/agent/svr-erp.md`.
- `turbo@2.11.10` (la 2.4 no corre con Node 26: `spawn EFTYPE`) + `"packageManager": "npm@11.20.0"` en `package.json` raíz.

## Archivos tocados
- `AGENTS.md` (modificado)
- `.opencode/agent/svr-erp.md` (creado)
- `.github/PULL_REQUEST_TEMPLATE.md` (reescrito)
- `historial-cambios/README.md` + este archivo (creados)
- `package.json` / `package-lock.json` (modificados: turbo + packageManager)

## Pruebas / verificación
- `npm run dev` (turbo 2.11) levanta web en :3000 ✔; API por su cuenta en :3001 ✔.
- Login verificado contra la BD restaurada (admin / rrhh) ✔.
- `migrate diff` BD vs schema.prisma: vacío (drift cero) ✔.

## Pendientes y riesgos
- CI/CD no existe; el agente solo creará Actions si el usuario lo pide.
- `.env` de web aún apunta a IPs LAN viejas (0.108/0.203) — actualizar a la IP vigente.
