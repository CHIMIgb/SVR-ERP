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

> **✅ ESPECIFICACIÓN DEFINITIVA — confirmada por el cliente (2026-11-11).** La
> lista de vistas por rol de esta sección queda como LA DEFINITIVA para la PWA:
>
> - **Administrativos:** inicio acorde a su rol · reportes de campo · finanzas · módulos
> - **Residentes:** inicio · asistencia · reportes · obras · contactos
> - **Cobradores:** inicio · asistencia · cobro (punto de venta) · cobro del día
> - **Técnicos:** inicio · asistencia · reportes · flota · obras *(el diseño las toma como una sola — se hará lo que diga)* · inventario · diesel
> - **Trabajadores:** inicio · asistencia · reportes · contactos · mi perfil
>
> Las tablas de esta sección quedan congeladas contra esa lista (los subtítulos
> "¿Qué pantalla Figma?" mapean a estas vistas). Implicaciones que introduce:
>
> 1. **La asistencia es UNIVERSAL** — aclaración del cliente (2026-11-11):
>    TODOS los trabajadores la toman sin importar el rol (cobradores,
>    técnicos, residentes y trabajadores marcan su propia asistencia con
>    foto+GPS). Solo los Residentes tienen ADICIONALMENTE la vista del equipo
>    (quién asistió de su gente). Implicación de RBAC: en el escritorio el
>    módulo `rrhh/asistencia` solo lo ve Encargado de RRHH y Administrador —
>    la migración de accesos de la PWA deberá agregar la vista de asistencia
>    (propia, con foto+GPS) a **todos** los roles de trabajadores: Trabajador,
>    Residente, los 4 Técnicos y Cobrador.
> 2. **Contactos y Mi Perfil son módulos móviles NUEVOS** — sin base hoy
>    (Contactos: lista estática de teléfonos con `tel:` links; Mi Perfil: reusa
>    documentos del trabajador). Son las 2 únicas pantallas sin base existente
>    de bajo costo — el resto reusa módulos del escritorio.
> 3. **Flota + Obras = UNA pantalla** para Técnicos (búsqueda de máquina/obra/
>    encargado + ver ubicación exacta) — el diseño las fusiona; se respeta.

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
4. **Offline:** YA ES ALCANCE DE LA BASE — ver §7c (cola + sincronizador) y
   §8 (plan de la base); esta sección queda como foto histórica.

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

## 5b. Organización y estructura — la PWA vive DENTRO de apps/web (no una app aparte)

**Decisión:** la PWA se construye en el MISMO proyecto `apps/web`, como un
grupo de rutas de Next.js: `src/app/(pwa)/` con todas sus pantallas bajo el
prefijo de URL `/m/*` (m = móvil). El escritorio sigue en `src/app/(dashboard)/`.

**Árbol de archivos que se creará:**

```
apps/web/src/
  app/
    layout.tsx                 # raíz (proveedores globales: AuthProvider, toasts)
    page.tsx                   # login/landing + DETECTOR de ancho de pantalla
    (dashboard)/               # escritorio (hoy) — sin cambios
      layout.tsx               # shell escritorio (Sidebar + Topbar)
      <modulos>/page.tsx
    (pwa)/                     # ⬅ NUEVO: la mini-app móvil
      layout.tsx               # shell móvil: header (avatar+obra) + nav inferior por rol
      m/
        page.tsx               # Inicio del rol
        reportes/page.tsx      # Reportes (variante por rol)
        asistencia/page.tsx    # Asistencia (fase de RRHH)
        contacto/page.tsx      # Contactos / Mi perfil / etc.
        ...                    # POS, flota-obras, inventario, diesel...
  components/
    ui/*                       # kit compartido (Input, Modal, Badge, Skeleton...)
    pwa/*                      # ⬅ NUEVO: componentes específicos móviles
                               #    (RoleNav, ReportCard, ActionCard, etc.)
  lib/
    api.ts                     # compartido — los móviles consumen el MISMO cliente
    pwa/
      dispositivo.ts           # detección/interruptor de ancho (localStorage)
      rol-nav.ts               # nav inferior por rol (lee user.vistas)
```

**Por qué NO una app aparte (`apps/pwa`):**

1. **El login y los tokens son UNO solo.** El `AuthProvider`/`useAuth`, el
   `apiClient` (token en memoria, refresh con cola anti-401, `mensajeErrorApi`)
   viven en `apps/web` — una app aparte duplicaría esa maquinaria crítica, y
   dos copias del manejo de tokens = drift garantizado (la rotación, la cola
   de refresh y la blacklist se arreglan en un solo lugar).
2. **El kit de UI ya vive acá.** Los móviles reusan `Input/Modal/Badge/
   Skeleton/Pagination` del kit; un `apps/pwa` tendría que copiar el kit o
   publicarlo como paquete — innecesario para pantallas que comparten diseño.
3. **Un solo build, un solo deploy.** Vercel compila `apps/web` una vez y
   sirve ambas caras (`/` escritorio, `/m/*` móvil). Dos apps = dos deploys,
   dos variables de entorno (`NEXT_PUBLIC_API_URL` x2) y versiones que se
   desalinean.
