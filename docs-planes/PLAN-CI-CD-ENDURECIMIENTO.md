# Plan de endurecimiento de CI/CD — SVR-ERP

**Fecha:** 2026-11-18
**Autor:** Agente (análisis y plan solicitados por el usuario)
**Estado:** plan propuesto, **sin ejecutar**.

## Alcance y decisión previa

Cubre lo que falta para que el CI/CD deje de ser informativo y pase a ser una
red de seguridad: checks obligatorios, coherencia del dump con el esquema,
publicación de imágenes, lint y deuda de tests.

**Decisión del usuario, intocable:** el `bypass_always` de `CHIMIgb` en el
ruleset de `main` **se mantiene**. No se quita, no se limita, no se propone
alternativa. El plan asume esa limitación y la registra como riesgo aceptado
(§5). Tampoco se automatiza el deploy en Railway (el usuario descartó pagar).

---

## 1. Análisis

### 1.1 Estado real verificado

| Hecho | Evidencia |
|---|---|
| 3 workflows activos: `ci`, `integration`, `build-web` | `gh api repos/CHIMIgb/SVR-ERP/actions/workflows` |
| `main` no tiene *branch protection* clásica | `GET .../branches/main/protection` → 404 |
| Sí existe el ruleset `Protección main` (id `21267691`), activo, sobre `refs/heads/main` | `GET .../rulesets/21267691` |
| Reglas del ruleset: `deletion`, `non_fast_forward`, `creation`, `update`, `pull_request` (1 aprobación, `dismiss_stale_reviews_on_push`, aprobación extra para cambios no atribuidos) | ídem |
| **No existe la regla `required_status_checks`** en el ruleset | ídem — ningún check es obligatorio para mergear |
| `bypass_actors`: `CHIMIgb` (id `156728324`), `bypass_mode: always` | ídem — por eso los push directos de hoy entraron con "Bypassed rule violations" |
| `ci.yml`: jobs `web` (`tsc --noEmit`) y `api` (build, `prisma validate`, Jest con `--runInBand`), 1417 tests | `.github/workflows/ci.yml`; run `44412424027` |
| **No hay tests en `it.skip`/`test.skip`/`xit`** en `apps/api/src` | búsqueda con `Select-String` sobre todos los `*.spec.ts` |
| `integration.yml`: `pull_request` + `workflow_dispatch`, Postgres 18 efímero, dump, secrets JWT dummy en `env:`, 292 tests | `.github/workflows/integration.yml`; runs `44417002026`, `44417548136` |
| `build-web.yml`: publica `:latest` y tag por SHA **antes** del smoke; el smoke no bloquea la publicación | `.github/workflows/build-web.yml`, líneas 43-75 |
| `npm run lint`: 21 errores, fuera del CI | deuda conocida en `AGENTS.md` |
| No hay infra de tests frontend (Jest + RTL) | deuda conocida en `AGENTS.md` |
| Dump `svr_erp_export/svr_erp_sin_postgis.sql` (660,276 bytes, 9 tablas excluidas) sin validación de esquema en CI | script `apps/api/scripts/regenerar-dump-integracion.ps1`; run `44405584912` |
| `schema.prisma` **no declara** `Unsupported`, `geometry` ni `geography` | búsqueda en `apps/api/prisma/schema.prisma` |

Corrección al análisis verbal anterior: el comment de `ci.yml` (y el de
`AGENTS.md`) dice que hay 2 tests de cobranza en `it.skip`, pero ya no es cierto:
los 1417 tests corren sin skips. Es deuda documental, no deuda de tests.

### 1.2 Diagnóstico de fondo

Los workflows están bien escritos y verdes, pero **no tienen poder de bloqueo**:
el ruleset no exige ningún check y el owner tiene bypass permanente. Verde no
significa "no se puede mergear rojo"; significa "alguien miró el run".

El segundo problema es de **fiducia del verde**: nada verifica que el dump siga
coincidiendo con `schema.prisma`, y `build-web` publica `latest` antes de saber
si el contenedor arranca. El CI puede estar verde sobre un esquema viejo o
publicar una imagen muerta.

El tercero es de **cobertura**: lint fuera del CI y cero tests frontend. Ahí el
CI no puede ayudar sin antes arreglar deuda del producto.

### 1.3 Brechas priorizadas

| ID | Brecha | Impacto | Esfuerzo | Prioridad |
|---|---|---|---|---|
| B1 | Ruleset sin `required_status_checks` | Un PR se puede mergear con checks rojos | Bajo (config GitHub) | 0 |
| B2 | Comment desactualizado sobre skips en `ci.yml`/`AGENTS.md` | Nadie sabe si los 1417 son reales | Muy bajo | 1 |
| B3 | Sin validación schema ↔ dump | Falsos verdes/rojos al cambiar `schema.prisma` | Bajo (1 paso en `integration`) | 1 |
| B4 | `build-web` publica `latest` antes del smoke | Imagen rota en producción | Medio (reordenar pasos) | 1 |
| B5 | `lint` con 21 errores fuera del CI | Errores nuevos entran sin aviso | Alto (proyecto) | 2 |
| B6 | Cero tests frontend | Roturas de runtime invisibles al CI | Alto (infra + tests) | 2 |
| B7 | Dump con datos de negocio reales de demo | Riesgo si el repo se vuelve público | Medio | 3 |
| B8 | Specs de integración comparten BD (`maxWorkers: 1`, worker que no cierra) | Acoplamiento, ruido al terminar | Medio | 3 |
| B9 | `integration` sin `concurrency` y sin filtro `branches: [main]` | Runs acumulados en pushes rápidos | Muy bajo | 3 |

