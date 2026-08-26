<!--
Este template se aplica automáticamente al abrir un PR. Llenalo con lo que
realmente aplica al cambio; borra las secciones que no corresponden.
-->

## Resumen

**Qué cambia:**
<!-- 2–3 líneas describiendo el cambio. Si el título del PR ya lo dice claramente, acá pondes el "por qué". -->

**Issue relacionado:** Closes #
<!-- Obligatorio si el PR atiende un issue. Usa `Closes #NNN` para cierre automático. -->

## Tipo de cambio

- [ ] Bugfix
- [ ] Feature
- [ ] Refactor
- [ ] Documentación
- [ ] Tests / CI
- [ ] Migración / data migration

## Checklist general

- [ ] Base branch del PR es `main` (branch por defecto del repo).
- [ ] Título refleja el contenido real (no scope creep).
- [ ] El PR no incluye `node_modules/`, `.expo/`, `dist/`, `web-build/`, `*.tsbuildinfo`, `.env`, ni nada generado.
- [ ] No hay credenciales, tokens, passwords, API keys ni datos reales en el diff.

## Dependencias (solo si aplica)

- [ ] Los paquetes de Expo se instalaron con `npx expo install <paquete>` (nunca `npm install <paquete>`) para respetar las versiones del SDK.
- [ ] Si cambia el SDK de Expo o se agregan dependencias nativas: se verificó compatibilidad con Expo Go (ver gotcha en `AGENTS.md` — no bajar el SDK del proyecto).

## Tests y validación

- [ ] Typecheck verde localmente: `npx tsc --noEmit` dentro de `apps/mobile/`.
- [ ] `npx expo-doctor` sin issues.
- [ ] Si cambia el schema de Prisma (backend): `npx prisma validate` pasa y la migración se genera con `npx prisma migrate dev`.
- [ ] Tests nuevos cubren **al menos** el camino crítico + un error path (400/403/404/409 según aplique), no solo happy-path.

## Migraciones (solo si aplica)

- [ ] La migración se genera con `npx prisma migrate dev` (nunca editar SQL ya aplicado).
- [ ] Si hay data migration, preserva datos existentes sin pérdida.
- [ ] Si agrega columnas NOT NULL a tablas con datos, usa default o nullable + data migration + segunda migración para el NOT NULL.

## Contrato con frontend (si aplica)

- [ ] Endpoints respetan el envelope `{success, data, error}` del **Contrato universal API ↔ Frontend** en `AGENTS.md`.
- [ ] Errores devuelven `error: {code, message, details?}` — no string suelto.
- [ ] Si cambia el contrato, se actualiza la sección correspondiente en `AGENTS.md`.

## Docs impactadas

- [ ] Si el cambio afecta arquitectura, permisos, flujos o integridad: actualicé la doc correspondiente (`README.md` y/o `AGENTS.md`).
- [ ] Si cambia flujo de ramas, scripts, workers o CI: `AGENTS.md` actualizado.

## Notas adicionales

<!-- Cualquier consideración que el reviewer necesite: decisiones técnicas,
trade-offs, deudas declaradas, pasos manuales post-merge, dependencias
con PRs de frontend, etc. -->
