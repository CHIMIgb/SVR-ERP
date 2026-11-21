# COMPONENTS-PWA.md — Componentes de la PWA (`src/components/pwa/*`)

**Fecha de creación:** 2026-11-19
**Archivo hermano:** `COMPONENTS.md` (kit compartido escritorio+PWA: `src/components/ui/*`).

La PWA vive en `apps/web` como grupo de rutas `(pwa)` con URL `/m/*` (ver
AGENTS.md → "PWA móvil" y `pwa/vistas-movil-comercial-operaciones.md`).
Los componentes móviles viven en `src/components/pwa/*` — REUSAN el kit
`components/ui/*` antes de crear algo nuevo (regla 2 de AGENTS.md).

**Regla no negociable:** todo componente nuevo en `src/components/pwa/` se
documenta AQUÍ en el mismo cambio, con: tabla de props, import, ejemplo de
uso, «Cuándo usar» y **«Cuándo NO usar»**. Sin documentación es deuda
desde el día 1.

---

## 1. RoleNav

Nav inferior por rol del shell móvil (plan §7b). Las pestañas provienen
SIEMPRE de `user.vistas` vía `lib/pwa/rol-nav.ts` — PROHIBIDO hardcodear
el menú por rol en las pantallas. Targets táctiles ≥44px (h-12), activa
por ruta (con `/m` exacta para no marcar Inicio en todo), safe-area
inferior y contador global de la cola offline.

**Archivos:**
- `src/components/pwa/RoleNav.tsx` (single file — patrón antiguo; los nuevos van en carpeta)

**Importacion:**
```tsx
import { RoleNav } from '@/components/pwa/RoleNav';
```

**Props:**

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `pendientes` | `number` | `0` | N items en la cola offline → muestra «N pendiente(s) por enviar» sobre la nav (viene de `useCola`) |

**Uso:** solo desde `(pwa)/layout.tsx` (ya cableado). **Cuando NO:** en el
escritorio (regla de independencia) ni dentro de pantallas individuales.

## 2. PinInput

Input de PIN de 8 casillas para login móvil y cambio de PIN (spec §6.5).

**Archivos:**
- `src/components/pwa/PinInput.tsx`

**Importacion:**
```tsx
import { PinInput } from '@/components/pwa/PinInput';
```

**Props:**

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `value` | `string` | *(requerido)* | PIN actual (string de hasta 8 chars) |
| `onChange` | `(pin: string) => void` | *(requerido)* | Callback con el PIN actualizado |
| `disabled` | `boolean` | `false` | Deshabilita durante la petición |
| `error` | `boolean` | `false` | Bordes rojos (fallo de validación/login) |
| `ariaLabel` | `string` | `'PIN'` | Accesible por casilla ("PIN posición N") |

**Uso:**
```tsx
<PinInput value={pin} onChange={setPin} error={!!fieldErrors.pin} />
```

**Comportamiento:**
- Enmascarado (type=password) — nadie ve el PIN en pantalla (spec §6.7).
- Auto-avanza a la casilla siguiente al escribir; Backspace borra la casilla
  actual y retrocede si está vacía; pegar un PIN completo lo distribuye.
- Normaliza a MAYÚSCULAS (el PIN no distingue mayúsculas — spec §6.5).

**Cuando USAR:** login móvil, cambio de PIN. **Cuando NO:** nada del escritorio.

## 3. PantallaPlaceholder

Placeholder de pantalla de la base de la PWA (plan §8.5): solo título +
subtítulo + ícono opcional. Las pantallas reales lo reemplazan por módulo.

**Archivos:**
- `src/components/pwa/PantallaPlaceholder.tsx`

**Importacion:**
```tsx
import PantallaPlaceholder from '@/components/pwa/PantallaPlaceholder';
```

**Props:**

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `titulo` | `string` | *(requerido)* | Nombre de la pantalla |
| `subtitulo` | `string` | `undefined` | Texto "en construcción" |
| `icono` | `ReactNode` | `undefined` | Ícono lucide en un recuadro suave |

**Uso:**
```tsx
<PantallaPlaceholder
  titulo="Inicio"
  subtitulo="Tu pantalla de inicio llegará con el dashboard móvil del rol"
  icono={<Home className="w-10 h-10" />}
/>
```

**Cuando USAR:** cualquier ruta `/m/*` de la base aún sin módulo.
**Cuando NO:** cuando la pantalla ya tiene su módulo real.

## 4. ModalInstalar

