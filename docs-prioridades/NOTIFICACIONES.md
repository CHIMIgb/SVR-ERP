# Notificaciones del ERP — documentación completa del sistema

> **Cómo funciona en una frase:** cada evento del ERP deja **una fila** en la
> tabla `notificaciones` dirigida **explícitamente** a alguien (un usuario, un
> área/torre, un rol o todos); el centro del Topbar (campana) le muestra a
> cada usuario solo lo dirigido a él, con polling cada 60 segundos. La
> lectura y el descarte son **por persona**.

---

## 1. Arquitectura (cómo está implementado)

### 1.1 Las dos tablas

**`notificaciones`** — el CONTENIDO del evento (compartido, una fila por
evento, nunca se duplica por usuario):

| Campo | Qué es |
|---|---|
| `id`, `tipo` (ALERTA/INFO), `titulo`, `cuerpo` | El mensaje |
| `referencia_tipo`, `referencia_id` | El objeto que lo originó (ej. `ordenes_compra` + su id) |
| `audiencia_rol_id` | Destinatario POR ROL (null = todos) |
| `audiencia_torre` | Destinatario POR ÁREA (enum `CategoriaReporte` — los usuarios tienen `torre`) |
| `destinatario_user_id` | Destinatario PERSONAL (ej. "te asignaron el reporte") |
| `creado_por` | Quién disparó el evento (NO recibe su propio aviso) |

**`notificaciones_lecturas`** — el ESTADO por persona (PK compuesta
`notificacion_id + user_id`):

| Campo | Qué es |
|---|---|
| `leido_en` | Cuándo lo leyó ESA persona (null = sin leer; el booleano `leida` es derivado) |
| `descartada` | La ocultó con la basura (solo desaparece para ella) |

### 1.2 El filtro del buzón (lo que ve cada usuario)

Cada consulta del buzón aplica, en este orden:

1. **No descartada por mí** (no existe mi fila de lectura con `descartada`).
2. **No la disparé yo** (`creado_por ≠ yo`; el sistema no se avisa a sí mismo).
3. **Dirigida a mí**: `destinatario_user_id = yo` **O** `audiencia_torre = mi torre`
   **O** `audiencia_rol_id ∈ mis roles activos` **O** audiencia vacía (todos).

> No depende de menús ni de vistas: el destinatario se elige **al emitir**. Si
> mañana se cambia el RBAC de una vista, las notificaciones no se afectan.

### 1.3 Los 4 checkpoints de los endpoints

Módulo `apps/api/src/notificaciones/` (service exportado para que cualquier
módulo emita):

- **`GET /notificaciones`** — buzón paginado (default 10, techo 100), incluye
  `noLeidas` (badge). JWT + blacklist + permiso.
- **`PATCH /notificaciones/:id/leer`** — upsert de la lectura DEL usuario.
- **`PATCH /notificaciones/leer-todas`** — crea lecturas solo de las visibles
  que faltan (audita con el conteo).
- **`PATCH /notificaciones/descartar-todas`** — la basura: descarta para el
  usuario (audita con el conteo; las filas permanecen en BD).
- **`emitir()` / `emitirARol()` / `emitirAUsuario()` / `emitirATorre()` /
  `emitirATrabajador()`** — helpers de emisión, **best-effort**: si fallan,
  solo loggean y NUNCA revierten el evento de negocio que los originó.
- Mutaciones auditan SUCCESS (`NOTIFICACION_LEIDA`, `NOTIFICACION_DESCARTADA`)
  y los fallos auditan FAIL antes de lanzar.

### 1.4 Cómo se agrega un evento nuevo (receta)

En el service que ya maneja el evento, **después del `auditService.log`
SUCCESS** (best-effort, nunca dentro de la transacción de negocio):

```ts
// A un rol:      await this.notificacionesService.emitirARol('Administrativo', { tipo, titulo, cuerpo, referenciaTipo: '…', referenciaId: id, creadoPor: userId });
// A un usuario:  await this.notificacionesService.emitirAUsuario(usuarioId, { … });
// A un área:     await this.notificacionesService.emitirATorre(laTorre, { … });
// A un trabajador (cuenta resuelta por nombre): await this.notificacionesService.emitirATrabajador(trabajadorId, { … });
```

Módulo a importar: `NotificacionesModule` (ya importado en proveedores,
ventas, nómina y reportes-campo).

---

## 2. Eventos activos HOY (quién dispara y quién recibe)

### Comercial / compras

