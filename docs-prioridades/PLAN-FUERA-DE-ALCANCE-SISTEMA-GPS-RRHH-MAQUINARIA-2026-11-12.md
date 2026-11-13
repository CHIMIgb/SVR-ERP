# PLAN FUERA DE ALCANCE — Sistema, GPS, RRHH y Maquinaria (fuente: plan del 11-11-2026)

> **🎯 ALCANCE DEL DUEÑO DE COMERCIAL/OPERACIONES (2026-11-12):** este
> documento NO contiene trabajo de las 15 vistas en alcance
> (Operaciones: `/reportes`, `/operaciones`, `/criba`, `/inventario`,
> `/proyectos` — Comercial: `/clientes`, `/cotizaciones`, `/finanzas`,
> `/proveedores`, `/ventas`, `/cobranza`, `/ventas/corte`, `/facturas`).
> Todo lo que hay aquí es de módulos de otro dueño: Sistema (Vista A/B),
> GPS, RRHH/nómina/finiquitos y Maquinaria (fichas de máquina, checklist,
> despachos, patio, operador, foto, horómetro, llantas, diésel).

> **Qué es este documento:** el contenido que vivía en
> `PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md` y quedó fuera del alcance de
> Comercial y Operaciones al recortarlo (2026-11-12). **Se conserva íntegro y
> con la misma numeración original** para no perder decisiones ni preguntas
> pendientes. Aquí está la Fase 0 (vistas admin de Sistema), la ficha completa
> del proveedor de GPS, las fases F3–F5 (GPS real), F6–F8 (RRHH/Maquinaria) y
> las decisiones que el plan original listaba como "fuera de las 15 vistas".

---

## 0. NUEVO — Vistas admin de Sistema (exclusivas de admin, solo escritorio)

> Agregado 2026-11-11: dos vistas nuevas del **módulo Sistema**, construidas en la
> **aplicación de escritorio** — **la PWA queda en pausa** (nada nuevo en `/m/*`).
> Son solo visibles para admin (módulo `sistema`). Corresponden a lo ya planeado
> como **P11 y P12** en `IMPLEMENTACIONES-A-FUTURO.md` (§P11/§P12), que se concretan
> aquí con alcance definido. **Nota 2026-11-12: esta fase arrancaba PRIMERO**
> (antes de las 15 vistas de Comercial/Operaciones).

### 0.1 Vista A — "Equipo del residente" (asignar / cambiar / quitar trabajadores)

Corresponde a **P11** (asignación trabajadores ↔ residentes, que hoy solo es SQL).

- **Qué muestra:** lista de usuarios con rol **Residente** y, por cada uno, su
  equipo (trabajadores con `jefe_user_id` = ese residente).
- **Acciones:** **asignar** un trabajador a un residente, **cambiar** de residente
  (re-asignar) y **quitar** (jefe NULL → fallback de solo-sus-propios-reportes).
- **Endpoint:** `POST/PATCH /usuarios/:id/jefe` con auditoría
  `SUCCESS/FAIL` (`JEFE_ASIGNADO` / `SIN_PERMISO`) — patron `fallir()`.
- **Efecto:** el scope de `/reportes` y la asistencia de equipo del Residente en la
  PWA se recalculan solos (leen `jefe_user_id` — nada por recodificar).
- **RBAC:** permisos existentes del módulo sistema (o un par nuevo
  `sistema.usuarios.asignar` — se define al construir).
- **Relación con el alta P14:** el alta en `/trabajadores` ya liga encargado
  opcional; esta vista es donde se **gestiona después**.

### 0.2 Vista B — "Usuarios y roles" (roles + áreas + identidad de acceso)

Corresponde a **P12** (panel "Gestión de identidad" 360).

- **Qué muestra por usuario (fila/detalle):** su **rol(es)**, su **área (torre —
  viene del rol, `roles.torre`)**, su **número de empleado**, su **estado de PIN**
  (cambiado hace N días / temporal vigente / cuenta bloqueada) y sus **sesiones
  activas** (dispositivo, IP, última actividad).
