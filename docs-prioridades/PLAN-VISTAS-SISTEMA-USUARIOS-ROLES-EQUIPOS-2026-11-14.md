# PLAN VISTAS DE SISTEMA — CRUD de Usuarios, Equipos (Residentes ↔ Empleados) y Gestión de Identidad

> **Fecha:** 2026-11-14 · **Módulo:** Sistema · **Acceso:** SOLO Administrador
> **Fuente:** secciones P10–P14 de `IMPLEMENTACIONES-A-FUTURO.md` + lo pedido
> por el cliente. Formaliza las "Vista A/B de Fase 0" que el plan comercial
> dejó fuera de alcance (P11/P12).
> **Se construye UNA vista a la vez, en el orden de §6.**

---

## 0. Alcance en una línea

Tres vistas nuevas en el módulo Sistema, visibles y accesibles **únicamente
para el rol Administrador** (`es_sistema`), construidas sobre la infraestructura
de identidad que la fase PWA ya dejó en la BD — **cero migraciones de dominio**:
solo una migración de seed (3 vistas del sidebar + `role_vistas` para admin).

| # | Vista | Ruta propuesta | Qué resuelve |
|---|-------|----------------|--------------|
| V1 | CRUD de Usuarios | `/usuarios` | Registrar a quienes usan la app de **escritorio**: correo + contraseña; muestra la identidad PWA de quien la tenga |
| V2 | Equipos | `/equipos` | Enlazar **Residentes con sus empleados** (`jefe_user_id`): asignar / re-asignar / des-asignar |
| V3 | Gestión de Identidad | `/roles` | Panel 360: **roles, permisos, áreas (torre), estado de PIN y sesiones** por usuario, con acciones de mesa de ayuda |

---

## 1. Estado real hoy (verificado contra BD y código, 2026-11-14)

### 1.1 Lo que YA existe y se REUSA (no se duplica)

| Pieza | Dónde | Detalle |
|---|---|---|
| Campos de identidad en `users` | `schema.prisma` | `numero_empleado` (únic@), `pin_hash`, `pin_temporal_hasta`, `pin_cambiado_en`, `pin_historial`, `intentos_pin`, `jefe_user_id` (FK self + índice), `torre` |
| **Alta de trabajador con identidad** | `trabajadores.service.ts` | Genera `numero_empleado` consecutivo (prefijo por rol, sufijo MÁXIMO, índice único cierra la carrera), PIN temporal 24 h, rol del puesto, **encargado (jefe)** y email técnico único. Modo "acceso-pwa" crea identidad a un trabajador existente. **Esto ya cumple lo que el cliente pidió para "trabajador": número + PIN.** |
| **Endpoints de PIN admin** | `auth/pin/pin.controller.ts` | `POST /auth/pin/reinicio` y `POST /auth/pin/desbloqueo` con permiso `sistema.usuarios.editar` + auditoría `PIN_REINICIADO`/`CUENTA_DESBLOQUEADA`; `GET /auth/pin/estado` para el estado de PIN. **Las acciones de mesa de ayuda de V3 ya tienen backend.** |
| Scope de reportes por jefe | `aplicarAmbito` | Residentes ven los reportes levantados por `jefe_user_id = yo` + los suyos; fallback: sin jefe → solo lo propio. Funciona HOY. |
| Permisos | `permissions` (107 totales) | `sistema.usuarios.{ver, crear, editar, eliminar, asignar_rol}`, `sistema.roles.{ver, crear, editar, eliminar}`, `sistema.permisos.{ver, editar}` — **ya existen y SOLO el rol Administrador los tiene** (verificado en `role_permissions`: 11 permisos, 1 solo rol). |
| Enum de auditoría | `AuditAction` | `USUARIO_CREADO`, `USUARIO_ACTUALIZADO`, `USUARIO_ELIMINADO`, `ROL_ASIGNADO`, `ROL_REVOCADO`, `PIN_CAMBIADO`, `PIN_REINICIADO`, `CUENTA_DESBLOQUEADA`, `SESION_CERRADA`, `USUARIO_BLOQUEADO` — ya en BD. |
| Sesiones | `sessions` / `refresh_tokens` | Con `dispositivo`, `ubicacion`, `ip_address`, `ultima_actividad`, `activa`, `cerrada_en` — todo para el panel de sesiones de V3. |

### 1.2 Lo que NO existe (lo que este plan construye)

