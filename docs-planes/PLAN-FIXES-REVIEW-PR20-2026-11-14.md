# Plan de fixes — Review del PR #20 (comercial-operaciones)

**Fecha:** 2026-11-14 · **Branch de trabajo:** `comercial-operaciones` · **Base:** `main`
**Origen:** review del PR #20 (4 puntos: Tabs responsivo, contador de Modal, migraciones idempotentes, GitGuardian).

---

## Resumen ejecutivo

| # | Problema | Gravedad | Fix | Commits |
|---|----------|----------|-----|---------|
| 1 | `w-fit` en `Tabs` rompe el scroll interno en móvil (12 vistas) | Media (visual, regla #1 responsive) | `w-fit max-w-full` en `Tabs.styles.ts` | 1 |
| 2 | Cleanup del contador de `Modal` resta aunque el modal nunca abrió | Alta (bug lógico, 36 archivos usan el kit) | early-return cuando `!open` en el `useEffect` | 1 |
| 3 | 13 de 20 migraciones nuevas no idempotentes + 2 prefijos duplicados | Baja-media (solo si se reaplican a mano) | `IF NOT EXISTS`/`IF EXISTS` + refresco de checksums | 2 |
| 4 | 2 alertas de GitGuardian | Ninguna (falsos positivos) | Marcar en el panel de GitGuardian (acción externa, no código) | 0 |

Los 4 fixes van en **commits separados** (1 cambio = 1 commit, con su registro en `historial-cambios/`).

---

## Fix 1 — `Tabs.styles.ts`: `w-fit` desborda la página en móvil

### Diagnóstico (verificado)
- Regresión de `6441521a` ("tabs compactos por defecto"): `flex overflow-x-auto` → `flex w-fit overflow-x-auto`.
- Mecanismo CSS: `width: fit-content` = `min(max-content, max(min-content, disponible))`. Los triggers son `shrink-0`, así que el **min-content** de la lista = suma completa de pestañas. Si esa suma supera el ancho disponible, el piso de min-content gana y la lista se dimensiona a su contenido: `overflow-x-auto` ya no scrollea nada y el desbordamiento sube al documento (se desplaza la página entera).
- Los 12 usos de `<Tabs>` están en flujo de bloque (padre de ancho viewport): `max-w-full` recorta el ancho usado al del padre y el scroll interno vuelve. No hace falta `min-w-0` en ancestros con los usos actuales.

### Cambio
**Archivo:** `apps/web/src/components/ui/Tabs/Tabs.styles.ts` (1 línea)

```diff
- list: 'flex w-fit overflow-x-auto gap-1 p-1 bg-ui-100 rounded-xl scrollbar-none',
+ list: 'flex w-fit max-w-full overflow-x-auto gap-1 p-1 bg-ui-100 rounded-xl scrollbar-none',
```

### Verificación
- `npx tsc --noEmit` en `apps/web` + eslint.
- Smoke manual (móvil, 390 px): Flota (`/maquinaria`, 4 pestañas con contador) y Asistencia — la lista desplaza **internamente**, la página no se mueve; en desktop la píldora sigue `w-fit` compacta.
- La vista `/ui-showcase` tiene ejemplos de Tabs: usarla como segunda comprobación.

### Riesgo
- Ninguno conocido: `max-w-full` solo acota; no altera el layout en desktop (el `w-fit` compacto se conserva).
- Nota para el futuro: si alguien mete `<Tabs>` dentro de un flex row, ahí sí hará falta `min-w-0` en el ancestro flex — el comentario del fix lo advertirá.

### Commit
```
fix(web): tabs conservan el scroll interno en movil — w-fit max-w-full (review PR #20)
```
Registro: `historial-cambios/2026-11-14-tabs-scroll-interno-movil.md`

---

## Fix 2 — `Modal.tsx`: el contador baja también en modales que nunca abrieron

### Diagnóstico (verificado, peor de lo que la review describió)
El `return () => {...}` del `useEffect` **no está condicionado**; el incremento solo ocurre con `open === true`. Tres caminos malos:

1. **Modal cerrado que se desmonta** mientras otro está abierto: su última corrida fue con `open=false` (no incrementó), pero el cleanup resta −1 → el contador del modal abierto llega a 0 → **libera el scroll del fondo con el modal todavía abierto**. (Lo de la review.)
2. **Peor, no mencionado en la review:** `handleKeyDown` = `useCallback([onClose, persistent])`. Los 36 archivos que usan el kit pasan `onClose` inline → identidad nueva en cada render del padre → el efecto re-corre → **cada re-render de un modal CERRADO resta −1** (cleanup resta, el body no suma). Con un modal abierto y la página re-renderizando, el contador se clampa a 0 una y otra vez liberando el scroll.
3. **Modal abierto con `onClose` inline:** resta y suma balanceado en el mismo flush (sin parpadeo visible), pero re-toca `paddingRight` cada vez (thrash menor).

### Cambio
**Archivo:** `apps/web/src/components/ui/Modal/Modal.tsx` — early-return cuando `!open`: así el cleanup (con su decremento) solo se registra en las corridas que **sí** incrementaron. Mata los tres caminos de un golpe. El listener de Escape no se pierde: con `open=false` nunca se agregó.

```diff
   useEffect(() => {
-    if (open) {
-      document.addEventListener('keydown', handleKeyDown);
-      ...
-      modalesAbiertos += 1;
-      document.body.style.overflow = 'hidden';
-    }
+    // Si nunca abrió, esta corrida no incrementó el contador: el cleanup
+    // tampoco debe decrementar (un modal cerrado que se desmonta o cuyo
+    // onClose cambia no debe liberar el scroll de otro modal abierto).
+    if (!open) return;
+    document.addEventListener('keydown', handleKeyDown);
+    // Compensa el ancho del scrollbar ANTES de bloquear el scroll ...
+    if (modalesAbiertos === 0) {
+      const anchoBarra = window.innerWidth - document.documentElement.clientWidth;
+      if (anchoBarra > 0) document.body.style.paddingRight = `${anchoBarra}px`;
+    }
+    modalesAbiertos += 1;
+    document.body.style.overflow = 'hidden';
     return () => {
       document.removeEventListener('keydown', handleKeyDown);
       modalesAbiertos -= 1;
       ...
     };
   }, [open, handleKeyDown]);
```

*(El fix real conserva el comentario original de compensación; el diff de arriba es el esqueleto.)*

### Verificación
- `npx tsc --noEmit` en `apps/web` + eslint.
- **Smoke manual** (3 escenarios, en cualquier vista con modal, ej. `/inventario`):
  1. Abrir modal A → abrir modal B encima → cerrar B → el fondo sigue bloqueado hasta cerrar A ✓ (regresión del contador anidado).
  2. Abrir modal A → forzar re-renders del padre mientras A está abierto (buscar/filtrar en la vista de fondo no se puede con modal abierto; alternativa: abrir un modal desde una lista y disparar un refetch con `RefreshOverlay` — o simplemente verificar el caso 1 y 3 en su defecto) → el fondo sigue bloqueado ✓.
  3. Modal con `onClose` inline que se desmonta sin haberse abierto (cambiar de tab con un modal cerrado montado) → luego abrir otro modal → el fondo bloquea bien ✓.
- Regla del repo: sin infra de tests frontend, el smoke queda documentado en el registro del commit.

### Riesgo
- Bajo: el cambio es conservador (el comportamiento cuando `open=true` queda idéntico). El único caso que cambia es el cleanup de corridas con `open=false`, que hoy resta de más.

### Commit
```
fix(web): el contador de modales solo decrementa si el modal abrio (review PR #20)
```
Registro: `historial-cambios/2026-11-14-modal-contador-cleanup.md`

---

## Fix 3 — Migraciones: 13 no idempotentes + 2 prefijos duplicados

### Diagnóstico (verificado)
**13 no idempotentes** (DDL de `prisma migrate dev` sin `IF NOT EXISTS`; los patterns exactos están en el análisis del día):

- `20261112030000_obras_1a1` (CREATE INDEX)
- `20261112040000_proyectos_municipio` (ADD COLUMN)
- `20261112060000_cotizacion_items` (TABLE + COLUMN + INDEX + CONSTRAINT)
- `20261112140000_ventas_cliente_id` (COLUMN + INDEX + CONSTRAINT)
- `20261113020000_ordenes_compra_fecha_vencimiento` (COLUMN)
- `20261113030000_notificaciones` (TABLE + INDEX + CONSTRAINT + TYPE)
- `20261113032000_notificaciones_descartada` (COLUMN)
- `20261113040000_notificaciones_lecturas` (TABLE + INDEX + CONSTRAINT)
- `20261113050000_notificaciones_destinatarios` (COLUMN + INDEX + CONSTRAINT)
- `20261113060000_trabajadores_usuario_id` (COLUMN + INDEX + CONSTRAINT)
- `20261113070000_reportes_asignado_user_id` (COLUMN + CONSTRAINT)
- `20261114010000_registros_criba_maquina_proyecto` (COLUMN + INDEX + CONSTRAINT)
- `20261114020000_materiales_criba` (TABLE + COLUMN + INDEX + CONSTRAINT)

**Prefijos duplicados de este PR:** `20261114010000` (criba + vista_usuarios) y `20261114020000` (equipos + materiales). El orden alfabético interno es dependency-safe; el riesgo es solo de convención. (En main ya hay 2 pares duplicados de agosto — preexistentes, no de este PR.)

### ⚠️ Restricción que define la estrategia
Las 13 **ya están aplicadas** en las 2 BDs dev (`svr_erp` y `svr-erp-backup`) y `_prisma_migrations` guarda el **checksum** del archivo SQL:
- `migrate deploy` NO valida checksums y salta las aplicadas por nombre → seguro para el servidor.
- `migrate dev` futuro SÍ detectaría el checksum alterado y podría proponer reset → tras editar hay que refrescar con `prisma migrate resolve --applied <nombre>` en cada BD dev.

### Cambios

**Paso A — Hacer idempotentes las 13** (archivos: los 13 `migration.sql` listados):

| Patrón SQL | Cómo queda |
|---|---|
| `CREATE TABLE "x"` | `CREATE TABLE IF NOT EXISTS "x"` |
| `ALTER TABLE "x" ADD COLUMN "c" ...` | `ADD COLUMN IF NOT EXISTS "c" ...` (una cláusula por columna) |
| `CREATE [UNIQUE] INDEX "i"` | `CREATE [UNIQUE] INDEX IF NOT EXISTS "i"` |
| `ALTER TABLE ... ADD CONSTRAINT "k"` | `ADD CONSTRAINT IF NOT EXISTS` **no existe en Postgres** → envolver en `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'k') THEN ALTER TABLE ...; END IF; END $$;` |
| `CREATE TYPE "t"` | `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 't') THEN CREATE TYPE ...; END IF; END $$;` |

En los `ADD COLUMN` que vienen agrupados de Prisma (`ADD COLUMN "a" ..., ADD COLUMN "b" ...`), separar cada columna con su propio `IF NOT EXISTS`.

**Paso B — Renombrar los 4 directorios con prefijo duplicado** (solo este PR; los de agosto quedan fuera de alcance):

- `20261114010000_vista_usuarios_sistema` → `20261114010010_vista_usuarios_sistema`
- `20261114020000_equipos_enum_jefe` → `20261114010020_equipos_enum_jefe` *(se adelanta: no depende de materiales_criba; ver riesgo)*
- `20261114020000_materiales_criba` → `20261114020010_materiales_criba`

⚠️ **OJO:** las 4 ya están registradas en `_prisma_migrations` **con el nombre viejo** en ambas BDs. Renombrar el directorio sin más hará que `migrate deploy` las vea como pendientes y las reintente (con `IF NOT EXISTS` ya no tronarían, pero registrarían un nombre duplicado). Hay que **actualizar el nombre en `_prisma_migrations`** de ambas BDs:

```sql
UPDATE _prisma_migrations SET migration_name = '20261114010010_vista_usuarios_sistema'
 WHERE migration_name = '20261114010000_vista_usuarios_sistema';
-- (y las otras dos; también refrescar el checksum si el SQL cambió)
```

**Alternativa más simple (recomendada, ponytail):** NO renombrar directorios ya aplicados — el renombrado toca BD a mano y por poco beneficio. Dejar los prefijos duplicados **documentados como deuda** (nota en este plan + registro), y adoptar como regla para el futuro "prefijo único". Si el equipo prefiere renombrar, hacerlo antes de que el PR llegue a main y solo en el `svr-erp-backup` + un resolve en cada dev DB.

**Decisión a pedir al usuario:**
- **Opción 1 (recomendada):** solo idempotencia (Paso A) + deuda documentada de prefijos.
- **Opción 2:** Paso A + renombrado de los 3 directorios con actualización de `_prisma_migrations` en ambas BDs.

### Verificación
- En `svr-erp-backup`: `npx prisma migrate status` → al día, sin drift.
- Prueba de idempotencia real: correr a mano los 13 SQL modificados **dos veces** contra una BD de prueba (o directamente contra `svr-erp-backup`, que es dev): la segunda pasada no debe fallar por objeto duplicado.
- `npx prisma migrate resolve --applied <nombre>` tras cada archivo editado (en las BDs donde se editó el SQL aplicado) para refrescar el checksum y que `migrate dev` no proponga reset.
- La app sigue viva: unitarias + integración de nómina (los smoke del merge de hoy) → 250/250 y 9/9.

### Riesgo
- El renombrado (Opción 2) toca `_prisma_migrations` a mano — error humano posible; por eso la Opción 1.
- Si aparece una BD nueva de cero: restaurar con `pg_restore` del dump, nunca re-replaying todo el historial (regla del repo) — el `IF NOT EXISTS` es cinturón extra, no vía primaria.

### Commits (Opción 1)
```
chore(db): migraciones nuevas idempotentes — IF NOT EXISTS / DO blocks (review PR #20)
```
Registro: `historial-cambios/2026-11-14-migraciones-idempotentes.md`

---

## Fix 4 — GitGuardian: falsos positivos (sin código)

### Diagnóstico (verificado)
Las 2 alertas señalan `!form.password` / `password: ''` en el estado del formulario de `/usuarios` — validaciones de campo vacío, cero secretos. (Candidatos secundarios típicos: literales de prueba en specs como `admin1234` / `WrongPass1!`, también inofensivos.)

### Acción
- En el panel de GitGuardian: marcar las 2 alertas como **falsos positivos** (justificando "validación de formulario, no secreto"). La hace quien tenga acceso al panel (el dueño del repo).
- **Nada que cambiar en código** — mover la validación a otro archivo no silencia a GG y ensucia el código.

---

## Orden de ejecución y gates

1. **Fix 1 (Tabs)** → gates → commit + registro.
2. **Fix 2 (Modal)** → gates → commit + registro.
3. **Fix 3 (migraciones)** — decidir Opción 1/2 → `prisma generate` no hace falta (no toca schema) → probar idempotencia a mano → commit + registro.
4. **Fix 4** — acción externa en el panel (sin commit).
5. Al final: `npm run lint` (raíz), `npx tsc --noEmit` (web y api), unitarias de nomina/asistencia/trabajadores (250/250) como gate de regresión general — el PR es grande y estos fixes tocan el kit transversal (Tabs/Modal los usan todas las vistas).

## Riesgos generales del lote

- Fix 1 y 2 tocan componentes transversales: el smoke de al menos 2 vistas distintas (una con tabs, una con modal anidado) es obligatorio antes del commit.
- Los commits quedan locales en `comercial-operaciones` (adelantada respecto a main); **push solo por orden explícita**.
- El punto 3 depende de qué BD toca cada dev: los edits de SQL aplicado piden `migrate resolve` en cada BD donde se haya aplicado.