### 1.4 Lo que ya funciona y no se rehace

- Actions fijadas (checkout `v7.0.1`, setup-node `v7.1.0`, buildx `v4.4.1`,
  login `v4.8.0`, build-push `v7.4.0`), Node 26 / npm 11.20.0.
- `npx prisma generate` antes del build de la API (`apps/api` está fuera de
  workspaces; `npm ci` no lo instala ni genera el cliente).
- `DATABASE_URL` dummy en `prisma validate` y secrets JWT dummy en el `env:` de
  `integration.yml`; nunca valores reales en el repo.
- Restore del dump sin PostGIS; `migrate deploy` desde cero **no** se intenta
  (historial baselined).
- Deploy manual en Railway con SHA + digest anotados en `historial-cambios/`.

---

## 2. Plan de ejecución

Cada fase se ejecuta como un cambio atómico, con su registro en
`historial-cambios/`, `git diff --check` y verificación antes de seguir. No se
mezclan fases en un mismo commit. Los cambios de GitHub (Fase 0) se hacen con
autorización explícita, porque son administración externa al repo.

### Fase 0 — Checks obligatorios en el ruleset

- **Qué se toca:** ruleset `21267691` en GitHub, **nada en el repo**.
- **Acción:** agregar la regla `required_status_checks` con los checks
  `web`, `api` e `integration` (nombres reales de los jobs). Excluir `build-web`:
  no dispara en PR y dejaría un check pendiente para siempre. Modo estricto
  (`strict`) para que un push nuevo invalide aprobaciones/checks viejos.
- **No se toca:** `bypass_actors`. `CHIMIgb` conserva `always` por decisión del
  usuario (§5).
- **Verificación:** `gh api repos/CHIMIgb/SVR-ERP/rulesets/21267691 --jq '.rules'`
  debe incluir `required_status_checks`; prueba práctica con un PR de prueba:
  un check rojo debe bloquear el merge para una cuenta sin bypass.
- **Riesgo conocido:** el bypass `always` sigue permitiendo push directo del
  owner. El gate protege PRs de los demás actores, no esos push. Limitación
  aceptada, no se mitiga en este plan.

### Fase 1 — Coherencia schema ↔ dump en `integration`

- **Qué se toca:** `.github/workflows/integration.yml`.
- **Acción:** tras "Restaurar dump de prueba", agregar un paso con
  `npx prisma migrate diff --from-url <BD restaurada> --to-schema-datamodel prisma/schema.prisma --exit-code`
  (la sintaxis exacta de Prisma 7 se confirma con Context7 antes de escribir).
  Si hay diferencia, el job falla antes de correr los tests.
- **Precondición ya verificada:** `schema.prisma` no declara geometrías, así
  que no hay falso rojo por PostGIS.
- **Verificación:** (a) con el dump actual, el paso da 0 y los 292 tests
  pasan; (b) con un dump viejo deliberado, el paso falla — prueba negativa en
  local, sin commitear el dump roto.
- **Riesgo:** `migrate diff` compara esquema final, no el historial
  baselined; si la BD del workflow trae `search_path` o extensiones distintas,
  hay que ajustar los flags del comando, no el dump.

### Fase 2 — Limpieza documental de los "skips"

- **Qué se toca:** comment de `.github/workflows/ci.yml` (líneas 1-3) y la
  referencia en `AGENTS.md` a los "2 tests de cobranza en `it.skip`".
- **Acción:** dejar constancia de que los 1417 tests corren sin skips y que la
  integración va en `integration.yml` (ya corregido en la tabla de
  `AGENTS.md`). **No hay tests que reactivar.**
- **Verificación:** búsqueda de `it.skip|test.skip|xit` sobre `apps/api/src`
  vuelve a dar 0 resultados; `git diff --check` limpio.
- **Riesgo:** nulo (solo comentarios/docs).

### Fase 3 — `build-web`: smoke antes de mover `latest`

- **Qué se toca:** `.github/workflows/build-web.yml`.
- **Acción:** publicar primero solo el tag por SHA; correr el smoke contra ese
  tag; si pasa, publicar `latest` (segundo `build-push` reutilizando caché, sin
  recompilar). El smoke deja de ser aviso posterior y pasa a ser condición.
- **Verificación:** `gh workflow run build-web --ref main` y comprobar en el
  log que el push de `latest` ocurre después de "Contenedor respondiendo";
  anotar en `historial-cambios/` el SHA y el digest que imprima este run (la
  referencia anterior es `sha256:222efb49b22947f50f2e5a31f265486ced6e8eb6c434e4cefd425ef53080f3e1`).
