# Registro retroactivo — commits sin registro propio (bloque 10, opción a)

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Qué es este documento

La regla del repo exige que **cada commit incluya su archivo de registro en
`historial-cambios/` dentro del mismo commit**. La revisión del PR #17 detectó
~36 commits que no cumplen. Verificado contra la rama (audit script):
**38 commits de 111** no traen息息 su registro adentro.

**Por qué pasa:** la regla se endureció el **9 de noviembre**, mitad del
trabajo ya corrido. Antes de esa fecha los registros se hacían — pero
**después**, en un commit siguiente (registro diferido). Además hay 3 casos
especiales explicados abajo. Este documento los lista UNO POR UNO — el
contenido del trabajo ya está descrito (message del commit + registro
tardío apuntado); aquí queda la trazabilidad continua.

**Prevención:** todos los commits desde esta fecha llevan registro adentro
del mismo commit.

---

## 1. /reportes — maquetación y columnas (8-nov, registro diferido)

| Commit | Tema | Registro que lo cubre |
|---|---|---|
| `57ee6ea5` | fix: key de imagen sin crypto.randomUUID (fallo por HTTP LAN sin contexto seguro) | `2026-11-08-reportes-webp-y-ver-info.md` |
| `45611acc` | refactor: columna Responsable sin icono, texto plano | `2026-11-08-unificacion-vocabulario-torres.md` |
| `14ddc44e` | refactor: campos del alta en una sola columna (área, subcategoría, ubicación y prioridad apiladas) | *sin registro propio — iteración intermedia del alta; el layout final quedó descrito en los registros de la misma sesión* |
| `6689358e` | refactor: área y ubicación a fila completa; subcategoría + prioridad en par | `2026-11-08-reportes-aceptar-y-ambito-por-torre.md` |
| `99ef23ef` | refactor: área + subcategoría en par, ubicación y prioridad a fila completa | `2026-11-08-reportes-aceptar-y-ambito-por-torre.md` |
| `7113e32c` | chore: limpia import sin uso (ProyectoDTO) | `2026-11-08-reportes-aceptar-y-ambito-por-torre.md` |
| `d0503240` | refactor: Pagination — registros a la izquierda, página+nav centrados lado a lado | `2026-11-08-reportes-aceptar-y-ambito-por-torre.md` |
| `17c82c0d` | fix: truncado real de descripción con ancho fijo de celda | `2026-11-08-reportes-rbac-residentes-y-jefes.md` |
| `1152afd8` | feat: DataTable — propiedad de columna `truncate` (layout fijo + ellipsis) aplicada en /reportes | `2026-11-08-reportes-rbac-residentes-y-jefes.md` |
| `76e01c8f` | fix: acciones cabe en su columna y subcategoría con truncado en layout fijo | *sin registro propio — iteración intermedia; suspendida por `e6839294` (bloque siguiente)* |
| `e6839294` | fix: acciones 440px como estaba y descripción road por contenido (la doc manda: columnas se adaptan al contenido) | *sin registro propio — revert del anterior; la convención vigente quedó en el registro del merge (2026-11-09)* |
| `39aaa470` | refactor: descriptor breve de 40 caracteres en la columna descripción | *sin registro propio — documentado en el feedback del revisor (features 5 de /reportes)* |
| `001bce4b` | fix: columna Acciones se adapta al contenido (sin minWidth fijo) | `2026-11-08-usuarios-por-area-y-doc-areas.md` |
| `43802bd9` | fix: aceptar incidente via POST (coincide con la ruta del backend) | `2026-11-08-usuarios-por-area-y-doc-areas.md` |
| `463c8a48` | refactor: Aceptar vive solo en la columna de acciones | `2026-11-08-usuarios-por-area-y-doc-areas.md` |
| `077c96fc` | feat: editar solo admin/creador y baja automática de cerrados a los 2 días (admins conservan vista) | `2026-11-08-usuarios-por-area-y-doc-areas.md` |
| `b7e64334` | fix(api,web): catálogo de proyectos EN_PROCESO con permiso de vista y áreas agrupadas en el select | `2026-11-08-roles-tecnicos-descriptivos.md` |

## 2. /reportes — filtros, residente y USD (9-nov, registro diferido)

