# Plan de correpciones — Review del PR #17

**Fecha:** 2026-11-10
**Estado:** Propuesto — esperando autorización del usuario (nada ejecutado todavía)
**Base de análisis:** commits revisados en `plataforma-experiencia` (`7024332`),
verificado archivo por archivo contra el código real (no solo la descripción del PR).

---

## 🔴 BLOQUEANTE — antes del merge

### 1. Excel con datos personales en el historial (`nueva-info/INFORMACION DE EMPLEADOS.xlsx`)
**Confirmado.** El archivo está en la historia de commits de la rama (no solo el
último). Borrarlo en un commit nuevo NO lo saca del repo: cualquiera puede
consultar un commit anterior y ver los datos.

**Qué se hará:**
- Reescribir la historia de la rama con `git filter-repo` eliminando solo ese
  archivo de todos los commits.
- Push forzado de `plataforma-experiencia` (válido: nadie más trabaja la rama y
  aún no entra a main).
- Actualizar el registro de cambios que menciona la carpeta.

**ABIERTO (decisión del usuario):** ¿purgar solo el .xlsx o toda la carpeta
`nueva-info/`? El detalle exacto llegó por WhatsApp — confirmar si el .docx
también contiene datos personales.

---

## 🟠 SEGURIDAD — recomendados fuertes antes del merge

### 2. Usuarios demo con contraseña conocida creados en migraciones
**Confirmado en las 3 migraciones:** `20261108180000_roles_plantilla_y_usuarios`,
`20261108230000_usuarios_por_area` (comentario con `tecnico123`) y
`20261109010000_equipo_residente_demo` (comentario con `trabajador123`).
Las migraciones también se aplican en el servidor al desplegar: dejarían cuentas
con contraseñas conocidas en producción.

**Qué se hará:**
- Quitar los INSERT de usuarios de las 3 migraciones (edición en sitio: nunca se
  han aplicado fuera de la máquina local; los checksums se concilian con
  `npx prisma migrate resolve`).
- Crear `prisma/demo-seed.sql` para ejecutar **solo a mano en dev**, con la
  contraseña configurable (no en claro en el repo).
- Los roles/permisos/vistas se quedan como migración; solo los USUARIOS salen.

### 3. El filtro por área solo aplica en la lista — los accesos directos no revisan ámbito
**Confirmado:** `aplicarAmbito` se usa solo en `listar` (línea 135) y en stats
(1087). Los métodos `findOne`, `aceptar`, `cambiarEstado`, `comentar`,
`adjuntar` y `remove` aceptan cualquier id: un técnico con token válido puede
ver o modificar un reporte de otra área o de otro jefe por API directa (el
frontend lo bloquea, el backend no).

**Qué se hará:**
- Helper `verificarAcceso(reporteId, userId)` que resuelve el reporte y valida
  el ámbito (admin nivel ≥100 pasa; el dueño del reporte pasa; el asignado
  pasa; el residente solo si es reporte de su equipo vía `jefe_user_id`).
- Aplicarlo en los 6 métodos faltantes con `fallir()` →
  `REPORTE_ACCESO_DENEGADO` audited FAIL antes de lanzar.
- Tests unitarios por método (camino válido + 403) + integration verificando el
  FAIL real en `registro_auditoria`.

### 4. Validación débil de adjuntos
**Confirmado en `AdjuntoDto`:**
- `tamano` es `@IsNumber` pero la columna es `Int` → un 1.5 termina en 500.
  El cliente "dice" el tamaño y el server confía en él.
- `datos` no tiene tope de longitud ni validación de base64.
- El tope de 4 imágenes por reporte no es atómico: mandando dos al mismo tiempo
  se pueden colar 5+.

**Qué se hará:**
- **Borrar `tamano` del DTO** y derivarlo en el server de la longitud de
  `datos` (`(len * 3 / 4)` → bytes reales), con tope de 2 MB decodificados,
  regex de base64 y cross-check con el mime (firmas JPEG/PNG/WEBP/GIF).
- El conteo de 4 adjuntos pasa a validar **dentro de transacción** (count +
  insert condicional, patrón del repo) — carrera cerrada.
- Tests unitarios (base inválida, tamaño excedido, mime cruzado) +
  integration de carrera (dos adjuntos simultáneos terminan en 4 exactos).

### 5. `json({ limit: '15mb' })` global en `main.ts`
**Confirmado:** aplica a TODA la API incluido el login (abuso/petición de
memoria por endpoint).

**Qué se hará:**
- Límite por defecto (100 KB) para toda la app y `15mb` SOLO en el path de
  adjuntos del módulo de reportes (middleware express por prefijo de ruta).

---

## 🟡 CORRECTITOS — se resuelven como parte del PR

### 6. Migración `20261108153000_flujo_incidentes_v2` no idempotente
**Confirmado:** solo 3 guardas en TODO el SQL de la migración. `CREATE TYPE`,
`CREATE TABLE`, `RENAME COLUMN`, `ADD VALUE` y `DROP COLUMN` terminan en error
si se re-aplican.

**Qué se hará:**
- Edit en sitio (nunca pushed fuera de la máquina local) envolviendo cada paso
  con guardas `IF NOT EXISTS` / `IF EXISTS` / chequeos de catálogo en `DO $$`
  (patrón idempotente estándar).
