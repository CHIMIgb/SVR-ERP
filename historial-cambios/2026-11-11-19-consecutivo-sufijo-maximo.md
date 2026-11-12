# 2026-11-11 — Fix review PR #18 #9: consecutivo de numero_empleado con huecos

## Problema (review del PR #18, punto 9)

`crearAlta` calculaba el consecutivo con `users.count + 1`. El seed demo deja
`TEC-007`–`TEC-010`: el conteo da 4 → primera alta de técnico `TEC-005`,
segunda `TEC-006` y tercera `TEC-007` **que ya existe**. El reintento por
P2002 recalculaba lo mismo (el conteo no cambia) → 409 para siempre. Pasaba
con cualquier hueco de numeración (bajas, seed, altas borradas).

## Cambios

- **`apps/api/src/trabajadores/trabajadores.service.ts`** — en `crearAlta`
  (dentro de la transacción): en lugar de contar, lee los `numero_empleado`
  del prefijo y toma el **sufijo más alto parseado como entero**
  (`parseInt` con guard `Number.isFinite`; sufijos no numéricos se ignoran).
  Siguiente = max + 1. Correcto también con anchos mezclados
  (`TRA-142` vs `TRA-0142`, donde el orden de string no es el numérico).
  El reintento P2002 ahora ve la fila del ganador y calcula max+1 distinto
  → la carrera se cierra de verdad.
- **`trabajadores.service.spec.ts`** — el mock del consecutivo pasa de
  `users.count` a `users.findMany`; 2 tests nuevos: hueco del seed demo
  (`TEC-007..010` → `TEC-011`) y anchos mezclados + ruido no numérico
  (`TRA-142`/`TRA-0142`/`TRA-XX` → `TRA-143`).
- **`trabajadores.integration.spec.ts`** (BD real) — test nuevo: pre-crea un
  user con `ZZR-010` y el alta da `ZZR-011` (con conteo habría dado
  `ZZR-002`–`003`, ya ocupados por las altas previas de la suite).

## Verificación / pruebas

- Unit: 42/42 (`npx jest src/trabajadores/trabajadores.service.spec.ts`).
- Integración (BD real): 18/18 con el test del hueco (`ZZR-010` → `ZZR-011`).
- `npx tsc --noEmit` limpio en `apps/api`.

## Pendientes / riesgos

- El `findMany` del consecutivo es una sub-consulta dentro de la transacción
  de negocio (exenta de paginación por la regla del repo); trae solo la
  columna `numero_empleado` filtrada por prefijo — tamaño acotado (filas por
  rol, cientos a lo sumo).
- La numeración resultante puede tener huecos visibles (p. ej. saltar de
  TEC-010 a TEC-011 aunque existan pocos): es el comportamiento esperado —
  el número es identificador, no contador de empleados.
- No verificado en UI: el alta se prueba por service/spec; el modal no
  consume el número (lo genera el servidor).
