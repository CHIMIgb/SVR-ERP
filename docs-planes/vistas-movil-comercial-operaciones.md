# Vistas móvil — módulos COMERCIAL y OPERACIONES (plan sobre capturas de Figma)

**Fecha:** 2026-11-09
**Estado:** capturas de Figma recibidas y analizadas (20 pantallas, 5 roles). Este
doc sustituye el análisis general previo: con el diseño en mano queda claro que
esto **no es un responsive de las tablas del dashboard** — es el **PWA móvil
dedicado por rol** (camino B: shell móvil propio), tal como lo describe
`nueva-info`. El análisis por pantalla y su complejidad, abajo.

---

## 0. Lectura clave del diseño

- **Roll-based de verdad:** cada rol tiene su propio shell con navegación inferior
  (Trabajador 5 tabs, Residente 5, Técnico 5, Cobrador 4 con 2 visibles según
  sub-rol del prendario/diésel, Administrador 4 + grid de módulos).
- **Acción primero:** cada pantalla encabeza con la acción del día (Registrar
  asistencia, Aceptar, Cobra $, Presionar); las tablas del desktop **no se
  replican** — se convierten en listas de tarjetas con 2-3 datos por tarjeta.
- **Asistencia es el corazón del PWA** (para TODOS los roles): foto obligatoria +
  marcard GPS "dentro de la zona" + justificación de retardo — hoy ese flujo vive
  en el módulo RRHH (`asistencia`), no en COM/OP.
- **Todo deja rastro:** aceptación, "Presionar", entregas de diésel, corte del día
  → mapping directo con `registro_auditoria` como las reglas del repo exigen.

---

## 1. Inventario pantalla por pantalla (mapeo rutas/modulos)

### Trabajador (operadores y choferes) — rol Trabajador (20)
| Pantalla Figma | Modulo destino | ¿Existe base hoy? | Complejidad |
|---|---|---|---|
| Inicio (saludo + estado de asistencia + mini-stats + reportes recientes + llamar encargado) | Dashboard móvil del rol | Parcial: stats de asistencia existen; "reportes recientes" es /reportes | **Media** — es un dashboard armado de piezas (.asistencia + reportes + contactos), sin consultas nuevas |
| Asistencia (foto obligatoria + GPS + justificación) | **RRHH** (`asistencia`) | 🚫 Fuera COM/OP — fluye con los permisos de asistencia existentes; la foto/GPS + retardo justification es flujo nuevo | **Alta** (captura foto, GPS zona, rechazos) |
| Reportar problema (mis reportes + nuevo + filtros + atención/status) | **OPERACIONES** (`reportes_campo`) | ✅ La vista EXISTE — es /reportes acotada al creador (scope propio ya implementado) | **Baja** — solo `crear` + lista propia; botón "+ Nuevo reporte" ya existe en el alta |
| Contactos (encargado, mesa de ayuda, oficina — llamar) | Nuevo módulo móvil | 🚫 No existe ningún contactos | **Baja** (lista estática de teléfonos con `tel:` links, dato del encargado = `jefe_user_id` ya en BD del fin del flujo) |
| Perfil (datos, documentación INE/CURP/SS/licencia con estatus de subida) | **Sistema/RRHH** (`documentos`) | 🚫 Fuera COM/OP — usa el módulo documentos que ya existe en desktop (estatus por documento) | **Media** — reuso de documentos del trabajador |

### Residente (ingenieros encargados de obra y de personal) — rol Residente (90)
| Pantalla Figma | Modulo destino | ¿Existe base hoy? | Complejidad |
|---|---|---|---|
| Inicio (mi asistencia + "Mi equipo hoy": presentes/faltas/retardos + "Requieren tu atención" + reportes abiertos de su equipo) | Dashboard del rol | Parcial: `reportados` de su equipo ya es scope de /reportes; asistencia del equipo = RRHH | **Media** |
| Asistencia del equipo (select obra, todos/presentes/faltan, lista por persona, llamar a quien no asistió) | **RRHH** (`asistencia`) | 🚫 Fuera COM/OP | **Alta** |
| Reports (Abiertos/Atendidos/Resueltos + "¿Por qué no se resuelve?" + **Presionar** + Llamar técnico) | **OPERACIONES** (`reportes_campo`) | ✅ Scope de su equipo ya implementado; **Presionar** = nuevo | **Media** — reusa aceptar/cerrar/comentar; falta el botón "Presionar" (nudge a la torre) |
| Obras (mapa de mis obras + cards con progreso % y trabajadores/máquinas por obra) | **OPERACIONES** (`proyectos`) | ✅ Proyectos existen con progreso; mapa = coords; a los proyectos les falta la FK **residente** (fue la variante B documentada) | **Media** |
| Contactos (mi equipo + jefes/administración + mesa de ayuda) | Nuevo módulo móvil | 🚫 No existe | **Baja** (llamadas: datos del equipo + jefe del fono existentes) |