4. **Capacitor (fase siguiente) envuelve ESTE MISMO build.** El plan de
   `nueva-info` dice "sin app de Android/iPhone": Capacitor toma el output de
   la web y lo empaqueta como APK — eso solo funciona si la PWA vive dentro
   de la misma web. Con `apps/pwa` habría que elegir cuál envolver o
   duplicar el empaquetado.
5. **RBAC y `user.vistas` son los mismos.** La nav inferior por rol y el
   detector leen el mismo perfil que ya entrega `/auth/profile` — un solo
   lugar que mantener.

**El prefijo `(pwa)` con paréntesis** es un *route group* de Next.js: agrupa
rutas bajo un layout propio SIN afectar la URL (las pantallas viven en `/m/*`
gracias a la carpeta `m/`). Así cada cara tiene su layout (escritorio →
Sidebar/Topbar; móvil → header + nav inferior) compartiendo el layout raíz y
sus proveedores de sesión.

**Reparto de responsabilidades por archivo:**

| Pieza | Vive en | Comparte con desktop |
|---|---|---|
| Sesión/tokens/refresh | `lib/api.ts` + `providers/AuthProvider.tsx` | SÍ (idéntico) |
| Nav inferior por rol | `(pwa)/layout.tsx` + `lib/pwa/rol-nav.ts` | No (el desktop usa Sidebar) |
| Detector de pantalla | `page.tsx` (raíz) + `lib/pwa/dispositivo.ts` | No (desktop no detecta nada) |
| Pantallas móviles | `(pwa)/m/**` | Consumen los MISMOS endpoints de `lib/api.ts` |
| Componentes visuales | `components/pwa/*` + kit `ui/*` | El kit ui es el mismo; los pwa son exclusivos móviles |
| Instalable/offline (fase 2) | `public/manifest.json` + service worker | No — solo la cara móvil lo registra |



**Orden de construcción sugerido:**
1. **Detector + interruptor + infra offline (primer entrega):** al abrir la app se mide el ancho
   de pantalla (`matchMedia`, no la marca del dispositivo): **< 768px → cara PWA
   (`/m/*`)**, **≥ 768px → dashboard de escritorio**; con un interruptor
   **"Ver versión de escritorio / versión móvil"** en la PWA que se recuerda en
   `localStorage` (evita atrapar a un administrativo con ventana chica o a un
   residente con tablet grande). Reviso con sesión/permisos duales: las dos caras
   validan lo mismo.
2. Shell móvil (login por rol + navegación inferior) + Reportes
   (las 3 variantes de rol — es lo que ya vive).
3. POS del cobrador y Corte del día (existen).
4. Flota y obras, Inventario y Diésel del repartidor (operaciones).
5. Asistencia (foto+GPS+zona) — pantalla más repetida del diseño; su módulo es RRHH, y desde su primer pantalla usa la infraestructura offline del §7c.
6. Contactos, Perfil-documentación, Obras-mapa y dashboards Inicio.

**Cómo inicia cada quien sin esa unidad de especial:** el link de WhatsApp /
instalado en el teléfono manda DVR a la cara PWA (`/m/*`); el escritorio abre la
URL de siempre. Y con el detector del punto 1, la redirección automática dice
por dimensiones — los roles siempre validan las fines (del dual de las vistas).

**Matiz honesta:** el "auto-detector" es por **ancho de pantalla**, no por marca
de equipo — un jefe con celular también abriría la cara PWA (y un personal con
ventana chica del laptop too) → la salida del interruptor cubre ambos casos.
Redirección con micro-specific de miliseconds a la pantalla de login — invisible
en la pratica.

**Requisito no negociable:** HTTPS (la cámara y el GPS del teléfono no funcionan
sin él). Offline NO es fase posterior: la infraestructura (cola + sincronizador + manifest) se coloca desde el paso 1 — §7c.

## 6. Especificación funcional del móvil (definitiva — nueva-info, transcrita 2026-11-11)

Documento de referencia del cliente. ESTA sección manda sobre cualquier
interpretación de las capturas de Figma (§0-§1). Sin app de tiendas: PWA
instalable con HTTPS.

### 6.1 Objetivo
Los trabajadores de SVR registran su asistencia (con foto obligatoria) y
reportan problemas desde el teléfono. Cada persona ve solo la vista de su rol,
y todo funciona también sin internet.

### 6.2 Tecnología
- PWA (se abre desde el navegador y se instala), con HTTPS.
- Sin internet: lo registrado se guarda en el teléfono y se envía solo al
  volver la señal. En Android sale en segundo plano. En iPhone se envía al
  abrir la app otra vez.

