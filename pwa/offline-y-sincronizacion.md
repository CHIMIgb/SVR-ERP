# La PWA sin internet — cómo funciona el offline y la sincronización

> Documento del cliente/dev para la PWA de SVR (complemento de
> `vistas-movil-comercial-operaciones.md` §7c). Aquí se explica, sin suponer
> nada, cómo la app guarda lo registrado SIN internet y cómo lo envía solo
> cuando vuelve la señal.

## 1. La idea en una frase

**Capturar sin internet; sincronizar con internet.** Todo lo que el
trabajador registra (asistencia, reportes, comentarios, fotos) se guarda
primero EN EL TELÉFONO. La app nunca se queda "pensando" si no hay señal: el
registro queda ahí, marcado como *pendiente de enviar*, y un sincronizador
interno lo manda al servidor en cuanto detecta internet.

## 2. Qué se guarda sin internet y qué no

| Se puede SIN internet (se encola) | Requiere internet (no se encola) |
|---|---|
| Marcar asistencia (foto + GPS) | Aceptar un incidente |
| Crear un reporte (con fotos) | Cerrar / reasignar |
| Comentar en un reporte | Cerrar el corte de caja |
| Adjuntar una imagen | **Todo el POS (dinero)** |
| Ver tus propios registros ya sincronizados | Ver datos de otros (necesitan servidor) |

**Regla de oro:** *offline = capturar; online = coordinar.* Las acciones que
cambian el trabajo de OTRA persona o tocan dinero exigen señal — el spec del
cliente (§6.2) habla de asistencia y reportes, no de pagos.

## 3. Dónde se guarda en el teléfono

**IndexedDB** — la base de datos que los navegadores le prestan a las PWA
(aguas con megas, sobrevive al cierre de la app, vive por origen). No usamos
localStorage (pequeño y solo texto). La cola vive ahí, estructurada:

```
registro en la cola (outbox):
  id          → UUID generado EN EL TELÉFONO (v4)
  endpoint    → a qué API va (ej. /api/reportes-campo)
  payload     → lo capturado (texto, base64 de la foto convertida a WebP…)
  creado_en   → cuándo se capturó (se respeta ese orden al enviar)
  intentos    → cuántas veces lo intentó el sincronizador
  estado      → pendiente | error
```

**Las fotos:** se convierten a WebP EN EL TELÉFONO (mismo flujo que ya usa la
web) y se guardan como texto base64 dentro del payload — la conversión no
necesita red.

## 4. Por qué no se duplica nada al reenviar (idempotencia)

El teléfono genera un **UUID propio para cada registro ANTES de enviarlo**.
Ese UUID viaja como identidad del registro (`X-Idempotencia-Key` en la
petición). Consecuencia:

- Si el sincronizador envía un registro y la señal se corta a la mitad, el
  reintento NO crea una fila doble: el servidor reconoce la misma identidad
  y la ignora/reemplaza.
- Es el mismo principio que ya usa el POS con su `idempotencia_key`.

**Contrato para las fases de captura:** cuando se construya la pantalla de
asistencia y el alta móvil de reportes, sus endpoints deben honrar esa
cabecera (o recibir el UUID como PK) — la cola ya lo garantiza de su lado.

## 5. Cuándo se sincroniza (los 3 disparadores)

| Disparador | Cuándo | Nota |
|---|---|---|
| **Al abrir la app** | Siempre, al montar el shell | El caso del iPhone (spec §6.2: "se envía al abrir la app otra vez") |
| **Al volver la señal** | Evento `online` del navegador | El caso Android con la app abierta |
| **Periódico** | Cada 2 minutos mientras la app esté abierta | Cobertura de cortes de señal muy cortos |

*Segundo plano de Android (spec §6.2):* se registrará la Background Sync API
cuando el SO la permita; si el SO no la ejecuta, el envío ocurre al abrir la
app — mismo resultado práctico. Se hace en la fase de asistencia, no antes.

**Orden de envío:** FIFO por `creado_en`, respetando dependencias (el reporte
va ANTES que sus fotos). Un registro con error NO bloquea a los demás (se
marca y sigue la cola).

