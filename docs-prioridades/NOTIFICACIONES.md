# Notificaciones del ERP — quién las genera y quién las recibe

> **Cómo funciona (una frase):** cada evento del ERP deja **una fila** en la
> tabla `notificaciones` dirigida a un **rol**; el centro del Topbar (campana)
> le muestra a cada usuario solo lo que puede ver según **SU ACCESO A VISTAS**,
> con polling cada 60 segundos. La lectura y el descarte son **por persona**.

**Campos clave:**
- `notificaciones` (contenido del evento, compartido): `tipo` (ALERTA/INFO),
  `audiencia_rol_id` (null = todos los roles), `referencia_tipo`/`referencia_id`
  (el objeto del evento), `creado_por` (quién lo disparó).
- `notificaciones_lecturas` (estado **por usuario**, PK compuesta):
  `leido_en` (cuándo lo leyó — el booleano `leida` es derivado) y
  `descartada` (ocultar solo para mí).

**Filtro de visibilidad del buzón (todo en el backend):**
1. No descartada por el usuario.
2. No disparada por el usuario (el actor no recibe su propio aviso).
3. Audiencia: eventos "para todos" o para alguno de sus roles **activos**.
4. **Acceso a vista:** el tipo de referencia es de una vista que el usuario
   puede ver (`role_vistas.puede_ver`). Si un rol pierde el acceso a la vista,
   esas notificaciones dejan de aparecerle sin tocar código.

---

## 1. Eventos que generan notificaciones HOY

| # | Evento | Vista que lo dispara | Flujo exacto (clics) | Endpoint | Audiencia (rol) | Vista que debe tener el receptor | Tipo |
|---|--------|----------------------|----------------------|----------|------------------|---|---|
| 1 | **Orden de compra aprobada** | `/proveedores` → tab **Órdenes de Compra** | Botón **"Aprobar"** (Pendiente) | `POST /ordenes-compra/:id/cambiar-estado` | **Administrativo** | `/proveedores` | ALERTA |
| 2 | **Abono registrado** | `/proveedores` → botón **"Abonar"** → "Registrar Pago" | `POST /proveedores/:id/abonos` | **Administrativo** | `/proveedores` | INFO |
| 3 | **Cierre de caja registrado** | `/ventas` → "Corte de Caja" → registrar | `POST /ventas/cierres` | **Administrador** | `/ventas` | ALERTA |
| 4 | **Nómina pagada** | `/nomina` → "Pagar todos" | `POST /nomina/:periodoId/pagar-todos` | **Administrativo** | `/nomina` | INFO |

## 2. Quién ve qué HOY (según `role_vistas` real de la BD)

| Rol | Vistas visibles (relevantes) | Notificaciones que le aparecen |
|---|---|---|
| **Administrador** | `/proveedores`, `/ventas`, `/nomina` (y todo) | Cierres de caja (si no los registró él) |
| **Administrativo** | `/dashboard`, `/trabajadores`, `/asistencia`, `/nomina`, `/reportes`, **`/proveedores`** (desde B5.7) | Órdenes aprobadas, abonos a proveedores, nómina pagada |
| Residente / Técnico / Cobrador / Trabajador | ninguna de las 3 | Nada aún |

> ✅ **B5.7 (2026-11-13):** el rol **Administrativo** recibió acceso a
> `/proveedores` (migración `20261113041000_administrativo_proveedores_vista`,
> decisión RBAC del cliente) — sus notificaciones de órdenes y abonos ya
> tienen receptor (verificado: el buzón de `rrhh@` muestra las 5 de
> proveedores y no el cierre de caja, que es del Administrador). |

> ⚠️ **Decisión pendiente del cliente (B5.7):** el rol **Administrativo NO
> tiene acceso a `/proveedores`** en `role_vistas`, así que las notificaciones
> de órdenes aprobadas y abonos hoy no tienen receptor visible (quien las
> dispara es el actor excluido). Opciones: **(a)** dar acceso a
> `/proveedores` a Administrativo, **(b)** dirigir esos eventos también a
> Administrador, o **(c)** dejarlo así. Es una decisión de RBAC/negocio.
## 3. Cómo probarlo paso a paso (5 min)

1. **Genera un evento que el receptor pueda ver.** Ejemplo garantizado:
   - Entra como **otro usuario con rol Administrador distinto** (o haz que un
     cajero registre un cierre) — un usuario que NO dispare el evento.
   - Cierre de caja: `/ventas` → Corte de Caja → registrar → va a
     **Administrador**.
   - Nómina pagada: `/nomina` → "Pagar todos" → va a **Administrativo**.
2. **Abre la campana** con el usuario receptor: la notificación con badge de
   no leídas.
3. **Marca leída**: es estado TUYO — otro usuario del mismo rol sigue
   viéndola sin leer (verifica en BD: `notificaciones_lecturas` una fila por
   usuario con `leido_en`).
4. **Basura**: descarta para TI y no vuelven; en BD queda
   `descartada = true` en TU fila de lectura.
5. Verificación en BD:
   ```sql
   SELECT n.titulo, r.nombre AS audiencia, l.user_id, l.leido_en, l.descartada
   FROM notificaciones n
   LEFT JOIN roles r ON r.id = n.audiencia_rol_id
   LEFT JOIN notificaciones_lecturas l ON l.notificacion_id = n.id
   ORDER BY n.creado_en DESC LIMIT 15;
   ```

## 4. Lo que NO genera notificaciones todavía

- **CxP/CxC por vencer o vencidas** — espera respuestas del SVR
  (`DUDAS-VISTAS-SVR.txt` #34, #7, #5). La tubería está lista: es un
  `emitirARol` + cron diario.
- Correos / tipo "correo" del mock (congelado: nada lo genera).
- Los avisos locales de las vistas aún mock (asistencia, combustible,
  horómetro) — solo viven en la sesión y no se guardan.

## 5. Dónde está el código

| Pieza | Archivo |
|---|---|
| Emisión (best-effort) + visibilidad + lecturas | `apps/api/src/notificaciones/notificaciones.service.ts` (`emitir`, `emitirARol`, `filtroDeBuzon`) |
| Eventos conectados | `proveedores.service.ts` (cambiarEstadoOrden, registrarAbono) · `ventas.service.ts` (createCierre) · `nomina.service.ts` (pagarTodos) |
| Endpoints | `notificaciones.controller.ts` (GET, `:id/leer`, `leer-todas`, `descartar-todas`) |
| Centro del Topbar (polling 60s) | `apps/web/src/components/layout/NotificationContext.tsx` |
| Cliente HTTP | `apps/web/src/lib/api.ts` → `notificacionesApi` |
| Permiso | `sistema.notificaciones.ver` (los 6 roles) |