- Los DROP COLUMN (cliente_id, proyecto_id, monto_servicio) se conservan — la
  v2 ya no usa esos campos — pero blindados.
- `npx prisma migrate resolve` concilia checksums en la BD local (ya aplicada).

### 7. Migración `20261108221000_roles_tecnicos_descriptivos` busca el rol SIN acento
**Confirmado:** el rol se creó como `'Técnico'` (con acento) en
`20261108180000`, pero la migración 221000 busca `'Tecnico'` (sin acento) en
2 lugares → la reasignación de técnicos no encontró nada (por eso la BD local
se corrigió a mano y no se notó).

**Qué se hará:**
- Corregir el nombre con acento en el edit en sitio + `migrate resolve` local.
- No se re-ejecuta retroactivamente: la reasignación ya fue hecha a mano en la
  BD local; en servidores la migración corregida correría por primera vez.

### 8. Hora con base `1970-01-01T...` en `horaDelMomento()` (service línea 1231)
**Confirmado:** concatenar la hora sobre una fecha fija es el patrón de zona
horaria que ya mordió el sistema varias veces.

**Qué se hará:**
- Reescribir con la fórmula probada del repo (fecha local + `Date.UTC` para el
  offset) y test unitario de frontera (hora 23:59 y 00:01 del día siguiente).

---

## 🔵 DECISIONES ABIERTAS (el usuario decide antes de hacerlo)

### 9. Bordeado del DataTable — es GLOBAL (todas las tablas del sistema)
Lo hicimos global a propósito (consistencia visual en todo el ERP). La review
sugiere prop de variante para aislarlo solo cuando se quiera.

**Opciones:**
- (a) Dejar global tal cual — cero cambios, decisión actual sostenida.
- (b) Agregar prop `lines?: 'bold' | 'subtle'` con default `'bold'` — mismo
  comportamiento hoy, control por vista mañana.

### 10. Commits sin registro en historial-cambios
La rama tiene 100 commits sin main y `historial-cambios/` suma 61 archivos; la
review contó 36 commits sin registro propio (trabajo histórico previo).

**Opciones:**
- (a) Un único registro retroactivo que LISTE los commits pendientes (honesto,
  sin inventar contenido).
- (b) Declararlo deuda explícita en el registro del PR.

### 11. Menores (~10 min, todos automáticos)
- `.turbo` fuera del repo: `git rm --cached apps/web/.turbo/turbo-lint.log` +
  regla de `.gitignore` (`apps/web/.turbo/`).
- **Borrar `apps/api/scripts/rotate-jwt-secrets.js`** — dev de una sola vez:
  trae ruta absoluta del equipo e imprime prefijos de secretos; ya cumplió su
  función.
- Comentario con texto corrupto en `apps/web/src/app/(dashboard)/reportes/page.tsx`
  línea ~1396 ("el Residente solo seguirí y¿' does") → texto limpio.

### 12. Frontend /reportes — solape de respuestas viejas + Aceptar robusto
**Confirmado:** la carga inicial, los filtros y el detalle no descartan
respuestas viejas (una carga lenta puede pintar los datos de otro reporte);
Aceptar es vulnerable a doble clic; las cargas iniciales y Aceptar no avisan
si fallan.

**Qué se hará:**
- `AbortController` en carga inicial / filtros / detalle (descartar la
  respuesta si cambió el contexto).
- Botón Aceptar con candado en estado (en modo "aceptando" no re-envía).
- Toast obligatorio con `mensajeErrorApi` en carga inicial fallida y al
  aceptar con error.

---

## Orden de ejecución propuesto

| # | Bloque | Riesgo si no se hace |
|---|---|---|
| 1 | Purga del Excel del historial (filter-repo + force push) | datos personales en repo público — BLOQUEANTE |
| 2 | Usuarios demo fuera de migraciones → script manual fuera de prod | cuentas con contraseñas conocidas en producción |
| 3 | Correcciones de servicio (scope 6 métodos, tamano/datos, carrera de 4, hora UTC) | fuga por acceso directo, 500s, adjuntos de más |
| 4 | Migración idempotente + fix acento + resolve local | migraciones rompen el deploy en servidor |
| 5 | json 15mb solo en adjuntos + AbortController/candado en front | abuso de memoria, UX confusa |
| 6 | Menores (borders decisión, rotate script fuera, comment, turbo, registros retroactivos) | detalles futuros en audits |

Cada commit con su registro en `historial-cambios/` (regla del repo). El PR
#17 NO se actualiza hasta terminar el bloque 1 — así evitamos mezclar la
purga del historial con los commits de fix.

---

## Preguntas concretas al usuario (autorizaciones)

1. ¿Purgar toda la carpeta `nueva-info/` del historial o solo el Excel?
2. ¿Confirmas el push forzado de `plataforma-experiencia` (necesario para la purga)?
3. ¿DataTable global (a) o prop de variante (b)?
4. ¿Los 36 registros faltantes: doc retroactivo único (a) o deuda declarada (b)?

## Nota del revisor
"No corrí la integración contra Postgres ni lo vi en el navegador." — al
concluir los bloques se correrá `npm run test:integration` completo y smoke
manual del navegador antes de actualizar el PR.