## 6. Qué ve el usuario (UX del offline)

- **Nav inferior:** contador *"N pendiente(s) por enviar"* cuando la cola no
  esté vacía (ya reservado en `RoleNav`).
- **Cada registro capturado sin señal:** aparece en la app al instante
  (localmente) marcado como pendiente — el trabajador SABE que quedó.
- **Al sincronizar:** los pendientes desaparecen del contador y quedan como
  registros normales en el servidor.
- **Si un registro falla al sincronizar** (ej. sesión vencida): queda en
  estado error y se reintenta; tras re-login se manda de nuevo.

## 7. Seguridad y límites

- **Sesión vencida + cola:** los envíos fallarán hasta que la sesión se
  renueve (el refresh automático de tokens ya funciona igual en offline que
  en línea); si el PIN venció y no puede revalidar, el margen de 3-4 días
  (spec §6.6-7) aplica a CAPTURAR — la cola espera.
- **Cerrar sesión NO borra la cola** (propuesta en el plan): es del
  dispositivo; con el cierre masivo por admin los envíos fallan hasta el
  re-login y ahí salen.
- **Purga:** registros entregados se borran de la cola después de unos días;
  el teléfono avisa si la cola crece demasiado.
- **Cuota:** IndexedDB en Chrome Android da cientos de MB — suficiente para
  cientos de fotos WebP.

## 8. Instalación (PWA instalable)

- `manifest.json` (nombre, iconos, `display: standalone`, `start_url: /m`) +
  service worker mínimo (caché del "caparazón" de la app).
- Con eso el navegador ofrece **"Instalar app"** — ícono en el teléfono sin
  tiendas (spec §6.2).
- Requisito firme: **HTTPS** (cámara, GPS e instalación).

## 9. Estado de construcción (paso 6 de la base)

| Pieza | Estado |
|---|---|
| Cola IndexedDB (`lib/pwa/offline.ts`) | este paso |
| Sincronizador (`lib/pwa/sincronizador.ts`) + disparadores | este paso |
| Contador visible en la nav | este paso |
| `manifest.json` + service worker + iconos | este paso |
| Pantallas de captura que usan la cola | fases de asistencia/reportes (la infra queda lista) |
| Background Sync API de Android | fase de asistencia |

## 10. Guía para devs — cómo conectar una pantalla de captura a la cola

La infraestructura corre **automática** en el shell (`(pwa)/layout.tsx`):
registra el service worker, arranca el sincronizador y mantiene el contador
de pendientes. Lo ÚNICO que hace una pantalla de captura es **encolar en vez
de llamar a la API**:

```tsx
import { encolar, nuevoId } from "@/lib/pwa/offline";

// ANTES (online):                       // DESPUÉS (offline-first):
await apiClient.post(                    await encolar("/reportes-campo", {
  "/reportes-campo",                       tipo: "INCIDENTE",
  { tipo: "INCIDENTE", ... },              numero_empleado: miNumero,
);                                       pin: "…",
                                         // el UUID del registro lo genera la cola
                                       });
```

- `encolar()` devuelve el elemento con su `id` (UUID del teléfono) — esa
  identidad viaja como `X-Idempotencia-Key`; el endpoint de destino debe
  honrarla (dedupe por PK/índice único) para que los reenvíos no dupliquen.
- El **sincronizador** envía solo (al abrir, al volver la señal, cada 2 min).
- Para saber cuántos pendientes hay en tu pantalla: `useCola()` (hook
  reactivo — el mismo que alimenta el badge de la nav).
- Si tu pantalla muestra la lista de registros: los "pendientes" de la cola
  se pueden pintar como cards extra (estado local) — la cola expone
  `pendientes()` con todo el payload.
- **Regla:** solo CAPTURAS se encolan (asistencia/reportes/comentarios/
  adjuntos). Acciones que cambian el trabajo de otros o dinero (aceptar,
  cerrar, cortes) requieren conexión y van directo a la API.