Modal de instalación de la PWA (petición del cliente 2026-11-11): se
renderiza en CADA acceso al shell `(pwa)` cuando la app NO está instalada
(`display-mode: standalone` falso), desde `(pwa)/layout.tsx`. El botón
«Instalar» lanza el DIÁLOGO NATIVO del navegador (`beforeinstallprompt`,
capturado temprano por el script inline del layout); si Chrome no entregó
el evento (enfriamiento tras descartarlo u origen sin confianza), el
propio modal muestra la salida del menú ⋮ — nunca un botón silencioso.

**Archivos:**
- `src/components/pwa/ModalInstalar.tsx`
- `src/lib/pwa/instalar.ts` (helpers: `obtenerPrompt`, `estaInstalada`, `instalarApp`)

**Importacion:**
```tsx
import ModalInstalar from '@/components/pwa/ModalInstalar';
```

**Props:**

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `onCerrar` | `() => void` | *(requerido)* | Cierra el modal (solo esta visita; vuelve en el próximo acceso) |

**Cuándo usar:** solo desde `(pwa)/layout.tsx` (ya cableado — no montar
en otro lado). **Cuándo NO:** en el escritorio (regla de independencia) ni
dentro de pantallas móviles individuales.

## 5. TarjetaReporte

Card de reporte de campo para la PWA (diseño «acción primero»): folio,
badges de estado/prioridad (variantes del `Badge` del kit), descripción
breve truncada, meta (categoría · quién reportó · fecha) y acciones
explícitas con targets táctiles ≥44px. Presentacional: el padre decide si
hay acción y cuál. El API ya serializa estado/prioridad/categoría en
texto es-MX — la tarjeta no re-mapea.

**Archivos:**
- `src/components/pwa/TarjetaReporte/TarjetaReporte.tsx` (+ `.styles.ts`, `index.ts`)

**Importacion:**
```tsx
import { TarjetaReporte } from '@/components/pwa/TarjetaReporte';
```

**Props:**

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `reporte` | `ReporteCampoDTO` | *(requerido)* | El reporte a mostrar |
| `onVer` | `() => void` | *(requerido)* | Abre el detalle |
| `accion` | `{ etiqueta, onClick, ocupado? }` | `undefined` | Acción principal del rol (ej. Aceptar); sin ella solo se ve Ver |
| `onUbicacion` | `() => void` | `undefined` | Botón «Ubicación» (MapPin): el padre decide obra → modal de domicilio / GPS → Google Maps. Proveerla SOLO si el reporte tiene dónde ver |

**Meta:** la línea inferior muestra `categoría · persona · hace 2 h` con
**tiempo relativo es-MX** (`haceTiempo()` de `lib/formatters.ts`, que
interpreta fecha+hora en la zona del .env) — la fecha exacta vive en el
detalle.

**Cuando USAR:** listados de reportes en vistas `/m/*`. **Cuando NO:** en
el escritorio (usa la DataTable de `/reportes`) ni para otras entidades.

## 6. EstadoCola

