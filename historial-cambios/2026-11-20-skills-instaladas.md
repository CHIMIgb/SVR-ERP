# Skills instaladas — análisis de documentos y arquitectura (skills.sh)

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** pedido del usuario — «buscar skills en skills.sh para el análisis de documentos, entender contexto de proyectos y ahorro de tokens»

## Instaladas (3)

- **`anthropics/skills@docx`** (global, ~\.agents\skills) — 222.7K instalaciones, fuente oficial Anthropic. Permite **leer/editar documentos Word** — resuelve la capacidad que nos faltaba: leer las especificaciones del cliente que llegan en `docs-svr/` (Excel/Word).
- **`anthropics/skills@xlsx`** (global) — 203K, fuente oficial. Ídem para **Excel** (los documentos operativos del cliente son Excel).
- **`mattpocock/skills@improve-codebase-architecture`** (proyecto, `.agents/skills/` en el repo) — 1.3M instalaciones, Matt Pocock. Marco estructurado para **analizar la arquitectura y el contexto del proyecto** (monorepo, 96 modelos Prisma, RBAC).

## Evaluadas y NO instaladas
- `alexgreensh/token-optimizer` (1.2K, autor sin reputación) — el ahorro de tokens ya lo cubre la metodología (ponytail, plan antes de código).
- `oimiragieo/agent-studio@context-compressor` (274) y `otnc/*` (<100) — bajo el umbral de calidad del método.

## Archivos tocados
- `~\.agents\skills\` (global): docx, xlsx — fuera del repo.
- `.agents/skills/improve-codebase-architecture/` (proyecto, commiteado en `dc5f35b7` + lock `6e8b535c`).
- `historial-cambios/2026-11-20-skills-instaladas.md` (creado)

## Pendientes y riesgos
- Las skills corren con permisos completos del agente — revisar su contenido antes de uso crítico.
- Sin push: los commits quedan locales.