- **Módulo `usuarios` en la API** (no existe; solo `auth` y el vínculo dentro de `trabajadores`).
- Las **3 vistas** del sidebar (`/usuarios`, `/equipos`, `/roles` — el sidebar no las tiene hoy; la única de Sistema construida es `/configuracion`).
- **Endpoint de cierre masivo de sesiones** (`POST /usuarios/:id/sesiones/cierre`).
- **Endpoint de asignación de jefe** (`POST/PATCH /usuarios/:id/jefe`) — hoy es solo SQL.
- CRUD de **roles** (crear/editar/eliminar el rol en sí — los permisos existen desde el seed pero nunca tuvieron endpoint).

---

## 2. Decisiones de diseño (D1–D7)

- **D1 — Acceso exclusivo Administrador.** La migración de seed crea las 3
  vistas y las asigna en `role_vistas` SOLO al rol Administrador, con todos
  los flags (`puede_ver/crear/editar/eliminar` = true). Los permisos del
  módulo ya son exclusivos del admin (§1.1) — **no se revoca nada a nadie**.
  El `PermissionsGuard` es la segunda puerta; el sidebar (que se arma desde
  `user.vistas`) ni siquiera mostrará las rutas a otros roles.
- **D2 — Cero permisos nuevos (regla anti-duplicado).** Los 11 permisos
  existentes cubren todo: asignar jefe y reiniciar PIN son acciones de
  **editar usuario** → `sistema.usuarios.editar` (el endpoint de PIN del
  backend ya usa exactamente ese permiso). NO se crea `asignar_jefe` porque
  sería un duplicado invisible del mismo recurso.
- **D3 — La identidad del trabajador NO se duplica.** El alta de
  Trabajadores ya genera número de empleado + PIN temporal (§1.1). La vista
  `/usuarios` lo **muestra** (columna identidad + estado de PIN) y permite
  **reiniciar** el PIN, pero no vuelve a implementar la generación. El
  usuario de escritorio se registra en `/usuarios` con **correo real +
  contraseña** (bcrypt) — esa es la diferencia que pidió el cliente.
- **D4 — Rutas y orden en el sidebar.** El bloque Sistema hoy ocupa
  /documentos (orden 50) y /configuracion (53). Asignación propuesta:
  **`/usuarios` orden 51 (icono `UserCog`)**, **`/equipos` orden 52 (icono
  `UsersRound`)**, **`/roles` orden 54 (icono `ShieldCheck`)**. IDs de vista
  siguiendo el patrón de la tabla (`bb000006-...-0005/6/7`).
- **D5 — Auditoría del jefe sin migración de enum.** `AuditAction` es un
  enum de BD (agregar valor = migración). La asignación de jefe audita con
  `USUARIO_ACTUALIZADO` + `metadata: { campo: 'jefe_user_id', jefeUserId }`
  (mismo patrón que B2, que puso `obraId` en `PROYECTO_CREADO` sin crear
  acción nueva). El spec de P11 soñaba con `JEFE_ASIGNADO` — queda anotado
  como mejora posible si el cliente lo quiere literal.
- **D6 — Eliminación de usuario = soft delete + sesiones cerradas.**
  `DELETE /usuarios/:id` pone `eliminado_en` y cierra sus `sessions` activas
  (un usuario eliminado no puede seguir con sesión viva). **Prohibido
  eliminar al último Administrador** y a sí mismo (guard propio).
- **D7 — Estándares del repo, sin excepciones.** Los 4 de endpoint (JWT,
  blacklist, audit SUCCESS, FAIL + `error_code` con patrón `fallir()`),
  listados **paginados** (default 10, techo 100), vistas con plantilla
  `/inventario` (PageHeader, StatsCards, SearchBar + filtros + chips,
  DataTable por RBAC, Pagination, FormModal), `mensajeErrorApi` en toasts,
  responsive, textos es-MX, helpers de `lib/formatters.ts` (fechas con
  `APP_TIMEZONE`), y smoke manual documentado (no hay tests frontend).

---

## 3. VISTA V1 — `/usuarios` (CRUD de usuarios de escritorio)

### 3.1 UI (plantilla `/inventario`)

- **PageHeader** "Usuarios" + botón "Nuevo Usuario" (RBAC `puedeCrear`).
- **StatsCards** (4): Usuarios totales · Activos · Con identidad PWA
  (`numero_empleado` no null) · Cuentas bloqueadas por PIN
  (`intentos_pin` en umbral / `pin_temporal_hasta` activo). Sin colores en
  el texto (estilo del cliente).
