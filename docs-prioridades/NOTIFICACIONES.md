# Notificaciones del ERP — quién las genera y quién las recibe

> **Cómo funciona (una frase):** cada evento del ERP deja **una fila** en la
> tabla `notificaciones` dirigida a un **rol** (ej. Administrativo); el centro
> del Topbar (campana) consulta solo lo dirigido a los roles del usuario que
> inició sesión, con polling cada 60 segundos.
>
> Campos clave en la BD (`notificaciones`): `tipo` (ALERTA/INFO),
> `audiencia_rol_id` (null = todos los roles), `leido_en` (cuándo se leyó —
> el booleano `leida` es derivado), `descartada` (true = descartada con el
> ícono de basura; la fila permanece en BD), `creado_por` (quién disparó el
> evento).

---

## 1. Eventos que generan notificaciones HOY

| # | Evento | Vista que lo dispara | Flujo exacto (clics) | Endpoint que lo procesa | Quién la recibe (rol) | Tipo |
|---|--------|----------------------|----------------------|--------------------------|------------------------|------|
| 1 | **Orden de compra aprobada** | `/proveedores` → tab **Órdenes de Compra** | Botón **"Aprobar"** en la fila de la orden (estado Pendiente) → confirmar | `POST /ordenes-compra/:id/cambiar-estado` (estado APROBADA) | **Administrativo** | ALERTA |
| 2 | **Abono registrado** (pago a proveedor) | `/proveedores` → tab **Órdenes de Compra** | Botón **"Abonar"** en la fila (ordenes con saldo) → capturar monto → **"Registrar Pago"** | `POST /proveedores/:proveedorId/abonos` | **Administrativo** | INFO |
| 3 | **Cierre de caja registrado** (pendiente de aprobación) | `/ventas` → botón **"Corte de Caja"** (caja abierta del día) → capturar conteo → registrar cierre | `POST /ventas/cierres` | **Administrador** | ALERTA |
| 4 | **Nómina pagada** | `/nomina` | Botón **"Pagar todos"** del periodo (semana actual) | `POST /nomina/:periodoId/pagar-todos` | **Administrativo** | INFO |

**Texto que llega:** título + cuerpo con folio/monto/fecha según el evento
(ej. *"Orden OC-2026-051 aprobada — CAT México — $1,000.00 comprometidos…"*).

## 2. Quién ve qué (matriz por rol)

El buzón muestra: notificaciones sin rol destinatario (**todas**) + las de los
roles que el usuario tenga en `users_roles`. Hoy **todas van dirigidas a un
rol**, así que:

| Rol | Ve las notificaciones de |
|---|---|
| **Administrativo** (ej. `rrhh@svr-constructora.com`) | OC aprobadas, abonos a proveedores, nómina pagada |
| **Administrador** (ej. `admin@svr-constructora.com`) | Cierres de caja pendientes de aprobación |
| Residente / Técnico / Cobrador / Trabajador | Nada aún (no hay eventos dirigidos a ellos) |

> Importante: la campana la pueden abrir todos (el permiso
> `sistema.notificaciones.ver` está en los 6 roles), pero cada rol solo ve
> **sus** notificaciones. `admin@` con el rol Administrador NO ve las de
> Administrativo — para probar el evento #1 entra como `rrhh@svr-constructora.com`.

## 3. Cómo probarlo paso a paso (5 min)

1. **Genera el evento** (con cualquier usuario autorizado, ej.
   `admin@svr-constructora.com`):
   - En `/proveedores`, aprueba una orden pendiente (o registra un abono).
2. **Cambia al usuario receptor**: cierra sesión y entra como
   `rrhh@svr-constructora.com` / `rrhh123` (rol Administrativo).
3. **Abre la campana** del Topbar: la notificación debe estar ahí con el
   badge de no leídas. El título dice la orden/abono con folio y monto.
4. **Marca leída**: clic en la notificación (o "marcar todas") → el badge
   baja. En BD, `leido_en` queda con la fecha/hora exacta.
5. **Basura** (ícono de basura del centro): descarta TODAS las de tu rol —
   desaparecen y no vuelven; en BD quedan con `descartada = true`.
6. Verificación directa en BD:
   ```sql
   SELECT tipo, titulo, audiencia_rol_id, leido_en, descartada, creado_en
   FROM notificaciones ORDER BY creado_en DESC LIMIT 10;
   ```

## 4. Lo que NO genera notificaciones todavía

- **CxP/CxC por vencer o vencidas** — espera las respuestas del SVR
  (`DUDAS-VISTAS-SVR.txt` #34 "¿Se necesita alerta de pagos por vencer a
  proveedores?", #7 "centro de avisos automáticos", #5 estado "VENCIDA").
  La tubería ya está lista: es un `emitirARol` + un cron diario.
- Correos / tipo "correo" del mock (congelado: nada lo genera).
- Los avisos locales de las vistas aún mock (asistencia, combustible,
  horómetro) — esos se muestran solo en la sesión y no se guardan.

## 5. Dónde está el código

| Pieza | Archivo |
|---|---|
| Emisión (best-effort, no revierte el negocio) | `apps/api/src/notificaciones/notificaciones.service.ts` → `emitir()` / `emitirARol(nombreRol, …)` |
| Eventos conectados | `proveedores.service.ts` (cambiarEstadoOrden, registrarAbono) · `ventas.service.ts` (createCierre) · `nomina.service.ts` (pagarTodos) |
| Buzón / marcar leída / descartar | `notificaciones.service.ts` + `notificaciones.controller.ts` |
| Centro del Topbar (polling 60s) | `apps/web/src/components/layout/NotificationContext.tsx` |
| Cliente HTTP | `apps/web/src/lib/api.ts` → `notificacionesApi` |
| Permiso | `sistema.notificaciones.ver` (los 6 roles) |
