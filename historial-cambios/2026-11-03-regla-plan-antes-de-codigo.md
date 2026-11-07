# Regla: plan de implementación obligatorio antes de tocar código

**Fecha:** 2026-11-03
**Autor:** agente OpenCode (a petición del usuario)

## Cambios realizados
- Nueva regla dura para todos los agentes: **nunca se crea ni modifica código
  sin autorización previa**. Antes de cada cosa nueva o cambio, presentar un
  plan de implementación (archivos a tocar, qué se hará, impacto, riesgos) y
  esperar el "sí autorizado" del usuario.
  - `AGENTS.md`: regla crítica "**PLAN ANTES DE CÓDIGO (obligatorio)**" en Critical Rules.
  - `.opencode/agent/svr-erp.md`: nueva sección "Plan de implementación antes
    de cualquier código (regla dura)" con los 3 pasos (plan → autorización → código).
    Comentar/leer/diagnosticar sí está permitido sin plan; escribir código NO.

## Cosas nuevas
- Ninguna funcionalmente; es una regla de flujo de trabajo.

## Archivos tocados
- `AGENTS.md` (modificado)
- `.opencode/agent/svr-erp.md` (modificado)

## Pruebas / verificación
- N/A (solo documentación).

## Pendientes y riesgos
- Ninguno.
