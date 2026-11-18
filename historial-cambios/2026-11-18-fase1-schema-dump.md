# Fase 1: coherencia schema ↔ dump en el job de integración

**Fecha:** 2026-11-18
**Autor:** Agente (autorizado por el usuario — "continúa con la Fase 1")

## Contexto

El plan `docs-planes/PLAN-CI-CD-ENDURECIMIENTO.md` marcaba que nada validaba
que el dump de integración (`svr_erp_export/svr_erp_sin_postgis.sql`) siga
coincidiendo con `schema.prisma`. La Fase 1 agrega ese check al workflow
`integration`, que ahora es required check del ruleset (Fase 0).

## Cambios realizados

- **`.github/workflows/integration.yml`:** nuevo paso "Verificar esquema del
  dump contra schema.prisma" después de "Restaurar dump de prueba" y antes de
  `npm run test:integration`:
  `npx prisma migrate diff --from-config-datasource --to-schema=prisma/schema.prisma --exit-code`.
  La sintaxis se confirmó con la documentación de Prisma 7 (Context7) y con
  `npx prisma migrate diff --help` del CLI instalado: en v7 `--from-url` y
  `--to-schema-datamodel` ya no existen; `--exit-code` da 0 sin diff, 1 error,
  2 con diff.
- **Desfase detectado por el check y corregido (decisión del usuario):**
  el dump y la BD local tienen el FK `fk_trabajadores_usuario` en
  `trabajadores`, mientras `schema.prisma` esperaba
  `trabajadores_usuario_id_fkey`. El único diff era un `RENAME CONSTRAINT`.
  Se agregó `map: "fk_trabajadores_usuario"` a la relation
  `trabajadores_cuenta` en `apps/api/prisma/schema.prisma` y se corrió
  `npx prisma generate`. No se tocó la BD ni se regeneró el dump: producción
  conserva el nombre legado y ahora Prisma lo reconoce.
- **Documentación:** misma nota de `migrate diff` en `AGENTS.md` (regla 5) y
  `.opencode/agent/svr-erp.md`; plan con Fase 1 ejecutada y brecha B3 cerrada.

## Cosas nuevas

- Paso de verificación de esquema en `integration.yml`.
- `map:` explícito en la relation de `trabajadores` (antes implícito).

## Archivos tocados

- `.github/workflows/integration.yml` (modificado)
- `apps/api/prisma/schema.prisma` (modificado)
- `AGENTS.md` (modificado)
- `.opencode/agent/svr-erp.md` (modificado)
- `docs-planes/PLAN-CI-CD-ENDURECIMIENTO.md` (modificado)
- `historial-cambios/2026-11-18-fase1-schema-dump.md` (creado)

## Pruebas / verificación

- `npx prisma validate` → OK; `npx prisma generate` → OK.
- Diff contra dump restaurado en BD efímera (93 tablas): "No difference
  detected", exit 0. Diff contra la BD local `svr_erp`: el mismo resultado.
- Prueba negativa con `--from-empty --to-schema=... --exit-code` → exit 2.
  (Un exit 2 intermedio durante la primera pasada fue falso: una restauración
  fallida dejó la BD vacía.)
- `npm run test:integration`: **26 suites, 292/292 tests**, exit 0. Jest avisa
  de `forceExit` / handle sin cerrar; es conocido y no es un fallo.
- `git diff --check`: sin errores.
- **No se hizo dispatch remoto del workflow con el paso nuevo**: el cambio
  está local y no se autorizó push. `gh workflow run integration --ref main`
  correría la versión anterior de `integration.yml`, así que no aportaría
  verificación.

## Pendientes y riesgos

- Falta verificar el paso nuevo en GitHub cuando el commit llegue a un ref
  remoto (push o PR autorizado). Para entonces confirmar que el job
  `integration` sigue verde y que el paso aparece en el log.
- `migrate diff` compara el esquema final, no el historial de migraciones
  baselined; un cambio en `search_path` o extensiones del workflow exigiría
  ajustar los flags, no el dump.
- Sigue pendiente el hallazgo de la Fase 0: el check `api` en rojo por 2 tests
  de `ventas.service.spec.ts` dependientes del turno. No se tocó en esta fase.
- No se hizo push ni PR: el usuario no lo ordenó.
