# Plan — Banner uniforme de error de carga (vista asignada pero permiso faltante)

**Fecha:** 2026-11-15 · **Branch de trabajo:** `comercial-operaciones`
**Origen:** observación del usuario — el acceso a vistas/permisos no se refleja de forma
uniforme en la app: con un rol que tiene la **vista** asignada pero sin el **permiso**
de ver, `/trabajadores` muestra un banner rojo explicativo con Reintentar, mientras que
las vistas de Operaciones y Comercial muestran toasts genéricos que ocultan el motivo.

⚠️ **Este plan toca vistas de AMBOS devs** — la fase A1 es de las vistas de
Comercial/Operaciones; la fase A2 toca las de RRHH/Maquinaria (otro dev).
Nada se ejecuta sin autorización; este documento es el contrato de alcance.

---

## 1. Diagnóstico (verificado, línea por línea)

### 1a. De dónde sale el texto `No tienes permiso para rrhh.trabajadores.ver`

- Lo genera el **backend**: `apps/api/src/auth/guards/permissions.guard.ts:85` —
  al fallar el `PermissionsGuard` lanza 403 con el mensaje crudo
  `No tienes permiso para <modulo>.<recurso>.<accion>`.
- El frontend tiene **dos capas de acceso** que pueden desalinearse:
  1. **Vistas** (`user.vistas` → `RouteGuard.tsx`): controla la ruta del sidebar y
     si puedes entrar a la página. Solo revisa `puedeVer` de la vista.
  2. **Permisos** (`PermissionsGuard` en cada endpoint): controla si la API te
     devuelve datos.
- Si un rol tiene la vista asignada pero no el permiso, el `RouteGuard` deja entrar,
  la página carga, y el primer `GET` falla con 403. Qué se muestra entonces depende
  de cada vista → esa es la inconsistencia.
- **Causa raíz del caso observado:** al Residente se le dio la vista `/trabajadores`
  sin el permiso `rrhh.trabajadores.ver` (desajuste de datos en `/roles`, no de código).
  El banner lo hará visible en cualquier módulo; la corrección del par vista↔permiso
  es acción de datos en `/roles`, no de este plan.

### 1b. Los tres grupos de manejo de errores de carga (estado actual)

| Grupo | Vistas | Qué hace hoy | Se ve el motivo del 403 |
|---|---|---|---|
| **G1 — Ops/Com** | las 13 del usuario | toast genérico **hardcodeado** (ni siquiera `mensajeErrorApi`) | ❌ oculto |
| **G2 — RRHH** | trabajadores, nomina, asistencia, dashboard | banner inline local con `res.error.message` crudo | ✓ (pero jerga `modulo.recurso.accion`) |
| **G2b — Maquinaria** | maquinaria, mantenimiento, combustible, gps, horometro | toast con `res.error.message` crudo | ✓ (jerga, sin Reintentar) |
| **G3 — Sistema** | roles, usuarios | solo toasts de mutaciones | (no aplica: sin carga inicial sensible a permisos) |

### 1c. Líneas exactas a tocar en las 13 vistas de G1 (barrido del 2026-11-15)

Cada fila = catch de carga inicial con toast genérico a sustituir por el banner.

| Vista | Cargas iniciales (líneas del `showToast` genérico) | Texto genérico actual |
|---|---|---|
| `/reportes` | 252, 256 | 'Error al cargar los incidentes.' / conexión |
| `/operaciones` | 101, 104 | 'Error al cargar la bitácora.' / conexión |
| `/criba` | 170, 173 | 'Error al cargar los registros de criba.' / conexión |
| `/inventario` | 122, 125 (+ `fetchStats` 133-142 y `catalogos()` 92-98, que falla **en silencio**) | 'Error al cargar inventario.' |
| `/proyectos` | 137, 140 | 'Error al cargar las obras.' |
| `/clientes` | 125, 128 | 'Error al cargar clientes.' |
| `/cotizaciones` | 147, 150 | 'Error al cargar cotizaciones.' |
| `/finanzas` | 103, 106 | 'Error al cargar las transacciones.' |
| `/proveedores` | 149 (proveedores), 168 (órdenes), 213, 235 | 2 cargas (tab proveedores / tab OC) |
| `/ventas` | **sin toast de carga inicial genérico** (278/334/371 son mutaciones); si su carga de catálogo/POS falla en silencio, decidir en implementación | — |
| `/cobranza` | 200, 215, 230, 250 (4 cargas: cuentas, movimientos, vencimientos, cartera) + 273, 294 | una por tab |
| `/ventas/cierres` | 85, 88 | 'Error al cargar cierres de caja.' |
| `/facturas` | 193, 196 | 'Error al cargar facturas.' |