### 6.3 Roles y vistas (coincide con §1 — definitiva)
| Rol | Qué ve |
|---|---|
| Trabajador (operadores y choferes) | Inicio, Asistencia, Reportar problema, Contactos, Perfil con documentos |
| Residente | Asistencia propia y de su equipo, reportes de sus trabajadores para presionar, obras con ubicación, contactos |
| Técnico (mecánico, soldador, mantenimiento, diésel) | Asistencia, reportes de su torre de solución, flota y obras con ubicación, inventario, y diésel para el repartidor |
| Cobrador de criba | Asistencia, punto de venta, cobro y corte del día |
| Administrador | El SVR completo en el teléfono: dashboard, reportes, finanzas y módulos |

La mesa de ayuda no tiene vista aparte, porque trabaja en el SVR.

### 6.4 Usuario — número de empleado
- Formato con prefijo por rol: ADM-01, RES-014, TEC-007, COB-003, TRA-0142.
- Un solo número por persona. Si cambia de puesto, solo cambia el rol.
- El rol real lo valida siempre el servidor, no el prefijo.

### 6.5 PIN
- Formato: 8 caracteres entre letras y números (ej. HV4K5R7M), con al menos
  1 letra y 1 número, sin distinguir mayúsculas de minúsculas.
- Reglas: sin repeticiones ni secuencias, sin el número de empleado, y
  distinto de los últimos 3.
- Temporal: lo genera el sistema, sin caracteres que se confunden (0/O, 1/l/I),
  y vale 24 horas.
- Caducidad: el PIN se cambia cada 30 días, para todos los roles.

### 6.6 Ciclo completo
1. **Alta:** el administrativo registra al trabajador en Trabajadores, elige
   el rol y el sistema crea el usuario con un PIN temporal.
2. **Entrega:** el botón "Enviar por WhatsApp" abre WhatsApp con el mensaje
   escrito (usuario, PIN temporal y enlace), sin API y sin costo.
3. **Primer ingreso:** abre el enlace, instala la PWA y entra con el temporal.
   La app lo obliga a crear su propio PIN.
4. **Uso diario:** la sesión queda guardada en el teléfono. Registra
   asistencia y reportes aunque no haya señal.
5. **Aviso:** a los 25 días la app avisa que el PIN vence (sin mostrar PIN).
6. **Cambio:** escribe su PIN actual y luego el nuevo dos veces. Se cierran
   sus otras sesiones y vuelven a contar 30 días.
7. **Si vence:** con internet, la app no lo deja continuar hasta cambiarlo.
   Sin internet tiene 3-4 días de margen para seguir registrando asistencia.

### 6.7 Seguridad
- Nadie ve PINs: el sistema nunca muestra un PIN existente; cada quien elige
  el suyo.
- Bloqueo: 5 intentos fallidos bloquean la cuenta; la desbloquea la mesa de
  ayuda.
- Reautenticar: cambiar PIN o cerrar otras sesiones pide el PIN actual.
- Cierre de sesiones: el administrativo puede cerrar todas las sesiones de
  un trabajador si sospecha algo.
- Bajas: al desactivar al usuario, deja de entrar.
- Cifrado: los PIN se guardan cifrados (argon2 o bcrypt).

### 6.8 Casos especiales
- Olvidó el PIN: el administrativo o la mesa de ayuda lo reinicia con un
  clic, con un temporal de 24 horas (vuelve al paso 3 del ciclo).
- Cambio de teléfono: inicia sesión con su número y PIN, sin tocar el alta.
- Teléfono compartido: se evita; si pasa, cada quien cierra su sesión y
  entra con la suya.
- Residente: solo ve sus obras y sus trabajadores — el alta liga cada
  trabajador con su obra y su encargado.

### 6.9 Pendiente de decidir (preguntas al cliente)
1. ¿El plazo de 30 días aplica igual al administrador, o más corto?
2. ¿El margen de días sin internet: 3 o 4?
3. Los datos que se guardan en el SVR sobre PIN/sesión: rol, fecha del
   último cambio de PIN, estado de sesión y número de intentos (definir
   columnas exactas).

### 6.10 Implicaciones de backend que esta especificación introduce
Nada de esto existe hoy (el login del escritorio sigue siendo email+password):
1. `users.numero_empleado` (prefijo por rol + consecutivo) — el alta en
   Trabajadores lo genera.
2. **Login por número + PIN** (endpoint nuevo o variante de `/auth/login`)
   con PIN temporal vs propio y su expiración de 24 h.
3. Campos de PIN: `pin_hash` (argon2id preferido — bcryptjs existe pero
   argon2 es el estándar del spec), `pin_temporal_hasta`, `pin_cambiado_en`,
   `pin_historial` (últimos 3).
4. Sesiones ya existen (tabla `sessions` + `refresh_tokens` con
   `revocado_en`/`motivo_revocado`) — el cierre masivo por trabajador y el
   cierre de otras sesiones usan la misma maquinaria.
5. Bloqueo por intentos: `bloqueoService` ya existe (5 intentos) —
   reutilizar; falta el desbloqueo por mesa de ayuda.
6. Entrega por WhatsApp: sin API — link `wa.me` con mensaje prellenado desde
   el alta.

## 7a. Detector e interruptor de versión (técnicamente)