- **Riesgo:** publicar en dos pasos consume dos acciones de `build-push`; con
  `cache-from/cache-to: type=gha` el segundo es rápido. Si el smoke falla,
  `latest` queda en la imagen anterior (comportamiento deseado).

### Fase 4 — `lint` como gate (proyecto, no parche)

Orden estricto; no se activa el gate hasta el último paso.

1. **Infra de tests frontend:** configurar Jest + React Testing Library en
   `apps/web`, con un smoke de una vista ya migrada como prueba de la infra.
2. **Arreglar los 21 errores:** 12 `set-state-in-effect` en páginas del
   dashboard y el resto en `Toast.tsx`, `Tooltip.tsx` y `CorteCaja.tsx`. Cada
   refactor lleva su test (la regla de "toda pantalla nueva lleva tests" ya
   existe; aquí se activa sobre código existente).
3. **Activar `npm run lint`** como paso del job `web` en `ci.yml`.
- **Verificación:** `npm run lint` en local con 0 errores; el job `web` de `ci`
  en verde con el nuevo paso; una PR con un error introducido a propósito debe
  fallar.
- **Riesgo:** es la fase más cara. Los `set-state-in-effect` requieren
  refactor de estado; sin tests front ese refactor es a ciegas. No se ataja
  desactivando reglas de ESLint.

### Fase 5 — Dump: datos de negocio

- **Qué se toca:** `svr_erp_export/svr_erp_sin_postgis.sql` y el script de
  regeneración.
- **Acción:** decidir entre anonimizar clientes/usuarios/proyectos de demo en
  el dump, o moverlo a un artefacto privado. La decisión es del usuario; el
  plan no la toma.
- **Verificación:** tras anonimizar, `npm run test:integration` contra una BD
  efímera debe dar 292/292 (los specs usan usuarios semilla reales: revisar
  `trabajador@svr-constructora.com` antes de renombrar).
- **Riesgo:** anonimizar mal rompe los specs que dependen de usuarios semilla;
  por eso va después de la Fase 1 y con prueba negativa.

### Fase 6 — Menores

- `integration.yml`: agregar `concurrency` con `cancel-in-progress: true` y
  alinear `pull_request.branches: [main]` con `ci.yml`.
- `jest.integration.config.js`: investigar el aviso
  `worker process failed to exit gracefully` (handle sin cerrar). No es un
  fallo; se documenta si no se resuelve en un cambio pequeño.
- **No se quita `maxWorkers: 1`** mientras los specs compartan BD.

---

## 3. Fuera de alcance (decisiones firmes)

- **Quitar o limitar el `bypass_always` de `CHIMIgb`: NO.** Decisión del
  usuario, explícita y definitiva. No se toca en ninguna fase.
- Automatizar el Redeploy en Railway: no (cuesta dinero; el usuario lo
  descartó).
- Rehacer el historial de migraciones ni correr `migrate deploy` desde cero.
- Publicar imágenes con `latest` antes del smoke.
- Activar lint desactivando reglas para "pasar" el gate.

## 4. Criterio de terminado

El CI/CD queda "bien" cuando, **además de los runs verdes actuales**:

1. El ruleset exige `web`, `api` e `integration` en PR, con modo estricto.
2. Un PR con un check rojo no se puede mergear (probado con PR de prueba).
3. `integration` falla si el dump no coincide con `schema.prisma`.
4. `latest` solo se publica si el smoke del tag SHA pasó.
5. `npm run lint` corre en `ci` con 0 errores, con tests frontend nuevos.
6. Los comments de `ci.yml` y `AGENTS.md` coinciden con el código (sin skips
   fantasmas).
7. El dump tiene decidido su tratamiento de datos (anonimizado o privado).

## 5. Riesgos residuales (aceptados)

- **Bypass `always` de `CHIMIgb`:** con o sin required checks, el owner puede
  hacer push directo a `main` saltándose todos los gates. Es una decisión del
  usuario y no se modifica. Los push de hoy son el ejemplo concreto.
- **Cero tests frontend hasta terminar la Fase 4:** `tsc` no detecta roturas
  en runtime; cada cambio de UI sigue requiriendo smoke manual documentado.
- **Specs de integración acoplados:** `maxWorkers: 1` evita carreras, pero los
  specs no están aislados de verdad; cualquier spec nuevo que comparta estado
  puede reintroducir el problema.
- **CI no verifica producción:** aunque `latest` sea sano, el Redeploy en
  Railway sigue siendo manual y la versión desplegada se anota a mano en
  `historial-cambios/`.

---

## Referencia de la fase ya cerrada (2026-11-18)

Commits: `6230da88` (gate de PR), `81d0e8f4` (secrets dummy en `env:`),
`1a5e6c70` (script de dump), `7c200394` (checklist de Redeploy), `de79fed1`
(run IDs). Runs: `ci` `44412424027`, `integration` `44412424878` /
`44417002026` / `44417548136`, `build-web` `44405584912` (digest
`sha256:222efb49b22947f50f2e5a31f265486ced6e8eb6c434e4cefd425ef53080f3e1`).
Deuda que sigue fuera del CI: `npm run lint` (21 errores).