| Commit | Tema | Registro que lo cubre |
|---|---|---|
| `db59c4a8` | fix: opciones duplicadas del select de área en el alta | `2026-11-08-catalogo-proyectos-y-areas-agrupadas.md` |
| `34ac6a40` | refactor: chips y ceder del panel vía componentes del kit (ActiveFilters/FilterPanel) | `2026-11-08-catalogo-proyectos-y-areas-agrupadas.md` |
| `9bd017d6` | refactor: quita el botón Limpiar del panel de filtros (quede Limpiar todo en los chips) | `2026-11-08-catalogo-proyectos-y-areas-agrupadas.md` |
| `4ed5749f` | feat: el Residente no acepta incidentes (solo seguimiento) | `2026-11-09-residente-sin-imagenes.md` |

## 3. Sidebar/Topbar + POS (9-nov, sin registro en el momento)

| Commit | Tema | Registro |
|---|---|---|
| `eef28ded` | refactor: topbar sin pop-up de usuario y botón Cerrar Sesión discreto en el sidebar | *sin registro propio — el trabajo se describe en el message y el siguiente refactórelo (rediseño) * |
| `06b1b3db` | chore: topbar — quita logout sin uso del useAuth | *sin registro propio — limpieza que va con el anterior* |
| `3b366e88` | refactor: sidebar — resaltado rojo del botón Cerrar Sesión permanente | *sin registro propio — última iteración del grupo (el estado vigente quedó en los mensajes)* |
| `7e0b5836` | fix: POS — el selector de producto arranca vacío (sin preselección) | *sin registro propio* |
| `e36ad130` | fix: POS — productUnitPrice con null-safety tras quitar preselección | *sin registro propio* |

## 4. Documentos de planificación (docs/planes, 9-nov — el .md ES el entregable)

| Commit | Tema | Documento |
|---|---|---|
| `2fc19102` | docs(plan): análisis previo de vistas móvil COMERCIAL/OPERACIONES | `docs-planes/vistas-movil-comercial-operaciones.md` |
| `c118a26a` | docs(plan): análisis pantalla-por-pantalla del PWA (20 vistas, 5 roles) | `docs-planes/vistas-movil-comercial-operaciones.md` |
| `77189de8` | docs(plan): decisión recomendada para la PWA móvil — mini-app dedicada por rol (opción B) | `docs-planes/vistas-movil-comercial-operaciones.md` |
| `114d3ce5` | docs(plan): razones para el shell nuevo y preguntas abiertas al equipo | `docs-planes/vistas-movil-comercial-operaciones.md` |
| `42c6aad3` | docs(plan): detector por ancho de pantalla + interruptor manual | `docs-planes/vistas-movil-comercial-operaciones.md` |

## 5. JWT y merges (9-nov — el trabajo grande vino de otro commit)

| Commit | Tema | Registro |
|---|---|---|
| `0449746b` | fix(api): JWT sin secretos de respaldo + fail-fast + rotación | `2026-11-09-jwt-secretos-sin-respaldo-y-rotacion.md` (conmutado en otro commit posterior) |
| `4fe875b8` | merge: origin/main → plataforma-experiencia (PR #16) | `2026-11-09-merge-main-a-plataforma-experiencia.md` (commit posterior) |
| `1dee538b` | merge: local plataforma (SHA fix JWT) → plataforma (pull merge del levantado) | mismo registro de arriba |
| `b3149ddd` | fix(web): dashboard lee estados v2 (nuevos/enCurso) — residuo del merge | mismo registro de arriba |

## 6. Nov-07 — docs y bug documentado (antes de endurecer la regla)

| Commit | Tema | Registro |
|---|---|---|
| `3536ab2c` | docs: efecto fadeScaleIn para banners — keyframe en globals.css | `2026-11-07-f2-proveedores-finanzas-skeleton.md` |
| `425d7400` | docs: F6 marcado REALIZADO en IMPLEMENTACIONES-A-FUTURO | `2026-11-08-p4b-venta-pos-descuenta-inventario.md` |
| `f2a2b67f` | documentar bug en /inventario | `2026-11-08-fix-uuids-categorias-unidades-inventario.md` |

---

## Fuente de datos

Auditoría con script:
- `git log --reverse origin/main..HEAD` — commits de la rama no en main (111).
- `git show --name-only` por commit — el contenido real de cada uno.
- 73/111 llevan su registro dentro del mismo commit; 38 fuera (este
documenot los lista).

## Prevención (en adelante)

Todos los commits desde el 11 de noviembre llevan su registro primero y
después el commit: la práctica de "registro diferido" ya no se usa. De nuevo
les digo: adherence al review del PR #17.