- **SearchBar** (busca en nombre de persona, email, número de empleado) +
  **Filtros**: rol (select), área/torre (select), estado (activo/inactivo) +
  chips activos.
- **DataTable** (paginación server-side): Persona (nombre completo) · Email ·
  Roles (badges de texto, sin color) · Área (torre) · Identidad PWA (número
  de empleado o "—") · Estado PIN (Normal / Temporal / Bloqueado — texto
  neutro) · Creado. Acciones por RBAC: **Editar**, **Asignar rol**,
  **Reiniciar PIN** / **Desbloquear** (contextual), **Eliminar**.
- **FormModal** crear/editar:
  - **Persona**: select del catálogo de personas (se puede alta rápida con
    nombre/apellidos — decisión: reusar el patrón del alta de
    Trabajadores), **email** (único, `EMAIL_DUPLICADO` en P2002) y
    **contraseña** (solo en crear; en editar se omite — el usuario la
    cambia por su cuenta; nunca se muestra).
  - **Rol principal** (select de roles activos; `es_sistema` NO aparece —
    el service lo rechaza con `ACCESO_ROL_INVALIDO`, patrón existente) y
    **área (torre)**.
  - En edición de un usuario con identidad PWA: bloque de solo-lectura con
    su número de empleado y estado de PIN (los datos de identidad los
    sigue gestionando Trabajadores / V3).
- Responsive: formulario apilado en móvil, tabla con scroll horizontal.

### 3.2 Endpoints (módulo nuevo `apps/api/src/usuarios/`)

| Endpoint | Permiso | Auditoría (acción / FAIL) |
|---|---|---|
| `GET /usuarios` (paginado + `search`, `rolId`, `torre`, `estado`) | `sistema.usuarios.ver` | — (lectura) |
| `GET /usuarios/catalogos` (roles activos, torres, personas sin usuario) | `sistema.usuarios.ver` | — |
| `POST /usuarios` (persona, email, password, rol, torre) | `sistema.usuarios.crear` | `USUARIO_CREADO` / `EMAIL_DUPLICADO`, `ROL_NO_ASIGNABLE` |
| `PATCH /usuarios/:id` (email, activo, torre) | `sistema.usuarios.editar` | `USUARIO_ACTUALIZADO` / `USUARIO_NO_ENCONTRADO` |
| `DELETE /usuarios/:id` (soft + cierra sesiones) | `sistema.usuarios.eliminar` | `USUARIO_ELIMINADO` / guards D6 |
| `POST /usuarios/:id/roles` (asignar / revocar, con `es_principal`) | `sistema.usuarios.asignar_rol` | `ROL_ASIGNADO` / `ROL_REVOCADO` / `ROL_YA_ASIGNADO`, `ACCESO_ROL_INVALIDO` |

Contraseñas: `bcryptjs` (el mismo hash del `auth`), nunca en respuestas ni
en `newValue` de auditoría. El service valida que el email no exista
**ni activo ni eliminado** (índice único de BD de red de seguridad).

### 3.3 Pruebas (los 3 tipos obligatorios)

- **Unitarias** (`@nestjs/testing`, mocks): 1+ por método público del
  service y controller; asserts de FAIL + `error_code` en cada fallo de
  negocio (email duplicado, rol de sistema, auto-eliminación, último admin).
- **Integración** (BD real): insertar persona+user reales, unicidad de email
  rechazando duplicado, soft delete dejando `eliminado_en` y sesiones
  cerradas, asignación/revocación de rol.
- **`registro_auditoria`**: SUCCESS y FAIL con `error_code` por cada
  mutación, inserciones REALES, limpieza FK-safe (el registro de auditoría
  no se borra — inmutable); DELETE contra la tabla rechazado por el trigger.

---

## 4. VISTA V2 — `/equipos` (Residentes ↔ sus empleados, P11)

### 4.1 UI

- **PageHeader** "Equipos" — lista de **Residentes** (usuarios con rol
  Residente) y, por cada uno, su equipo actual (`jefe_user_id` = el
  residente). Card por residente con su lista de subordinados (nombre,
  rol, área, número de empleado si tiene).
- **StatsCards**: Residentes con equipo · Usuarios sin jefe (candidatos) ·
  Total asignaciones.