**Bug colateral a corregir en el mismo pase:** en varias vistas el doble toast de la
captura del usuario viene de cargas paralelas que cada una tostea su fallo
(`/inventario`: `fetchData` + `fetchStats`; `/cobranza`: hasta 4). Con el banner,
la pantalla muestra **UN aviso** por carga fallida (los stats quedan en su valor
anterior/0 con `loading` del StatsCard, no tostean).

---

## 2. Propuesta — un solo patrón para toda la app

### 2a. Componente `ErrorState` en el kit (nuevo)

Ruta: `apps/web/src/components/ui/ErrorState/` con el patrón obligatorio del repo:
`ErrorState.tsx` + `ErrorState.styles.ts` + `index.ts`, y documentación completa en
`COMPONENTS.md` (props, import, uso, cuándo usar / cuándo NO).

**Props:**
```ts
interface ErrorStateProps {
  titulo?: string;        // default: 'No se pudo cargar la información.'
  detalle: string;        // SIEMPRE sale del helper (ver 2b), nunca compuesto a mano
  onReintentar?: () => void;
  reintentando?: boolean; // spinner en el botón durante el reintento
}
```

**Visual:** mismo diseño que el `Aviso` actual de `/trabajadores` (contenedor rojo
suave, borde redondeado, icono `ShieldAlert`, botón Reintentar) pero con tokens del
kit y sin CSS inline. El `Aviso` local de trabajadores queda obsoleto con A2.

**Cuándo usar:** SOLO el fallo de la **carga inicial** (o de la carga de la tab
activa) cuando no hay datos en pantalla. Nada más:
- Mutaciones (crear/editar/eliminar): siguen con **toast** de `mensajeErrorApi`.
- Refetch con datos ya en pantalla: `RefreshOverlay` + toast del helper (el banner
  reemplazaría datos válidos por error — prohibido).

### 2b. Helper único: humanizar el 403 en `mensajeErrorApi`

**Archivo:** `apps/web/src/lib/api.ts` (junto al helper actual `mensajeErrorApi`).
Regla nueva dentro del helper existente (así beneficia a TODOS los llamadores sin
tocar cada vista):

```
si error.code === 'FORBIDDEN' y message matchea "No tienes permiso para X.Y.Z" →
  "Tu rol no tiene permiso para este módulo. Pide al administrador el permiso X.Y.Z."
```

- El usuario deja de ver jerga cruda como texto único; el código `X.Y.Z` queda
  entre paréntesis/al final para que el administrador sepa QUÉ permiso dar de alta
  en `/roles` (es información accionable, no basura).
- No se duplica ningún `Intl.NumberFormat`-style helper: es una rama de `mensajeErrorApi`.

### 2c. Reglas de integración (aplican a ambas fases)

1. El banner reemplaza el **estado vacío** cuando la carga inicial falló
   (`emptyText` genérico engañoso fuera; el DataTable recibe `items=[]` igual).
2. Gated por `!initialLoading` — durante el skeleton no existe banner (regla de loaders).
3. `finally` limpia `initialLoading`/`refreshing` igual que hoy.
4. Reintentar vuelve a llamar a la misma carga (mismo patrón `recarga + 1` que usa
   trabajadores hoy).
5. Prohibido `style={{}}`; clases en `ErrorState.styles.ts` + `cn()`.
6. Toasts genéricos de carga inicial ('No se pudo conectar con el servidor.')
   en los `catch` de red de la carga inicial pasan al banner con el fallback
   `mensajeErrorApi` correspondiente (el helper mantiene el mensaje de conexión).

---

## 3. Fases, alcance y dueños

### Fase A1 — vías de Comercial/Operaciones (13 vistas) — *mismo dev de este hilo*

1. Commit **1** (kit): `ErrorState` nuevo + `COMPONENTS.md` + helper 403 humanizado
   en `lib/api.ts`. No toca vistas.
2. Commit **2** (vistas): wire del banner en las 13 vistas de G1 (tabla §1c) +
   eliminación de los toasts duplicados de cargas paralelas.

