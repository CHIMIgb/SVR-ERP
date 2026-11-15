# Plan — RBAC de acciones universal: ocultar lo que el permiso no respalda

**Fecha:** 2026-11-15 · **Branch de trabajo:** `comercial-operaciones`
**Origen:** observación del usuario — un rol con la vista asignada entra, ve registros y
botones de acción, pero al ejecutar la acción recibe el toast "no tienes permiso".
Reglas decididas por el usuario:

1. **Alcance:** escritorio + PWA (los 2 devs se comunican; mismo helper, misma API).
2. **Comportamiento:** si el rol no tiene el permiso de la acción, el botón/acción
   **no se muestra** (nada deshabilitado-gris); y el backend sigue validando (ya lo
   hace en casi todo — este plan cierra los huecos que quedan).
3. **Fuente de verdad:** los **permisos granulares** `(modulo, recurso, accion)` de
   `user.permisos` — no los flags `puedeCrear/puedeEditar/...` de `user.vistas`.

Complemento del plan de banner (`PLAN-BANNER-ERRORS-CARGA-2026-11-15.md`):
el banner cubre "vista sin permiso de **ver**"; este plan cubre "acción sin
permiso de **hacer**". Se ejecutan por fases independientes.

---

## 1. Estructura actual del RBAC (verificada contra la BD al 2026-11-15)

### 1a. El catálogo

- **107 permisos** en `permissions`, únicos por `(modulo, recurso, accion)`.
  Distribución: comercial 30 · maquinaria 18 · operaciones 24 · rrhh 15 ·
  sistema 19 · dashboard 1.
- Llegan al frontend en `GET /auth/profile` dentro de `user.permisos[{modulo, recurso, accion}]`
  y `user.vistas[{ruta, puedeVer, puedeCrear, puedeEditar, puedeEliminar, puedeExportar}]`.
- **Hay DOS asignaciones independientes por rol** que hoy nadie cruza:
  `role_permissions` (lo que defiende el backend) y `role_vistas` con sus 5 flags
  (lo que gatilla los botones). El seed las llena por separado y ninguna capa
  valida que coincidan → **ahí nace el desalineamiento**: flag `true` + permiso
  `false` = botón visible que truena; flag `false` + permiso `true` = botón escondido
  que la API sí permitiría.

### 1b. Uso real en el frontend (barrido de las 27 vistas)

| Patrón | Dónde | Frecuencia |
|---|---|---|
| Flags de vista (`vista?.puedeX ?? false`) | casi todas las vistas CRUD | ~230 referencias |
| `user.permisos` directo | solo 2: `trabajadores` (Reiniciar PIN → `sistema.usuarios.editar`) y `reportes` (torre) | 2 |
| Sin ningún gate de acción | `/ventas/corte` (solo flag `puedeVer` de la vista), secciones dentro de varias vistas | varias |

El gate por flags funciona hoy **solo porque el seed las llena consistentemente para
Administrador**; con roles recortados (Residente) empiezan a verse los casos del usuario.

### 1c. Auditoría del backend (lo que defiende de verdad)

- **228 rutas** en 32 controladores; **216 con `@RequirePermission`**.
- Exentos legítimos (por diseño, con JWT y/o throttle): `auth` (login/refresh/logout,
  5 rutas), `pin` (login-pin público, `pin/cambio` y `pin/estado` son recurso propio,
  3 rutas). **Ningún endpoint de negocio sin su permiso.** ✔
- **85 combos únicos** exigidos por los controladores; todos existen en la BD
  (ninguno "prestado" que no exista). ✔
- **22 permisos en BD que NINGÚN endpoint exige** — el catálogo y el código han
  derivado. Clasificados en §2.

### 1d. Desalineamientos concretos botón↔permiso (los que producen el bug)

| Vista | Botón/acción | Gate hoy | Endpoint exige | Resultado con rol recortado |
|---|---|---|---|---|
| `/nomina` | **Sincronizar asistencia** | flag `puedeEditar` | `rrhh.nomina.procesar` | botón visible → 403 en el toast |
| `/nomina` | Ajuste | flag `puedeCrear` | `rrhh.nomina.crear` | ✓ alineado (por suerte) |
| `/ventas` | Vender / apertura | flag `puedeCrear` | `comercial.ventas.crear` | ✓ si el seed coincide; nada lo garantiza |
| `/ventas/corte` | todo el flujo de corte | flag `puedeVer` de la vista `/ventas/corte` | `comercial.ventas.ver`/`crear` | desalineable |
| `/trabajadores` | Alta/Baja/Editar | flags | `rrhh.trabajadores.crear/editar/eliminar` | desalineable |
| TODAS | botones `Exportar` de vistas con export client-side o CSV | flag `puedeExportar` | variable (ver §2) | desalineable |