**Principio:** cada layout se defiende a sí mismo — el shell móvil (`(pwa)`)
redirige a escritorio si el ancho ≥ 768px y viceversa; el override manual del
usuario manda sobre el ancho. Así ninguna pantalla implementa detección propia
(regla 8 de AGENTS.md).

**Dónde vive:** `lib/pwa/dispositivo.ts` — única fuente de verdad:

```ts
export type VistaForzada = 'movil' | 'escritorio' | null;
const CLAVE = 'svr_vista';          // localStorage
export function vistaForzada(): VistaForzada;          // lee override
export function forzarVista(v: VistaForzada): void;    // escribe/borra override
export function esAnchoMovil(): boolean;               // matchMedia('(max-width: 767px)')
export function vistaEfectiva(): 'movil' | 'escritorio'; // override ?? ancho
```

**Flujo de decisión (en orden):**
1. ¿Hay override en `localStorage` (`svr_vista`)? → ese manda.
2. Si no: `matchMedia('(max-width: 767px)')` → `<768px` = móvil.
3. Los layouts aplican la consecuencia:
   - `(pwa)/layout.tsx`: si `vistaEfectiva() === 'escritorio'` → `router.replace('/')` (dashboard).
   - `(dashboard)/layout.tsx`: si `vistaEfectiva() === 'movil'` → `router.replace('/m')`.
4. El **interruptor** vive en el footer del shell móvil y en el sidebar del
   escritorio ("Ver versión de escritorio / móvil") → `forzarVista(...)` +
   `router.replace(...)` a la otra cara. Se recuerda hasta que el usuario lo
   vuelva a tocar (`forzarVista(null)` = volver a automático).

**Matices que evitan bugs clásicos:**
- `matchMedia` se lee **en `useEffect`** (nunca en render de servidor): evita
  mismatch de hidratación; mientras decide, la pantalla muestra su skeleton
  (regla de loaders del repo).
- El **login es UNA sola pantalla** (responsable, mínima): no hay login móvil
  aparte. Tras autenticar, `AuthProvider` enruta según `vistaEfectiva()`:
  móvil → `/m`, escritorio → `/dashboard`.
- La redirección usa `router.replace` (sin dejar el dashboard en el historial
  del back button del teléfono).
- **Capacitor (fase siguiente):** dentro del APK el viewport siempre es el del
  teléfono — el override del usuario se ignora (la app nativa es móvil).

## 7b. Shell móvil y navegación por rol

**`(pwa)/layout.tsx`** es `'use client'`, hereda los proveedores del layout
raíz (AuthProvider, toasts) y:

1. **Exige sesión:** sin `user` → redirect al login (una sola pantalla
   compartida con desktop).
2. **Header superior:** avatar con iniciales, nombre (de la persona) y rol;
   la obra activa aparece cuando exista (llega con la fase de asistencia —
   la obra del marcador del día). Botón de cerrar sesión accesible.
3. **Nav inferior por rol** (`components/pwa/RoleNav` + `lib/pwa/rol-nav.ts`):
   - Fuente: `user.vistas` (lo que ya entrega `/auth/profile`) filtrado por
     `puedeVer` — **prohibido hardcodear el menú en cada pantalla**.
   - Mapa de rutas móviles ↔ vistas (cada pestaña es una ruta real `/m/...`
     — el back button del teléfono funciona siempre).
   - Máximo 5 pestañas (el spec §6.3 no supera 5 en ningún rol); íconos
     individuales de `lucide-react`; pestaña activa por `usePathname()`.
   - Táctiles ≥ 44px, padding de safe-area (`env(safe-area-inset-bottom)`),
     badge "N sin enviar" cuando la cola offline tenga pendientes (§7c).
4. **Contenido:** `{children}` en un contenedor con scroll propio y
   `scrollbar-none`.

**Nav por rol (según spec §6.3):**

| Rol | Pestañas (ruta → vista) |
|---|---|
| Trabajador | `/m` Inicio · `/m/asistencia` · `/m/reportes` · `/m/contactos` · `/m/perfil` |
| Residente | `/m` Inicio · `/m/asistencia` (equipo) · `/m/reportes` · `/m/obras` · `/m/contactos` |
| Técnico (×4) | `/m` Inicio · `/m/asistencia` · `/m/reportes` · `/m/flota-obras` · `/m/inventario` (+ `/m/diesel` solo Técnico-Diesel) |
| Cobrador | `/m` Inicio · `/m/asistencia` · `/m/pos` · `/m/corte` |
| Administrador | `/m` Inicio · `/m/reportes` · `/m/finanzas` · `/m/modulos` |

El helper `rol-nav.ts` resuelve qué pestañas corresponden leyendo el rol y
las vistas del usuario — si el RBAC quita una vista, la pestaña desaparece
sin tocar código.

## 7c. Offline desde el día 1 — captura local y sincronización

**Principio (aclaración del cliente):** desde la primera pantalla de captura,
la app funciona sin internet. Lo registrado se guarda en el teléfono y se
envía solo al volver la señal (Android: segundo plano; iPhone: al abrir la
app). No es una fase posterior: la infraestructura se coloca desde el paso 1.