### Técnico (mecánico, soldador, mantenimiento, diésel) — roles Técnico descriptivos (70)
| Pantalla Figma | Modulo destino | ¿Existe base hoy? | Complejidad |
|---|---|---|---|
| Inicio (asistencia + Disponibles/Mis aceptados/Resueltos + "Mi torre": colegas con su carga) | Dashboard del rol | ✅ Todo existe: aceptar cuenta por rol-área; "mi torre" = colegas del rol `users.torre` | **Media** |
| Asistencia | **RRHH** | 🚫 Fuera COM/OP | **Alta** |
| Reports de la torre (Disponibles 4 / Mis aceptados 2 / Resueltos 23, cards rojas con **Aceptar** + **Ubicación**) | **OPERACIONES** (`reportes_campo`) | ✅ YA EXISTE de punta a punta en desktop: lista de su torre (`aplicarAmbito`), **Aceptar** con guard anti-carrera y responsable, feo todo `reportes_campo` | **Baja** — es /reportes capsule en su torre |
| Flota y obras (buscar maquina/obra/encargado + estado operando/en taller + **ver ubicación exacta**) | **MAQUINARIA** (`maquinas` + `rastreo_gps`) | ✅ Maquinaria y GPS/coordenadas existen | **Media** — necesita listas por maquina/obra filtradas por texto |
| Inventario (buscar + tabs refacciones/soldadura/herram. + bajo/sin-stock) | **OPERACIONES** (`inventario`) | ✅ Artículos + stock por bodega existen | **Media** — necesite endpoint de búsqueda móvil ya (la vista inventario la tiene) |
| **Diésel (repartidor)** — tanque principal, entregas de hoy, registrar carga (MANTENIMIENTO/Comercial?) | **OPERACIONES** (`cargas_combustible`) | ✅ Cargas de combustible existen y ya se registran | **Media** — la mobile view del repartidor (rol Técnico-Diésel) |

### Cobrador de criba — rol Cobrador (60)
| Pantalla Figma | Modulo | ¿Existe base hoy? | Complejidad |
|---|---|---|---|
| Inicio (caja del día + material en criba del inventario + última venta) | Dashboard del rol (COMERCIAL+OP) | ✅ Ventas del día existe; material = inventario donde la criba produce | **Media** |
| Asistencia | RRHH | 🚫 Fuera COM/OP | Alta |
| **Cobo** — punto de venta (cliente/placa, materiales ×cantidad, método de pago con IVA 16%, **Cobrar**) | **COMERCIAL** (`ventas`) | ✅ El POS /ventas existe completo con IVA e idempotencia | **Baja** |
| **Corte del día** (ingresos/egresos, saldo en caja efectivo/transf/crédito, retiros y gastos, cerrar corte) | **COMERCIAL** (`ventas` + `/ventas/corte`) | ✅ Existe TODo en desktop: retiros/gastos y caja con cierre aprobación | **Baja** |

### Administrador (jefes y personas de oficina) — rol Administrador (100)
| Pantalla Figma | Modulo | Base | Complejidad |
|---|---|---|---|
| Inicio dashboard (KPI juego: personal activo, flota operando, ventas del mes, cobranza pendiente + alertas: urgente/documentos vencidos/licencias 30d/diésel 62%/faltas) | Dashboard móvil | Datos: todas las queries existen (KPIs de los modules + alertas = notificaciones) | **Media** |
| Reportes de campo (Abiertos 9/Urgentes/Resueltos + tiempo promedio de resolución + tarjetas) | **OPERACIONES** (`reportes_campo`) | ✅ /reportes completo | **Baja** |
| Finanzas (utilidad del mes + ingresos/egresos + CxC por cliente + movimientos) | **COMERCIAL** (`finanzas`) | ✅ /finanzas completo | **Baja-media** |
| Módulos SVR (grid de todos los modulos del sistema) | Navegador | ✅ Es el menú lateral convertido a grid | **Baja** |