- **Acciones** (RBAC `puedeEditar` = `sistema.usuarios.editar`):
  **Asignar** (select de usuarios que no tengan jefe, excluyendo al propio
  residente), **Re-asignar** (cambia el jefe — se muestra el equipo destino
  antes de confirmar) y **Des-asignar** (jefe NULL → el fallback de
  "solo sus propios reportes" ya implementado en `/reportes` se activa
  solo). Confirmación con `FormModal` antes de cada cambio.
- **Regla de negocio**: un usuario tiene UN jefe (columna única); sin
  ciclos — el service rechaza `jefeUserId = id` propio (`JEFE_INVALIDO`)
  y una asignación que haría al residente subordinado de su propio
  subordinado (la jerarquía de este ERP es de 1 nivel: residente → equipo).

### 4.2 Endpoints

| Endpoint | Permiso | Auditoría |
|---|---|---|
| `GET /equipos` (residentes con su equipo + candidatos sin jefe) | `sistema.usuarios.ver` | — |
| `PATCH /usuarios/:id/jefe` (`jefeUserId: string \| null`) | `sistema.usuarios.editar` | `USUARIO_ACTUALIZADO` + `metadata {campo:'jefe_user_id'}` (D5) / `JEFE_INVALIDO`, `USUARIO_NO_ENCONTRADO` |

El efecto es inmediato en la PWA y `/reportes`: el scope se recalcula solo
(no hay que "publicar" nada).

### 4.3 Pruebas

Igual que V1 + los 3 casos de carrera/regla: jefe propio rechazado,
ciclo rechazado, re-asignación atómica (update condicional, nunca
patch-then-check), y el test de integración que verifica que el fallback
de reportes ve el nuevo equipo.

---

## 5. VISTA V3 — `/roles` (Gestión de Identidad, P12)

### 5.1 UI

- **PageHeader** "Gestión de Identidad". **Layout de dos paneles** (tabs o
  split): **"Usuarios"** (la fila 360) y **"Roles"** (catálogo editable).
- **Panel Usuarios** — al seleccionar un usuario se muestra su ficha 360:
  - **Roles** actuales (con `es_principal` marcado) y acciones
    asignar/revocar (RBAC `sistema.usuarios.asignar_rol`).
  - **Vistas** con flags (`role_vistas`: ver/crear/editar/eliminar/exportar).
  - **Permisos por módulo** (matriz `(modulo, recurso, acción)` heredada de
    sus roles, leída de `role_permissions`).
  - **Preview de herencia**: al marcar un rol distinto en el editor, la
    matriz de vistas/permisos se recalcula al instante **antes de guardar**
    (solo lectura, client-side con los datos ya cargados).
  - **Área (torre)** editable (`users.torre` — tiene precedencia sobre
    `roles.torre` en `/reportes`).
  - **Estado de PIN** (fuente: `GET /auth/pin/estado`): Normal / temporal
    vigente hasta X / bloqueado por intentos / hace N días que no cambia.
  - **Sesiones activas**: dispositivo, ubicación, IP, última actividad.
- **Acciones de mesa de ayuda** (RBAC `puedeEditar`):
  - **Desbloquear cuenta** → REUSA `POST /auth/pin/desbloqueo`.
  - **Reiniciar PIN** (temporal 24 h; el PIN nuevo se muestra UNA VEZ en el
    modal, nunca vuelve a verse — regla del spec) → REUSA `POST /auth/pin/reinicio`.
  - **Cerrar todas las sesiones** → NUEVO `POST /usuarios/:id/sesiones/cierre`
    (marca `sessions.activa=false` + revoca `refresh_tokens`; auditoría
    `SESION_CERRADA` con `metadata {modo:'masivo', sesiones:N}`).
- **Panel Roles** (sub-fase V3b): tabla de roles con nivel, área base
  (`roles.torre`), `es_sistema` (protegido: sin editar/eliminar — el service
  lo rechaza), y sus vistas/permisos asignados. Crear/editar con
  `sistema.roles.crear/editar`; eliminar con guard "rol sin usuarios
  asignados" (`ROL_EN_USO`).

### 5.2 Endpoints