Resumen de la cola offline dentro de la pantalla de captura. Muestra cada
item con su estado (`Pendiente` / `Error de red` / `Conflicto` /
`Rechazado` / `Falta(n) N foto(s)` cuando el reporte ya se registró y
suben fotos pendientes); los conflictos (409) y los rechazados (4xx ≠ 409,
estado terminal — bloqueante 5 PR #23) esperan la decisión humana con
botones Descartar (`descartar`) y Reintentar (`reencolar`). Se oculta con
la cola vacía.

**Archivos:**
- `src/components/pwa/EstadoCola/EstadoCola.tsx` (+ `.styles.ts`, `index.ts`)

**Importacion:**
```tsx
import { EstadoCola } from '@/components/pwa/EstadoCola';
```

**Props:**

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `refreshKey` | `number` | `0` | El padre lo incrementa tras encolar para refrescar ya (además: evento `online` y sondeo de 30 s) |

**Cuando USAR:** en toda pantalla `/m/*` que capture (encola). **Cuando
NO:** en pantallas solo de consulta o en el escritorio.

## 7. ModalNuevoReporte

Captura de un reporte de campo, **paridad 1:1 con el escritorio `/reportes`**:
Área (a la que se envía) con optgroups + «Misma área» (hint con la torre del
usuario), Subcategoría filtrada por área, Ubicación Proyecto/GPS (el GPS se
captura al guardar, requiere HTTPS), Prioridad, Descripción e Imágenes de la
avería (WebP local vía `convertirAWebp`, máx 4 × 2 MB). Offline-first:
SIEMPRE encola (`encolar` con la key de idempotencia del teléfono) y dispara
`sincronizarAhora()`; las fotos viajan con el item (`adjuntos`) y el
sincronizador las adjunta tras el ACK. Solo el ACK de SU item (ids que
devuelve la pasada) felicita y cierra — no un conteo global de la cola
(bloqueante 5 PR #23); si el server rechazó la captura (4xx ≠ 409) avisa
con el estado «Rechazado» de `EstadoCola`; sin señal muestra «quedó
guardado» y el estado lo pinta `EstadoCola`.
Payload idéntico al escritorio (`mismaArea` o `categoria`, `subcategoriaId`
solo si no es misma área). Reinicia sus campos al CERRAR (no al abrir).

**Archivos:**
- `src/components/pwa/ModalNuevoReporte/ModalNuevoReporte.tsx` (+ `.styles.ts`, `index.ts`)

**Importacion:**
```tsx
import { ModalNuevoReporte } from '@/components/pwa/ModalNuevoReporte';
```

**Props:**

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `abierto` | `boolean` | *(requerido)* | Visibilidad |
| `onCerrar` | `() => void` | *(requerido)* | Cierra (y reinicia los campos) |
| `nombreUsuario` | `string` | *(requerido)* | Firma del reporte — nombre completo de la persona |
| `torreUsuario` | `string \| null` | `null` | Torre del usuario (`users.torre`) para el hint y el filtro |
| `onEncolado` | `() => void` | `undefined` | Avisa al padre que la cola cambió |

**Cuando USAR:** botón «Reportar» de `/m/reportes`. **Cuando NO:** para
editar (el edit sigue en el escritorio) ni para capturar asistencia (su
propio módulo). El select de Área es nativo — el kit `Select` no soporta
optgroups (igual que el escritorio).

## 8. NotificacionesModal

Centro de alertas del teléfono — **burbuja flotante compacta anclada arriba a
la derecha** (bajo la campana, paridad del «Centro de Alertas» del
escritorio). **REUTILIZA el provider compartido** (`NotificationProvider`
del escritorio: polling de 60 s, sin lógica nueva). Encabezado con
«Centro de Alertas / N no leídas» + acciones de ícono (`CheckCheck` =
marcar todas leídas, `Trash2` = vaciar/descartar), lista compacta con
ícono por tipo (alerta/info), fecha y cuerpo truncado, y **su propio
scroll** (`max-h` de la tarjeta + `overflow-y-auto`). Tap en un item lo
marca leído.

**Banner de activación del push** (parte superior, 4 estados de
`estadoPush()` de `lib/pwa/push.ts`): `por-activar` → botón «Activar» (el
GESTO que pide el permiso y suscribe el dispositivo vía VAPID);
`activadas` → confirmación; `bloqueadas` → instrucción de desbloqueo del
navegador; `no-soportado` → «requiere la app instalada»; `sin-sw` (dev) →
no muestra banner (el SW no corre en dev — push solo en producción).

**Archivos:**
- `src/components/pwa/NotificacionesModal/NotificacionesModal.tsx` (+ `.styles.ts`, `index.ts`)

**Importacion:**
```tsx
import { NotificacionesModal } from '@/components/pwa/NotificacionesModal';
```

**Props:**

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `abierto` | `boolean` | *(requerido)* | Visibilidad |
| `onCerrar` | `() => void` | *(requerido)* | Cierra el centro (overlay tap / campana / Escape) |

**Cuando USAR:** desde `CampanaNotificaciones` (ya cableado). **Cuando NO:**
en el escritorio (su campana vive en el `Topbar`) ni montado fuera del
`NotificationProvider`.

## 9. CampanaNotificaciones

Campana del header PWA: botón ≥44px con badge del número de no leídas
(`unreadCount` del provider) que abre `NotificacionesModal`. Vive DEBAJO de
`NotificationProvider` (montado en el shell `(pwa)`).

**Archivos:**
- `src/components/pwa/CampanaNotificaciones/CampanaNotificaciones.tsx` (+ `.styles.ts`, `index.ts`)

**Importacion:**
```tsx
import { CampanaNotificaciones } from '@/components/pwa/CampanaNotificaciones';
```

**Props:** ninguna (consume el provider y maneja su estado de apertura).

**Cuando USAR:** solo en el header del shell `(pwa)` (ya cableado — no
montar en pantallas individuales). **Cuando NO:** en el escritorio (regla
de independencia).

**Cuando USAR:** botón «Reportar» de `/m/reportes`. **Cuando NO:** para
editar (el edit sigue en el escritorio) ni para capturar asistencia (su
propio módulo). El select de Área es nativo — el kit `Select` no soporta
optgroups (igual que el escritorio).