**Arquitectura (3 piezas en `lib/pwa/`):**

1. **Cola local (outbox) — `offline.ts`:**
   - IndexedDB (vía `idb`/Dexie) — NO localStorage (fotos grandes y
     estructuras).
   - Cada elemento: `{ id, entidad, payload, creado_en, intentos, estado }`
     con `id = UUID v4 generado EN EL TELÉFONO`.
   - **Idempotencia por diseño:** las tablas nuevas de la PWA usan esa UUID
     como PK (los reportes ya son UUID; asistencia igual) → re-envíos
     deduplicados por PK/índices únicos del servidor, nunca filas dobles.
   - Las fotos van como blob WebP ya convertidas (el flujo actual de
     `convertirAWebp` se reusa — la conversión es local, sin red).
2. **Sincronizador — `sincronizador.ts`:**
   - Corre: al abrir la app · al evento `online` · periódico en Android
     (Background Sync API cuando el SO lo permita; iPhone: al abrir).
   - Orden FIFO respetando dependencias (el reporte antes que su adjunto).
   - Reintento con backoff; elemento en error se marca (no bloquea la cola).
   - El badge "N sin enviar" del shell (§7b) cuenta los pendientes.
3. **Pantallas conectadas a la cola:**
   - Toda pantalla de CAPTURA escribe a la cola primero (asistencia, nuevo
     reporte, comentario, adjunto) y muestra su estado local (enviado/
     pendiente).
   - Las acciones INTERACTIVAS no se encolan: aceptar, cerrar, asignar,
     cerrar corte — piden conexión (son del servidor y cambian estado de
     otros). Regla: **offline = capturar; online = coordinar**.
   - El POS (dinero) NO se encola — ventas requiere conexión (decisión a
     validar con el cliente; el spec §6.6 habla de asistencia y reportes).

**Instalable desde el día 1:**
- `public/manifest.json` (nombre, iconos 192/512, `display: standalone`,
  `start_url: /m`, theme color) + service worker mínimo (caché del shell) —
  la cola vive en IndexedDB, no en el SW.
- Requisito firme: **HTTPS** (cámara/GPS/instalación).

**Decisiones abiertas que este diseño arrastra (a §6.9):**
- ¿La cola se conserva al cerrar sesión? (propuesta: SÍ — es del dispositivo;
  con cierre masivo por admin los envíos fallarán hasta re-login y ahí se
  re-envían).
- Cuota/purga: elementos entregados se borran tras N días; el teléfono avisa
  si la cola crece demasiado.
- ¿Se encolan ventas del POS? (propuesta: NO — dinero requiere conexión;
  validar con el cliente).

## 8. Plan de la BASE de la PWA (identidad número+PIN + shell + vistas placeholder)

Alcance de "la base" (lo primero que se construye, según §6.4-6.8 y §7a-7c):
**identidad por número de empleado + PIN, shell con nav por rol, detector,
instalable, y las vistas de cada rol VACÍAS (solo título)** — sin lógica de
módulos todavía.

### 8.1 Migraciones de base de datos (en orden)

1. **`users` — identidad PWA:**
   - `numero_empleado` TEXT UNIQUE (formato `PREF-NNN`: ADM/RES/TEC/COB/TRA +
     consecutivo por prefijo; el alta lo genera con transacción y unique para
     evitar carrera de consecutivos).
   - `pin_hash` TEXT (hash del PIN actual; nunca en claro).
   - `pin_temporal_hasta` TIMESTAMPTZ NULL (temporal de 24 h del alta/reinicio).
   - `pin_cambiado_en` TIMESTAMPTZ (vence a los 30 días; aviso a los 25).
   - `pin_historial` JSONB (hashes de los últimos 3 PINs — para la regla
     "distinto de los últimos 3").
   - `intentos_pin` INT DEFAULT 0 (bloqueo por cuenta, spec §6.7).
   - `cuenta_bloqueada_en` TIMESTAMPTZ NULL.
2. **RBAC de la PWA (idempotente):**
   - Vistas móviles registradas en la tabla `vistas` con ruta `/m/*`
     (`/m`, `/m/asistencia`, `/m/reportes`, `/m/contactos`, `/m/perfil`,
     `/m/obras`, `/m/flota-obras`, `/m/inventario`, `/m/diesel`, `/m/pos`,
     `/m/corte`, `/m/finanzas`, `/m/modulos`) — así `user.vistas` alimenta
     `rol-nav.ts` SIN mapeos ad hoc, y el escritorio queda con sus vistas.
   - **Asistencia universal** (aclaración del cliente): `puedeVer` de
     `/m/asistencia` para Trabajador, Residente, los 4 Técnicos y Cobrador
     (solo ver — la captura es propia; el Residente además la de su equipo
     con los permisos ya existentes de asistencia).
3. Migración `seed`-style idempotente (patrón del repo: `ON CONFLICT DO NOTHING`
   / `IF NOT EXISTS`).