Cambio visible: SOLO estas 13 vistas (toast genérico → banner con motivo + Reintentar).
El resto de la app queda idéntico en pantalla.

### Fase A2 — consolidación del resto — *vistas del OTRO dev, requiere su visto bueno*

| Vista | Cambio | Visible en pantalla |
|---|---|---|
| trabajadores, nomina, asistencia, dashboard | su banner/`res.error.message` local migra al `ErrorState` del kit (se elimina el `Aviso` local) | **No** (mismo diseño; solo el 403 ahora sale humanizado) |
| maquinaria, mantenimiento, combustible, gps, horometro | sus toasts crudos pasan por `mensajeErrorApi` (que ya humaniza el 403) | Solo el texto del 403 (jerga → frase amable) |
| roles, usuarios | nada (sus errores son de mutación; el helper ya los cubre) | Solo texto de 403 si llegara a ocurrir |

Corte A1-solo = tu lista y nada más. A1+A2 = toda la app con UN patrón.
Sin A2 quedan dos implementaciones del banner en el repo (violación de la regla
de no duplicar kit) — A2 es deuda si se recorta.

### Acción de datos complementaria (no código)

Revisar en `/roles` los pares vista↔permiso de cada rol (Residente: vista
`/trabajadores` sin `rrhh.trabajadores.ver`; vista `/inventario` sin
`operaciones.inventario.ver`). Decidir por rol: se da el permiso (la vista sirve)
o se quita la vista del menú (no muestra una página en blanco con aviso).

---

## 4. Verificación (por fase)

- `npx tsc --noEmit` (web) + `npx eslint` targeted a los archivos tocados.
- Smoke con un rol SIN permiso y CON vista (el caso exacto del usuario):
  1. En `/roles`, crear/editar un rol de prueba con la vista asignada y el permiso
     de ver quitado, asignárselo a un usuario.
  2. Recorrer las 13 vistas de A1: banner rojo con el motivo humanizado + Reintentar;
     UN solo aviso (sin toasts duplicados); KPIs con spinner, no "0" mentiroso… 
     (nota: con error de carga los KPIs muestran su valor anterior/0 — decisión:
     el banner manda, los KPIs no deben simular carga infinita).
  3. Reintentar con el permiso ya concedido: banner desaparece y la tabla carga.
  4. Con datos previos en pantalla (refetch falla): toast del helper, no banner.
  5. Mutación sin permiso: sigue toast (helper humanizado), sin banner.
- Verificar en `/ui-showcase` o `COMPONENTS.md` que el componente queda documentado.

## 5. Riesgos

- **Regresión de loaders:** al tocar los catch de carga inicial en 13 vistas hay que
  respetar el gating `!initialLoading` — riesgo de banner sobre skeleton si se integra
  mal (mitigado: el patrón por vista ya existe en trabajadores).
- **Helper 403 global:** humanizar dentro de `mensajeErrorApi` cambia el texto de
  403 también en mutaciones de TODAS las vistas (deseado para uniformidad, pero es
  un cambio de contrato de textos — avisar al otro dev).
- **A2 sin dueño:** las vistas de G2 son del otro dev; tocarlas sin coordinación
  rompe el paralelo de trabajo. Por eso va como fase separada.
- `/ventas`: si su catálogo del POS carga en silencio, con el helper quedará igual
  que hoy; decidir si además lleva banner (a criterio en implementación).

## 6. Commits propuestos (1 cambio = 1 commit, con registro)

```
feat(web): componente ErrorState en el kit ui + 403 humanizado en mensajeErrorApi (plan banner)
fix(web): banner de error de carga en las vistas de Comercial y Operaciones (13 vistas, plan banner)
refactor(web): RRHH y Maquinaria migran al ErrorState del kit — consolidación de banner (plan banner, fase A2 — requiere visto bueno del dueño)
```

Registros: `historial-cambios/2026-11-15-banner-error-carga-*.md` por commit.

---

## Estado: PROPUESTO — pendiente de autorización

- [x] Diagnóstico verificado (guard backend, RouteGuard, 3 grupos, líneas por vista)
- [ ] Autorización del usuario: alcance A1-solo o A1+A2, y texto del 403 humanizado
- [ ] Coordinación con el otro dev para A2
- [ ] Implementación por commits