| Endpoint | Permiso | Nota |
|---|---|---|
| `GET /usuarios/:id/identidad` (ficha 360: roles, vistas, permisos, torre, jefe, estado PIN, sesiones) | `sistema.usuarios.ver` | agrega `sessions` activas |
| `POST /usuarios/:id/sesiones/cierre` | `sistema.usuarios.editar` | nuevo |
| `GET /roles` + `POST/PATCH/DELETE /roles/:id` | `sistema.roles.{ver,crear,editar,eliminar}` | CRUD de roles (V3b); `es_sistema` protegido |
| `GET /roles/:id/vistas` + `PATCH` (flags `role_vistas`) | `sistema.permisos.{ver,editar}` | quién ve qué y con qué granularidad |
| `GET /roles/:id/permisos` + `PATCH` | `sistema.permisos.{ver,editar}` | matriz `(modulo,recurso,acción)` |

Los endpoints de PIN NO se duplican: la vista consume los de `auth/pin`
que ya existen y ya auditan.

### 5.3 Pruebas

Igual que V1/V2 + casos específicos: cierre masivo de sesiones realmente
inactiva las sesiones y revoca los refresh tokens; reinicio de PIN genera
temporal de 24 h auditable; `es_sistema` no editable ni eliminable; rol en
uso no eliminable (carrera con `users_roles` en transacción).

---

## 6. Orden de construcción y entregas (UNA A LA VEZ)

| Fase | Entrega | Por qué este orden |
|---|---|---|
| **Fase 1** | Migración seed (3 vistas + role_vistas admin) + **módulo `usuarios` en API + VISTA `/usuarios`** | Es la base: V2 y V3 leen de este módulo; los permisos ya existen |
| **Fase 2** | **VISTA `/equipos`** + endpoint `PATCH /usuarios/:id/jefe` | Necesita el listado de usuarios de Fase 1; es la más pequeña (BD 100% lista) |
| **Fase 3** | **VISTA `/roles`** (ficha 360 + acciones de mesa de ayuda reusando `auth/pin`) + cierre de sesiones | La más completa; necesita usuarios (F1) y jefe (F2) |
| **Fase 3b** | CRUD de roles / vistas / permisos (panel Roles) | Puede quedarse para después de validar V3 con el cliente |

Cada fase: commits atómicos en español con registro en `historial-cambios/`,
gates (`tsc` web + api, `eslint`, `npm run test` en api) y smoke manual
documentado. **No se pushea ni se abre PR sin orden explícita.**

---

## 7. Preguntas abiertas para el cliente (NO bloquean Fase 1)

1. **¿Dónde nace la identidad de trabajador?** Hoy el alta de Trabajadores
   ya genera número + PIN (§1.1). Recomendación: se queda ahí y `/usuarios`
   solo la muestra/reinicia. Si el cliente quiere crear trabajadores desde
   `/usuarios`, se conecta a la MISMA lógica del service (sin duplicar).
2. **Auditoría del jefe**: ~~¿dejar `USUARIO_ACTUALIZADO` con metadata o
   agregar literal `JEFE_ASIGNADO`?~~ ✅ **RESPUESTA DEL CLIENTE
   (2026-11-14): acción literal `JEFE_ASIGNADO` con migración de enum** —
   aplicada en la Fase 2 (`20261114020000_equipos_enum_jefe`).
3. **¿La vista `/roles` edita los roles** (nombre/nivel/área) o solo los
   asigna? Los permisos `sistema.roles.*` existen; recomendación: incluir
   el CRUD como sub-fase 3b.
4. **Nombres de rutas**: `/usuarios`, `/equipos`, `/roles` — cambiables
   antes de la migración de seed (la ruta del sidebar es definitiva después).

---

## 8. Riesgos conocidos

- El **listado global de usuarios** es sensible: paginado obligatorio
  (techo 100) y nunca exponer `password_hash` ni `pin_hash` — solo hashes
  de presencia (estado derivado).
- `POST /usuarios` con contraseña: la contraseña va en el body (HTTPS en
  producción); nunca loguearla ni auditarla.
- El cierre masivo de sesiones de un usuario **con sesión propia activa**
  (admin cerrando sus propias sesiones) debe excluir la sesión actual del
  actor o avisar (de lo contrario se desconecta a sí mismo).
- Turbopack/monolito: las 3 vistas siguen el patrón de página client-side
  existente; sin `next/dynamic` (no hay code splitting en el repo).
- Deuda de permisos: si mañana se quiere que Administrativo gestione
  usuarios, basta asignar los permisos ya existentes — el diseño no cambia.