### 8.2 Endpoints nuevos (cada uno con los 4 estándares: JWT → blacklist →
auditoría SUCCESS → FAIL con error_code)

| Endpoint | Qué hace | Notas |
|---|---|---|
| `POST /auth/login-pin` | número de empleado + PIN → par de tokens | Reutiliza el bloqueo escalonado existente (`bloqueoService`); a los 5 intentos bloquea la cuenta (`intentos_pin`), no solo la IP |
| `POST /auth/pin/cambio` | PIN actual + nuevo (x2) | Re-autenticación con el PIN actual; cierra las OTRAS sesiones (revoca sus refresh en `sessions/refresh_tokens` — maquinaria existente); reinicia `pin_cambiado_en`; valida reglas §8.3; FAIL auditado: `PIN_INVALIDO`, `PIN_REPETIDO`, `PIN_SECUENCIA`, `PIN_CONTIENE_EMPLEADO` |
| `POST /auth/pin/reinicio` | admin/RRHH reinicia con clic | Genera temporal 24 h (sin caracteres confusos 0/O/1/l/I); FAIL: `SIN_PERMISO_MESA_AYUDA` |
| `POST /auth/pin/desbloqueo` | mesa de ayuda desbloquea cuenta | FAIL: `SIN_PERMISO_MESA_AYUDA` |
| `GET /auth/pin/estado` | estado para la app: `pin_cambiado_en`, `cuenta_bloqueada` | Alimenta el aviso a los 25 días y el bloqueo de navegación si venció |
| `POST /trabajadores` (ampliado) | el alta genera `numero_empleado` + PIN temporal + responde los datos para el botón "Enviar por WhatsApp" | Sin API: el frontend arma el link `wa.me` con el mensaje prellenado |

### 8.3 Validación del PIN (algoritmo único, server-side; el móvil solo adelanta hints)

Un PIN es válido si:
1. 8 caracteres de [A-Za-z0-9], **case-insensitive** (se normaliza a mayúsculas
   antes de evaluar y hashear).
2. Al menos 1 letra y 1 número.
3. **SIN caracteres repetidos** en todo el PIN (estricta — decisión del
   cliente 2026-11-11; ni consecutivos ni separados: `HV4K5R7H` se rechaza).
4. Sin secuencias de 3+ (asc/desc en letras o números: `ABC`, `123`, `CBA`, `987`).
5. No contiene su número de empleado (ni el prefijo+consecutivo con o sin guion).
6. Distinto de los últimos 3 (`pin_historial`).
7. Hash con **argon2id** (recomendado por el spec; si se evita la dependencia
   nativa, bcryptjs con coste ≥ 10 — decisión por confirmar, §6.9-adjacente).

### 8.4 Login dual (una sola pantalla, dos modos)

- El login sigue siendo UNA pantalla (§7a). Detecta el contexto:
  - **Vista móvil** (`vistaEfectiva() === 'movil'`) → modo número de empleado
    + PIN (8 casillas).
  - **Vista escritorio** → modo email + password (como hoy).
- Tras autenticar, `AuthProvider` enruta a la cara correspondiente y revisa
  `GET /auth/pin/estado`: si el PIN es temporal o venció → **obliga** a la
  pantalla de cambio antes de navegar (spec §6.6-3 y §6.6-7). Sin internet
  con PIN vencido: margen de 3-4 días (constante `PIN_GRACE_OFFLINE_DIAS`,
  pendiente de fijar con el cliente — §6.9-2).

### 8.5 Vistas placeholder de la base (solo título)