---

## 2. Los 22 permisos huérfanos (en BD, sin endpoint que los exija)

**Clasificación:**

| Tipo | Permisos | Decisión propuesta |
|---|---|---|
| **A. Feature no construida** (la vista/módulo no existe o no llega a BD) | `sistema.documentos.{ver,crear,editar,eliminar}`, `sistema.configuracion.{ver,editar}`, `sistema.reportes.{ver,exportar}`, `comercial.cotizaciones.eliminar/exportar`, `operaciones.inventario.exportar`, `operaciones.reportes_campo.exportar`, `maquinaria.flota.editar/eliminar` (no hay PATCH/DELETE de máquinas), `maquinaria.horometro.editar` (no hay PATCH de horómetro), `maquinaria.mantenimiento.aprobar` (no hay endpoint aprobar), `comercial.ventas.cancelar` (no hay cancelar venta) | NO tocarlos por ahora: son el catálogo de features futuras. Se elimina el riesgo poniendo el gate del lado de los botones (§3): si no hay botón, el permiso es inerte. |
| **B. Acción cubierta client-side** (sin endpoint) | `rrhh.nomina.exportar` (Exportar SPEI es generación local), `rrhh.asistencia.exportar`, `maquinaria.combustible.exportar`, `dashboard.dashboard.ver` (el dashboard agrega stats de otros módulos) | Gatear el botón client-side con el MISMO permiso (el flag `puedeExportar` se sustituye por `puede('rrhh','nomina','exportar')`). El permiso queda con uso real. |
| **C. Permiso correcto que existe pero el botón usa otro** | — (no hay: el único caso es `nomina.procesar`, que SÍ usa el endpoint de sincronizar; el bug es del BOTÓN, no del endpoint) | Fix en el botón (§3). |

**Conclusión backend: no hace falta crear permisos nuevos ni migración para el
gating.** Las únicas decisiones de producto sobre huérfanos tipo A se toman cuando
se construya (o retire) cada feature.

---

## 3. Implementación universal (la forma)

### 3a. Helper único (el 5% del trabajo)

**Archivo:** `apps/web/src/lib/permisos.ts` (consumido por escritorio Y PWA — misma app).

```ts
import { useAuth } from '@/hooks/useAuth';
import type { UserAuth } from '@svr-erp/shared';

export function puede(
  user: UserAuth | null | undefined,
  modulo: string, recurso: string, accion: string,
): boolean {
  return !!user?.permisos?.some(
    (p) => p.modulo === modulo && p.recurso === recurso && p.accion === accion,
  );
}

export function usePuede(modulo: string, recurso: string, accion: string): boolean {
  const { user } = useAuth();
  return puede(user, modulo, recurso, accion);
}
```

- Reglas: cada botón/acción/registro usa la tupla **EXACTA** que exige su endpoint
  (nunca un flag de vista, nunca "pedir prestado" el permiso de otra vista).
- El `permisos: string[]` (Set de `modulo.recurso.accion`) opcional si el perfil
  crece; empezar con el `some` simple (YAGNI).
- Los **flags `puedeCrear/Editar/Eliminar/Exportar` de `user.vistas` quedan
  OBSOLETOS como gating**: `puedeVer`/la vista sigue definiendo el MENÚ y la ruta
  (RouteGuard + sidebar, escritorio y PWA), pero los botones se rigen por permisos.

### 3b. La tabla de mapeo (el 95% del trabajo) — regla de derivación

Cada acción se mapea mirando `lib/api.ts` (método) → controlador (tupla del
decorador). La tabla del plan del banner (§1c) cubre las vistas de G1; para el resto,
mismo procedimiento por vista. Mapeos especiales ya resueltos:

| Acción | Permiso que gatilla el botón |
|---|---|
| Vender / registrar venta, retiro de caja, apertura de caja | `comercial.ventas.crear` |
| Aprobar/rechazar cierre de caja | `comercial.ventas.editar` |
| Página `/ventas/corte` (el flujo completo) | `comercial.ventas.ver` para datos + `comercial.ventas.crear` para ejecutar |
| Sincronizar asistencia → nómina | `rrhh.nomina.procesar` (fix del bug de la tabla §1d) |
| Marcar pagado / Pagar todos | `rrhh.nomina.editar` |
| Ajuste de nómina | `rrhh.nomina.crear` |
| Liquidar / Dar de baja trabajador | `rrhh.trabajadores.eliminar` (el endpoint ya lo exige así) |
| Reiniciar/desbloquear PIN | `sistema.usuarios.editar` (ya correcto hoy) |
| Exportar CSV real (finanzas/cobranza/facturas) | `comercial.X.exportar` |
| Export client-side (SPEI, dispersion, PDF) | el permiso del módulo correspondiente (tipo B de §2) |
| Facturar cotización | `comercial.cotizaciones.editar` (hoy); si se quiere permiso propio (`facturar`), es decisión de producto con seed — NO en este plan |