---

## 2. Alcance pedidos hoy: SOLO módulos COMERCIAL y OPERACIONES

**En plan directo (están sus bases, implementables):**
| Página | Módulo | Base | Orden sugerido |
|---|---|---|---|
| **Reportes (todas las variantes de rol: trabajador/residente/técnico)** | OPERACIONES | /reportes v2 completa con aceptar/ambito por torre/jefe | **1ª** |
| **Cobo (POS del cobrador)** | COMERCIAL | /ventas existe | **2ª** |
| **Corte del día** | COMERCIAL | /ventas/corte existe | **3ª** |
| **Flota y obras del técnico** | OPERACIONES (maquinaria) | maquinas + rastreo_gps | **4ª** |
| **Inventario del técnico** | OPERACIONES | inventario con bodega/stock | **5ª** |
| **Diésel del repartidor** | OPERACIONES | cargas_combustible | **6ª** |

**Adyacentes (fuera de COM/OP — para una fase 2):** Asistencia de todos los roles
(y la del equipo del residente), Contactos (nuevo módulo), Perfil/documentación,
Obras del residente (usa proyectos — COM/OP al fin, pero sufle respuesta del
mapa), y los dashboards Inicio de cada rol (mezclan RRHH+comercial+op).

---

## 3. Infraestructura común que pedra el shell móvil (la de verdad)

Aunque cada pantalla usa módulos que ya existen, **ninguna de las pieces existe
como "/m/*"** — pedra instalar:
1. **Shell móvil por rol:** navegación inferior condicionado al rol (vistas de
   `role_vistas` ya lo proveen), header con obra/encargado:
2. **Auth + token en memoria** ya viven (relativo: la sesión del GET funciona en
   HTTP LAN — mismo caveat de GPS que ya conocemos: la ubicación/GPS zone de
   asistencia exige HTTPS).
3. **Endpoints que faltan por levantar:** fotos de asistencia (payload image),
   **Presionar** (nudge a la torre del reporte), contactos personales.
4. **Offline:** la guía de nueva-info exige captura sin señal — fuera del scope
   de esta phase.

---

## 4. Riesgos y contradiciones marcadas por el diseño

- **Asistencia** es la pantalía más repetida del PWA (5 roles) y **no es
  COM/OP** — pedrá desacoplada al módulo RRHH como fase propia, o es el primer
  grande si se decide incluir.
- **El reporte del trabajador no pide prioridad ni área manual** — el diseño la
  deriva ("Avisa a tu técnico" = su torre) — coherente con lo ya implementado
  de P9 prioridad futura y del rol responda el "Reporta" del server.
- **"Presionar"** y **"¿Por qué no se resuelve??"** son una conversación/nudge
  nueva al reporte (paso de mensaje a la torre) — nueva pieza, detrás de
  ` registros`?
- La ubicación con **GPS "dentro de la zona"** del fin de asistencia requiere
  HTTPS (el PWA target) + geofence — la variante ya documentada de obras.

---

## 5. Decisión recomendada (con las capturas sobre la mesa)

**La PWA móvil se construye como mini-app dedicada por rol (Opción B)**, no como
responsive de las tablas del dashboard:

- El diseño de Figma es "acción primero" (Registrar asistencia, Aceptar, Cobrar,
  Presionar): tarjetas grandes con 2-3 datos, navegación inferior por rol.
- Squeezear las tablas del desktop dentro del teléfono rompería la usabilidad en
  obra (letras chiquitas, scroll horizontal, guantes y señal bailando).
- Nada del negocio se duplica: los móviles **reusan** el login, los permisos por
  rol, los endpoints y el registro_auditoria que ya existen — solo se construyen
  las pantallas.
- El desktop queda intacto para oficina/administración.

**Orden de construcción sugerido:**
1. Shell móvil (login por rol + navegación inferior) + Reportes
   (las 3 variantes de rol — es lo que ya vive).
2. POS del cobrador y Corte del día (existen).
3. Flota y obras, Inventario y Diésel del repartidor (operaciones).
4. Asistencia (foto+GPS+zona) como fase aparte de RRHH — es la pantalla más
   repetida del diseño pero pertenece a otro módulo.
5. Contactos, Perfil-documentación, Obras-mapa y dashboards Inicio.

**Requisito no negociable:** HTTPS (la cámara y el GPS del teléfono no funcionan
sin él). Offline (guía nueva-info) queda como fase siguiente.
