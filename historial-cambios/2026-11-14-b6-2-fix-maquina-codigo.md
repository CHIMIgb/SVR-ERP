# 2026-11-14 — B6.2-fix: maquinaId por CÓDIGO (patrón despachos)

## Qué se hizo

Corrección a B6.2 tras descubrir en el smoke que el catálogo `/maquinas`
expone el **código** (`M001`) como id — y que el módulo de despachos ya usa
ese mismo patrón (`maquinaId` = código). `criba` se alinea:

- DTOs (create/update/query): `maquinaId` pasa a `@IsString @MaxLength(30)`
  (código), se elimina el `@IsUUID`.
- `resolverMaquina`: busca por `codigo` y devuelve el **UUID real** (que es lo
  que guarda el FK `maquina_id`).
- `findAll`: filtra por `maquinas = { codigo }` (relación) en vez de
  `maquina_id` directo.
- Spec: "con maquinaId guarda el UUID real" · "filtros por código".

## Verificación

- `npx tsc --noEmit`: limpio.
- Unit `src/criba`: **39/39**.
- Smoke: `maquinaId=M001` → BD guarda el UUID `b7bb9152-…` y los filtros por
  código y proyecto devuelven el registro ✓.

## Pendientes / riesgos

- Ninguno nuevo: es el patrón que despachos ya usa.