Cada ruta del §7b se crea con su PageHeader móvil (título + subtítulo "en
construcción") y **nada más** — sin lógica de módulos:

| Rol | Vistas placeholder |
|---|---|
| Trabajador | `/m` Inicio · `/m/asistencia` · `/m/reportes` · `/m/contactos` · `/m/perfil` |
| Residente | `/m` · `/m/asistencia` · `/m/reportes` · `/m/obras` · `/m/contactos` |
| Técnicos | `/m` · `/m/asistencia` · `/m/reportes` · `/m/flota-obras` · `/m/inventario` · `/m/diesel` (solo Diesel) |
| Cobrador | `/m` · `/m/asistencia` · `/m/pos` · `/m/corte` |
| Administrador | `/m` · `/m/reportes` · `/m/finanzas` · `/m/modulos` |

Un solo componente reutilizable `components/pwa/PantallaPlaceholder.tsx`
(título + ícono + subtítulo), documentado en `COMPONENTS.md` — el único
componente nuevo de la base.

### 8.6 Orden de construcción de la BASE (pasos)

1. **Migraciones** (§8.1) + `prisma generate` + resolve local.
2. **Endpoints de PIN** (§8.2) con tests unitarios (cada método: válido +
   FAIL auditado) + integration real (bloqueo por cuenta, cambio con cierre
   de sesiones, reinicio temporal, historial de últimos 3) + smoke REST.
3. **Login dual** (§8.4) + pantallas: cambio de PIN (obligatorio si temporal/
   vencido) y estado del aviso a los 25 días.
4. **Shell + nav por rol + detector + interruptor** (§7a/7b) — ya detallados.
5. **Vistas placeholder** (§8.5) + `PantallaPlaceholder` documentado.
6. **Offline + instalable** (§7c): cola, sincronizador, manifest + SW mínimo.
7. **RBAC de vistas móviles** (§8.1-2) — la nav lee `user.vistas` y las
   pantallas se filtran solas.
8. **Verificación final de la base:** smoke por rol con los 8 usuarios demo
   (número+PIN), instalable desde el navegador, offline captura y sincroniza
   al volver señal, `tsc`+eslint+tests verdes.


### 8.8 RBAC de la PWA — brechas exactas (verificado contra la BD, 2026-11-11)

Estado ACTUAL de `role_vistas` (puedeVer) de los roles de trabajadores:

| Rol | Tiene hoy | FALTA para la PWA (spec §6.3) |
|---|---|---|
| Trabajador | dashboard · reportes | **asistencia** (universal) · **contactos** (vista nueva) · **perfil** (vista nueva) |
| Residente | dashboard · reportes | **asistencia** (universal) · **obras (proyectos)** · **contactos** (vista nueva) |
| Técnicos (×4) | dashboard · reportes | **asistencia** (universal) · **flota (maquinaria/GPS)** · **inventario** · **diesel (combustible)** |
| Cobrador | dashboard · reportes · **ventas** · **ventas/corte** · criba | **asistencia** (universal) — POS y corte YA los tiene (migración 20261108190000) |
| Administrador | todo (nivel 100) | nada — role_vistas ya completo |

Conclusiones:
1. **La gestión de permisos NO es suficiente tal cual** — faltan concesiones
   concretas que la migración RBAC de la base (§8.1-2) debe aplicar:
   - Asistencia universal: 7 roles (Trabajador, Residente, 4 Técnicos,
     Cobrador) con `puedeVer` de la vista móvil de asistencia.
   - Proyectos (obras) para Residente.
   - Maquinaria + combustible + inventario para los 4 Técnicos.
   - Vistas NUEVAS a registrar antes de conceder: `/m/contactos` y
     `/m/perfil` (no existen en la tabla `vistas`).
2. **No hay que tocar permisos de recursos** (module/recurso/accion): los
   endpoints que la PWA consume ya validan por RBAC lo que el escritorio
   usa — las vistas móviles solo necesitan `puedeVer` de la vista
   correspondiente; la lógica fina (crear reporte, cobrar) ya vive en los
   permisos existentes de cada módulo.
3. **El rol nace de la BD, no del prefijo** (spec §6.4): `rol-nav.ts` lee
   `user.vistas` — al conceder vía migración, la nav inferior de cada rol
   se arma sola.
4. La lista de concesiones se aplicará con el patrón idempotente del repo
   (role_vistas por NOT EXISTS) en la migración de la base (§8.1-2).

### 8.7 Notas de la base

**Respuestas del cliente (2026-11-11) a §6.9:**
- **Caducidad del PIN del Administrador: los mismos 30 días** — SOLO en la
  PWA (la app móvil de admin abre reportes/finanzas/módulos, misma superficie
  de riesgo que cualquier PIN; el escritorio con email+password queda
  intocado). Uniformidad = mismo aviso a los 25 días y misma regla de
  bloqueo, sin excepciones por rol en el código.
- **Margen sin internet con PIN vencido: 3-4 días** (constante
  `PIN_GRACE_OFFLINE_DIAS` en el front cuando llegue la fase de captura
  offline de asistencia).
- **Regla de repeticiones: ESTRICTA** — ningún carácter repetido en todo el
  PIN (`new Set(pin).size === 8`), implementado en `validarPinNuevo`.

- El desktop NO cambia en esta base (su login email+password sigue) — solo el
  alta de Trabajadores gana el número/PIN/WhatsApp.
- Los 8 usuarios demo del seed ganan su `numero_empleado` (ADM-01 admin,
  RES-014... a designar) — el seed idempotente los renumera.
- La mesa de ayuda "no tiene vista aparte": sus acciones (desbloquear,
  reiniciar) viven en el escritorio (Usuarios/Trabajadores) con permisos de
  sistema.
- §3 de este documento queda superseded por §7c (offline ya es alcance de la
  base) — no se borra por trazabilidad, pero se lee con esa nota.

### 8.9 Auditoría de seguridad y casos especiales (spec §6.7 y §6.8) — verificado 2026-11-11

**§6.7 Seguridad:**

| Regla del spec | Estado | Evidencia |
|---|---|---|
| **Nadie ve PINs** — el sistema nunca muestra un PIN existente | ✅ | No existe ningún GET que devuelva `pin_hash`/PIN. Única excepción por diseño: el temporal NUEVO del reinicio se entrega UNA VEZ al ejecutante (equivalente a la entrega del alta por WhatsApp — es un PIN que aún no existía, no uno "existente") |
| **Bloqueo: 5 intentos fallidos + mesa de ayuda desbloquea** | ✅ | `login-pin` bloquea la cuenta a los 5 (`intentos_pin`/`cuenta_bloqueada_en`) — integration real probada; `POST /auth/pin/desbloqueo` con permiso `sistema.usuarios.editar` |
| **Reautenticar: cambiar PIN pide el actual** | ✅ | `pin/cambio` exige `pinActual` verificado con bcrypt |
| **Cierre de sesiones: el administrativo cierra TODAS las sesiones de un trabajador** | ⚠️ PARCIAL — el reinicio de PIN ya cierra todas, pero falta la acción **standalone** (cerrar sesiones sin cambiar PIN) + su botón en Trabajadores del escritorio | Pendiente en §8.9-pendientes |
| **Reautenticar también para cerrar otras sesiones (propio)** | ⚠️ PARCIAL — cerrar las OTRAS sesiones existe dentro del cambio de PIN; falta la acción propia independiente | Pendiente en §8.9-pendientes |
| **Bajas: al desactivar al usuario, deja de entrar** | ✅ | `JwtStrategy` rechaza **en cada request** a usuarios con `activo=false` o `eliminado_en` (verificado en el código) + ambos logins lo rechazan |
| **Cifrado argon2 o bcrypt** | ✅ | bcryptjs cost 12 (decisión del cliente 2026-11-11 — cero dependencia nativa). **Ruta de actualización a argon2 documentada:** lazy-rehash por login o forzar cambio de PIN (los PINs rotan a 30 días — más fácil que con passwords) |

**Nota pequeña encontrada:** una cuenta BLOQUEADA por PIN puede seguir usando
su access token vigente (máx 15 min) hasta que expire — el login-pin ya no le
da tokens nuevos. Si se quiere cierre instantáneo, `JwtStrategy` puede
verificar también `cuenta_bloqueada_en` (una consulta más por request).
Pendiente menor, decisión al construir la mesa de ayuda.

**§6.8 Casos especiales:**

| Caso | Estado |
|---|---|
| **Olvidó el PIN:** reinicio con clic + temporal 24 h → vuelve al paso 3 (primer ingreso obliga a crear PIN) | ✅ implementado (reinicio + guard de `requiereCambio`) |
| **Cambio de teléfono:** número + PIN desde cualquier dispositivo | ✅ el login-pin es independiente del dispositivo (sesiones por dispositivo en `sessions`) |
| **Teléfono compartido:** cada quien cierra SU sesión | ✅ botón de cerrar sesión en el shell móvil + escritorio (el listado "mis sesiones" es mejoramiento posterior) |
| **Residente: alta liga a cada trabajador con su obra y su encargado** | ⚠️ la BD ya lo soporta (`users.jefe_user_id` + el scope lo usa) — el FORMULARIO del alta (escritorio) debe pedir encargado/obra: pendiente junto con el alta ampliada |

**§6.9 Pendiente de decidir — cerrado 2026-11-11:**

| Pregunta | Respuesta |
|---|---|
| ¿30 días aplica igual al administrador? | **SÍ — mismos 30 días, SOLO en la PWA** (el escritorio email+password queda intocado). Uniformidad sin excepciones por rol |
| ¿Margen sin internet con PIN vencido? | **3-4 días** (constante `PIN_GRACE_OFFLINE_DIAS` — se activa con la fase de captura offline de asistencia) |
| ¿Qué datos se guardan en el SVR? | **Ya existen todos:** rol (`users_roles`), fecha del último cambio de PIN (`pin_cambiado_en`), estado de sesión (`sessions.activa/revocado_en/motivo_revocado`) y número de intentos (`intentos_pin`) |

**§8.10 Pendientes de usuario/seguridad para construir DESPUÉS** — ahora
registrados en `docs-planes/IMPLEMENTACIONES-A-FUTURO.md` con número:

1. **Alta ampliada** → **P14** de IMPLEMENTACIONES-A-FUTURO (en la ALTA
   EXISTENTE de Trabajadores del escritorio: número + PIN temporal 24 h +
   botón `wa.me` + encargado/obra en el formulario + acciones de mesa de
   ayuda conectadas a P12).
2. **Cierre masivo de sesiones standalone** (administrativo) → **P12** (panel
   de gestión de identidad: por usuario, sin cambiar PIN).
3. **"Mis sesiones" propio en la PWA** (opcional) → también vive en **P12**
   (ver sesiones activas del propio usuario desde el móvil).
4. **Bloqueo instantáneo opcional** → se decide al construir **P12**
   (verificar `cuenta_bloqueada_en` en `JwtStrategy`).
5. Upgrade futuro de hash: **bcryptjs → argon2** vía lazy-rehash o forzando
   el cambio de PIN (los PINs rotan a 30 días — trivial comparado con
   passwords). Sin P-number: decisión técnica cuando se quiera.
6. **Sweeper de `token_blacklist`** → **P13** de IMPLEMENTACIONES-A-FUTURO.
   el cambio de PIN (los PINs rotan a 30 días — trivial comparado con
   passwords).