- **Acciones:** **asignar/cambiar/quitar roles** (con preview de vistas y permisos
  que hereda antes de guardar), **desbloquear cuenta**, **reiniciar PIN** (temporal
  24 h, entrega una vez), **cerrar todas sus sesiones**. Los endpoints de mesa de
  ayuda **ya existen (P12)**: `POST /auth/pin/reinicio`, `/auth/pin/desbloqueo`,
  `GET /auth/pin/estado` — la vista los consume; falta exponer `pinReinicio`/
  `pinDesbloqueo` en `authApi` de `lib/api.ts`.
- **Escenario "se le venció el PIN" (decisión del SVR):** el PIN vence a los
  30 días y el server **bloquea todo** hasta el cambio (claim `rpc`, PR #18 #4) —
  el trabajador pierde el acceso a la app, contacta al **administrador**, y este
  desde esta vista le **genera un PIN temporal de 24 h** y se lo entrega por
  WhatsApp; al entrar, la app lo obliga a crear su PIN propio. El reinicio
  también cubre el temporal perdido (quien cerró el modal sin enviarlo). El
  temporal se muestra **una sola vez** — si se pierde, el admin genera otro.
  **Jerarquía (PR #18 #5):** la cuenta de un Administrador solo la puede
  reiniciar o desbloquear otro Administrador (403 `JERARQUIA_INSUFICIENTE`
  auditado) — nadie con solo `sistema.usuarios.editar` se fabrica acceso total.
- **BD:** no pide columnas nuevas — todo ya existe (users, users_roles,
  role_vistas, sessions, campos de PIN). Es una vista de lectura + acciones con
  auditoría en cada mutación.
- **RBAC:** los permisos ya existen en el seed — `sistema.usuarios.*` (ver, editar,
  asignar_rol, eliminar).

### 0.3 Análisis: ¿tercera vista de "gestión de usuarios"?

**Recomendación: NO crearla aparte — se absorbe en la Vista B.** Razones:

1. La gestión de usuarios (crear/desactivar cuentas, ver quién es quién) usa
   **exactamente la misma lista y la misma fila** que la Vista B: es un solo dominio
   (identidad/acceso). Partirlo en dos pantallas duplica y obliga a navegar entre
   ellas para la misma persona.
2. El doc ya la diseñó así: P12 es el panel "identidad 360" (usuarios + roles +
   permisos + áreas + PIN + sesiones **todo junto**) — el cliente lo pidió como un
   panel que "ve la relación de unos con otros".
3. La vista `/trabajadores` (RRHH) se queda como está: gestiona el perfil
   **laboral** (sueldos, liquidación, proyectos, máquina). La Vista B gestiona el
   perfil de **acceso** (roles, áreas, PIN, sesiones). El `numero_empleado` conecta
   ambas mitades de la misma persona.

Único caso que justificaría algo extra (y cabe **dentro** de la Vista B, no como
vista nueva): crear un usuario **sin trabajador** (cuentas administrativas/office
con email+password, como `admin@svr...` hoy). El alta de `/trabajadores` siempre
crea identidad; los usuarios de oficina sin expediente laboral se darían de alta
desde la Vista B con un modal (email + rol). Decisión de alcance: se agrega si el
cliente lo confirma.

---

## 4. Correcciones confirmadas (§10 del doc) — las que viven FUERA de las 15 vistas

| # | Error detectado | Respuesta del cliente | Módulo/vista |
|---|---|---|---|
| 1 | **Horas extra rechazadas se pagan** | Solo se pagan las APROBADAS | RRHH — nómina/asistencia |
| 2 | **Turnos que cruzan medianoche = 0 horas** | "SI HAY TURNOS NOCTURNOS" | RRHH — asistencia |
| 4 | Alerta "posible ordeña +96%" es texto fijo | Debe calcularse con datos reales (y de la **varilla/GPS**) | Maquinaria — combustible |
| 5 | Archivo bancario con misma cuenta/CLABE inventada para todos | Dispersiones reales; hay **DOS bancos: BBVA y Banorte** (documento aparte con cuentas) | RRHH — nómina |

*(el error 3 — checklist "luces y alarmas" — y la regla global del error 6
responsive quedaron en el plan de Comercial/Operaciones)*

---

## 5. Ficha del proveedor de GPS (GPS Solutions — Meitrack T399L)

| Respuesta del proveedor | Implicación técnica |
|---|---|
| Meitrack T399L, identificado por **IMEI** | Vinculación dispositivo↔máquina por IMEI; alta/baja = reasignar IMEI |
| **API disponible** + comparten usuario | ✅ Integración propia posible. **BLOQUEANTE: pedir documentación de la API** (auth, push vs pull, webhooks, límites) + usuario de prueba |
| **Encendido cada 30 s / Apagado cada 50 min** | ~2,880 posiciones/día/máquina encendida → ingesta con dedupe + decidir muestreo |
| **Todo menos temperatura de motor** | La "temperatura" demo del módulo GPS NO tiene fuente real → quitar o redefinir; encendido, horómetro, odómetro, velocidad y combustible sí llegan |
| **Historial 3 meses, Excel/PDF del portal** | Guardar desde el día 1 lo que llega en vivo; NO contar con la API para histórico viejo (confirmar en la doc) |
| **$350/mes por equipo, sin contrato** | Solo **camiones** con GPS hoy; maquinaria con horómetro manual; planean comprar más equipos |
| Alertas "si lo requiere el cliente" | Las alertas (velocidad/geocercas) las construimos NOSOTROS sobre la API |
| **Memoria interna + reenvío al recuperar señal** | El sistema debe aceptar posiciones atrasadas y fuera de orden (idempotencia por timestamp del dispositivo) |

**Del documento (§4) que complementa al proveedor:**
- Geocercas: **SOLO CON CÍRCULOS** → no se necesitan polígonos ni PostGIS (centro + radio + Haversine, el diseño actual es correcto).
- "Si una zona es pequeña y se cruza entre dos reportes, no pasa nada" → tolera el muestreo.
- El cliente **NO** ve la ubicación de su máquina rentada (Cl1 — decisión que sí vive en el plan Comercial/Operaciones).
- **Mapa real: el cliente pide PROPUESTAS con costo antes de decidir** (Google Maps vs alternativas con tiles, ej. MapLibre + MapTiler/OSM) — bloqueante del visual.
- Alertas de geocerca: aviso por **WhatsApp**; salida de obra fuera de horario: SI; gerencia crea/borra geocercas; zona pequeña entre reportes: no importa.

### Q&A cruda del proveedor (transcripción literal, 2026-11-11)

- ¿Qué marca y modelo tienen los dispositivos instalados? → **Meitrack T399L**
- ¿El proveedor ofrece una API? → **Sí, pueden compartir el usuario** (falta documentación)
- ¿Cada cuánto envía la ubicación? ¿cambia apagado? → **Encendido cada 30 segundos / apagado cada 50 minutos**
- ¿Reporta encendido, horómetro, odómetro, velocidad, combustible y temperatura? → **Todo excepto temperatura del motor**
- ¿Cuánto conserva el historial y se descarga en bloque? → **Hasta 3 meses, reporte en Excel o PDF**
- ¿Número de serie por dispositivo? → **Sí, cada uno tiene su IMEI**
- ¿Costos por equipo, instalación, mensualidad y datos? ¿contrato? → **Renta mensual $350 sin contrato forzoso**
- ¿Envía alertas por velocidad o salida de zona? → **Sí, si lo requiere el cliente**
- ¿Qué pasa si pierde señal o lo desconectan? → **Memoria interna: guarda el recorrido y lo manda al recuperar señal**

---

## 6. Decisiones del doc que viven FUERA de las 15 vistas

- **RRHH** (`/trabajadores`, nómina, asistencia): sueldo diario = semanal/**7**; horario oficial **8:00–6 PM**; tolerancia 15 min; **3 retardos = falta**; retardo >15 min descuenta la hora; **horas extra por tabulador del trabajador ($100/$150) que viene en la nómina** (no la tarifa fija $80) y sin límite semanal; prorrateo a media semana; préstamos por abonos semanales; **dispersión en BBVA y Banorte**; **cierre de nómina obligatorio (bloquear re-sync/edición tras pagos)**; sin CFDI de nómina; finiquitos: formatos tipo Ley con cálculo automático + **3 escenarios de liquidación** para negociación; renuncia = solo proporcional; aguinaldo 15 días; fecha de ingreso obligatoria; sueldos precargados $2,500/$3,500 NO son reales (quitar precarga); RFC + CURP + NSS si tiene seguro; vacaciones con formato de firma de días tomados + recordatorio de renovación DC3; incapacidades según seguro; multi-obra permitida (rara); sueldo fiscal solo por transferencia; **HHE autoriza solo GERENCIA**; fuera de radio se rechaza en el momento y justifica RH+Dirección; salida no necesariamente en el mismo sitio; coordenadas manuales solo Dirección; festivo trabajado se paga por Ley, manual; sin señal → residente registra; cuadrilla del cabo vale para nómina; una asistencia por día.
- **Maquinaria**: apartado exclusivo de **LLANTAS** (vida útil, anti-robo) y **apartado por mecánico**; mantenimiento separado en refacciones/mano de obra/taller + interno/externo + garantía + días fuera de servicio; alerta a **50 h** y también programado por **calendario (meses)**; intervalos por marca/modelo (Hilda + mecánicos); diésel: % de alerta desde la **varilla/GPS** (no 35% fijo), **horas desde el GPS** para que nadie se auto-valide, alerta a gerencia como **notificación in-app**, consumo esperado = **historial** editable por gerencia+administración; si GPS vs manual, **prevalece el manual**.
- **Diseño**: azul y naranja + logo; gerencia aprueba pantallas.

---

## 7. Orden de trabajo de estas fases (originales del plan 11-11)

| Fase | Qué | Dependencia |
|---|---|---|
| **Fase 0 — Vistas admin de Sistema** | Vista A (equipo del residente) + Vista B (usuarios y roles) — **arrancaba primero** | Ninguna |
| **F3 — Ingesta GPS real** | Posiciones por IMEI, dedupe, tolerancia a atrasados, kill del modo demo | Respuestas del proveedor (doc de API) |
| **F4 — Mapa real** | Presentar 2-3 propuestas de costo y elegir | Decisión del cliente |
| **F5 — Geocercas y alertas** | Círculos, gerencia CRUD, alertas in-app + WhatsApp, fuera de horario | F3 + F4 |
| **F6 — Nómina/asistencia según respuestas** | Tabulador HHE, turnos nocturnos, festivo, cierre de nómina, doble banco | Tabulador + formato de dispersión del cliente |
| **F7 — Finiquitos** | Formatos Ley con cálculo automático + 3 escenarios + carta | Ejemplo de carta + datos fiscales |
| **F8 — Mantenimiento/llantas/diésel** | Apartado llantas, por mecánico, calendario, varilla/GPS | Respuestas pendientes parciales |

*(las fases F1 y F2 — fixes y preguntas de las 15 vistas — quedaron en
`PLAN-COMERCIAL-OPERACIONES-SVR-2026-11-11.md`)*

## 8. Entregables del cliente de estas fases (§11 filtrado)

**Del cliente (fuera de las 15 vistas):** tabulador de horas extra por trabajador ·
formato exacto de dispersión BBVA **y Banorte** + cuenta de la empresa ·
cuentas/CLABE de trabajadores · RFC/razón social/domicilio y firmante de la carta
de finiquito (+ ejemplo de carta) · horarios oficiales por puesto · consumo
esperado de diésel por máquina · intervalos de mantenimiento por marca/modelo.

**Nuestros al proveedor (bloqueantes):**
1. Documentación de la **API** + usuario de prueba (mecanismo: push/polling/webhooks; límites).
2. ¿La API entrega **nivel de combustible** (la varilla) en %/litros y **horómetro** en cada reporte?
3. ¿Expone **histórico** o solo lo que llega en vivo?
4. ¿Cuántos **camiones** tienen GPS hoy (dimensionar ingesta)?