**Regla para secciones/registros:** una tab, sección o columna que SOLO consume datos
de un permiso se oculta completa con ese permiso (ej. tab "Bitácoras de renta" de
`/trabajadores` → `rrhh.trabajadores.ver`; el no-ver global ya lo cubre el banner).

### 3c. Pantalla `/roles` (coordinación importante)

La UI de `/roles` hoy edita los **flags** de `role_vistas`. Si los botones dejan de
leerlos, esa pantalla deja de tener efecto sobre las acciones → **en el mismo lote
hay que hacer que la pestaña "Permisos" sea la fuente de acción** (ya existe:
asigna/revoca `role_permissions`). Decisión propuesta: los checkboxes de la ficha de
vista quedan para `puedeVer` (menú); el CRUD granular se gestiona en Permisos.
Sin este punto, el admin no tendría forma de cambiar quién ve botones.

---

## 4. Fases y commits (1 cambio = 1 commit, con registro)

| Fase | Alcance | Dueño | Commits |
|---|---|---|---|
| **F1** | `lib/permisos.ts` (`puede`/`usePuede`) + doc en el plan + smoke | este dev | 1 |
| **F2** | 13 vistas Ops/Com (las del plan banner) — wiring de botones a la tupla exacta | este dev | 1-2 |
| **F3** | Vistas RRHH/Maquinaria/Sistema (`trabajadores`, `nomina`, `asistencia`, `maquinaria`, `mantenimiento`, `combustible`, `gps`, `horometro`, `dashboard`, `roles`, `usuarios`) | **otro dev** (coordinar) | 1-2 |
| **F4** | PWA `/m/*` — mismo helper; nav ya sale de vistas | dev PWA | 1 |
| **F5** | `/roles`: pestaña Permisos como única fuente de acciones | coordinado | 1 |
| **F6** (opcional, producto) | huérfanos tipo A: construir features o retirar permisos | decisión del cliente | — |

Orden: F1 → F2 (mismo dev, sin bloquear a nadie) → F3/F4/F5 en paralelo coordinado.
F2 y F3 pueden empezar cuando F1 esté mergeada.

## 5. Verificación

- `npx tsc --noEmit` + eslint targeted (fase F1/F2; web no tiene tests front aún —
  la deuda activa lo cubre con smoke documentado).
- Smoke por vista con rol recortado (el patrón del usuario): rol con vista+ver pero
  sin crear/editar → la vista carga (o banner, según el otro plan), **sin botones de
  acción**; con el permiso dado de alta → botones aparecen sin recargar sesión
  (o tras refetch del perfil).
- Auditabilidad: grep de `puedeCrear\|puedeEditar\|puedeEliminar\|puedeExportar`
  debe tender a 0 en gating de botones al terminar F3 (queda en nada o solo en
  transición).

## 6. Riesgos

- **Cambio de UX para roles mal sembrados:** un rol que HOY ve botones por flag
  `true` pero sin el permiso real, dejará de verlos. Es el comportamiento pedido,
  pero cambia lo que los usuarios veían — avisar antes de pushear.
- **Doble fuente mientras avanza el lote:** durante F2→F3 conviven flags y permisos;
  no mezclar gating nuevo y viejo en la misma vista en el mismo commit.
- **`/roles` sin actualizar (F5 retrasada):** los flags dejarían de tener efecto y
  el admin podría pensar que asignó acciones que no se reflejan — F5 no es opcional.
- **El catálogo huérfano (§2 tipo A) es deuda de producto:** mientras esas features
  no existan, los permisos son inertes pero existen — si se construyen features
  nuevas, el endpoint DEBE usar su permiso propio (regla del repo de permiso #107+).
- 107 vs 106: el conteo histórico de la doc dice 106; la BD tiene 107 al día del
  barrido — revisar duplicado invisible en el siguiente toque de seed (regla de
  vigilancia de permisos del repo).

## Estado: PROPUESTO — pendiente de autorización

- [x] Auditoría de estructura (BD, backend, frontend) verificada
- [x] Reglas decididas por el usuario (ocultar, permisos granulares, escritorio+PWA)
- [ ] Autorización para F1 (helper) y F2 (vistas de este hilo)
- [ ] Coordinación F3 (otro dev), F4 (PWA), F5 (/roles)