| Evento | Vista que lo dispara | Flujo (clics) | Audiencia |
|---|---|---|---|
| Orden de compra **aprobada** | `/proveedores` → tab Órdenes | "Aprobar" | Rol **Administrativo** |
| **Abono registrado** | `/proveedores` → "Abonar" → Registrar Pago | `POST /proveedores/:id/abonos` | Rol **Administrativo** |

### Caja

| Evento | Vista | Flujo | Audiencia |
|---|---|---|---|
| **Cierre de caja** registrado (pendiente de aprobar) | `/ventas` → "Corte de Caja" | Registrar cierre | Rol **Administrador** |

### Nómina

| Evento | Vista | Flujo | Audiencia |
|---|---|---|---|
| **Nómina pagada** | `/nomina` → "Pagar todos" | `POST /nomina/:periodoId/pagar-todos` | Rol **Administrativo** |

### Reportes de campo (los 5 flujos del SVR)

| Evento | Vista | Flujo | Audiencia | Tipo |
|---|---|---|---|---|
| **Se crea un reporte** | `/reportes` → "Nuevo reporte" | Al crear, la torre destino del reporte | **Toda el área** del reporte | ALERTA |
| **Alguien lo acepta** | `/reportes` → "Aceptar" | El aceptador queda como asignado | El **creador** — *"Fulano aceptó tu reporte"* | INFO |
| **Se reasigna** | `/reportes` → "Asignar" a un trabajador | `POST /reportes-campo/:id/asignar` | El **asignado** (su cuenta) — *"Te asignaron el reporte"* | ALERTA |
| **Se cierra** (estado **Cerrado**) | `/reportes` → cambiar estado a Cerrado | `PATCH /reportes-campo/:id` | El **asignado**, si tiene; si no, nada — *"Cerraron el reporte que tenías asignado"* | INFO |
| **Se publican actividades** | `/reportes` → campo "Actividades" → Publicar | Si publicó el **creador** → se avisa al **asignado**; si publicó el **asignado** (u otro) → se avisa al **creador** | **La otra parte** | INFO |

> Nota de negocio: el asignado de un reporte es un **TRABAJADOR** (no una
> cuenta de usuario). Si tiene cuenta, la recibe; si no (compañero de patio
> sin usuario), la emisión queda loggeada y no se entrega. Ver §5.

## 3. Matriz "quién ve qué" hoy

Con los roles reales de la BD (Administrativo ve dashboard, trabajadores,
asistencia, nómina, reportes):

| Usuario | Ve |
|---|---|
| **Administrador** (`admin@svr…`) | Cierres de caja + lo dirigido a él personalmente |
| **Administrativo** (`rrhh@svr…`) | OC aprobadas, abonos, nómina pagada + lo personal |
| Usuario con torre asignada (p. ej. MAQUINARIA) | Reportes nuevos **de su área** + lo personal |
| Cualquiera | Nada de lo disparado por él mismo |

## 4. Cómo probarlo (5 min)

1. **Reportes (área):** entra con un usuario con torre (ej. técnico) →
   `/reportes` → crea un reporte → otro usuario **de la misma torre** debe ver
   la ALERTA en su campana.
2. **Reportes (aceptación):** otro usuario del área **acepta** el reporte →
   el **creador** recibe *"Fulano aceptó tu reporte"*.
3. **Proveedores:** con `admin@` aprueba una OC pendiente → entra como
   `rrhh@` (Administrativo) → la ve en su campana.
4. **Caja:** con un cajero registra el cierre → `admin@` lo ve.
5. **Nómina:** `/nomina` → "Pagar todos" → `rrhh@` la ve.
6. Verificación en BD:
   ```sql
   SELECT n.titulo, n.audiencia_rol_id, n.audiencia_torre, n.destinatario_user_id,
          n.creado_por, l.user_id, l.leido_en, l.descartada
   FROM notificaciones n
   LEFT JOIN notificaciones_lecturas l ON l.notificacion_id = n.id
   ORDER BY n.creado_en DESC LIMIT 15;
   ```

## 5. Limitaciones conocidas (a futuro)

- **Match trabajador→cuenta por nombre**: los trabajadores no tienen FK a
  `users`; la cuenta del asignado se resuelve por nombre completo contra
  `personas`. Si hay dos personas con el mismo nombre, la notificación no se
  emite (queda loggeada). A futuro: FK `users.trabajador_id`.
- **CxP/CxC por vencer/vencidas**: esperan respuestas del SVR
  (`DUDAS-VISTAS-SVR.txt` #34, #7, #5) — la tubería ya está lista (es un
  `emitirARol` + cron diario).
- Correos reales / tipo "correo" del mock: congelado (nada lo genera).
- Los avisos locales de las vistas aún mock (asistencia, combustible,
  horómetro) solo viven en la sesión.
