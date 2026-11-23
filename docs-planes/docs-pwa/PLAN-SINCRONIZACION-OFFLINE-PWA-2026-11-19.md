# Plan — Sanear la cola offline y el sincronizador antes de las vistas PWA

**Fecha objetivo:** 2026-11-19
**Estado:** pendiente. No se escribió código para estos tres puntos.
**Ubicación:** `docs-planes/docs-pwa/` (catálogo de vistas: `VISTAS-PWA.md`).
**Spec de origen:** `pwa-docs/offline-y-sincronizacion.md` (§7c).

## Por qué va antes de `/m/reportes`

Ayer quedó lista la idempotencia de extremo a extremo: el API ya respeta
`idempotenciaKey` en `reportes_campo` (commit `9902ee96`) y el sincronizador ya
apunta a la URL real de la API y envía la key en el body (commit `191d9b74`).
Pero con el estado actual, si mañana se conecta la primera vista que encola:

- el operario **no ve en qué estado está cada captura** (solo un contador global);
- un **401 expira la sesión y deja el registro en error** sin recuperarlo;
- en **desarrollo no se puede probar nada**, porque el sincronizador no arranca.

Son tres agujeros del camino crítico offline. Se cierran antes de dibujar la UI
de captura para no construir sobre una cola que todavía miente sobre su estado.

---

## 1. Estado por registro y distinción de conflictos

**Situación real**
- `lib/pwa/offline.ts:10-17` define `estado: "pendiente" | "error"` e `intentos`.
- `lib/pwa/useCola.ts` y `components/pwa/RoleNav.tsx:24-26` solo muestran
  `N pendiente(s) por enviar`: no hay estado por registro ni noción de
  «enviado» o «conflicto».
- `lib/pwa/sincronizador.ts:46-56` trata cualquier respuesta no 2xx —incluido un
  409— como `marcarError()`: `intentos++` y reintento en la próxima pasada. Un
  conflicto de negocio se reproduce una y otra vez como si fuera un fallo de red.

**Qué hacer (con plan propio antes de tocar código)**
1. Decidir el modelo de estados: conservar el registro hasta el ACK o borrarlo
   como hoy; cómo representar `conflicto` frente a `error` de red.
2. Distinguir el 409 en `puertoPorDefecto` / `sincronizarAhora()` para no
   reintentarlo como un error transitorio. El conflicto se muestra al humano.
3. Exponer el estado por registro a la UI (nuevo hook o extensión de `useCola`)
   y mostrarlo en la pantalla que se construya después. El badge global se queda
   como resumen, no como único feedback.
4. Revisar callers: `useCola.ts`, `RoleNav.tsx`, `(pwa)/layout.tsx`,
   `AuthProvider.tsx:228` (`limpiarCola` al logout).

**Riesgo específico:** IndexedDB abre hoy la versión 1 con
`indexedDB.open(DB_NOMBRE, 1)` (`offline.ts:25`). Cambiar la forma del objeto
puede exigir `onupgradeneeded`; una subida de versión mal hecha puede dejar la
cola existente ilegible. Hay que preservar los pendientes o migrarlos.

**Verificación:** smoke con señal cortada, con un 409 forzado y con logout;
comprobar que «pendiente / enviado / conflicto» son visibles y que el contador
baja solo con ACK.

---

## 2. Refresh del token de acceso en el sincronizador

**Situación real**
- `sincronizador.ts:18-20` importa `getAccessToken()` y hace su propio `fetch`.
- `lib/api.ts` ya tiene `refreshAccessToken()` (≈108), `initializeAuth()` (≈160)
  y el `request()` con refresh rotativo y cola de subscribers (≈172). El
  sincronizador no pasa por ninguno de ellos.
- Access token: 15 min. Si expira, el POST da 401 → `marcarError()` → el item se
  queda hasta que otra pantalla refresque la sesión por su cuenta.

**Qué hacer (con plan propio antes de tocar código)**
1. Reutilizar la maquinaria de refresh existente en vez de duplicarla: decidir
   si se exporta un helper de `api.ts` que haga el POST autenticado con
   reintento único, o si el sincronizador invoca `initializeAuth()` antes de la
   pasada.
2. Respetar el refresh **rotativo** y la cola `refreshSubscribers`: dos pasadas
   no deben rotar el refresh token al mismo tiempo.
3. Mantener el access token en memoria; no persistirlo en IndexedDB ni en
   `localStorage`.

**Riesgo específico:** duplicar el refresh en el sincronizador puede invalidar
tokens que ya usan las vistas del escritorio o de la PWA, y romper la rotación
en cuanto haya dos pestañas abiertas.

**Verificación:** forzar un 401 (token expirado), confirmar que se refresca una
sola vez, que el item se reenvía con el token nuevo y que la cola de pendientes
llega a cero.

---

## 3. Encender el sincronizador en desarrollo

**Situación real**
- `(pwa)/layout.tsx:61-75` tiene un solo `useEffect` que: en `NODE_ENV !==
  "production"` desregistra service workers, borra cachés y **hace `return`**;
  recién en producción registra `/sw.js` y llama a `iniciarSincronizador()`.
- Resultado: con `npm run dev` no hay disparadores (`online`, intervalo de 2
  min, pasada inicial), así que el ciclo completo no se puede probar en local.

**Qué hacer**
1. Separar en dos efectos el registro del service worker (debe seguir
   desactivado en DEV por el cache-first de Turbopack sobre los chunks) del
   arranque del sincronizador (sí debe correr en DEV).
2. No cambiar el guard de dispositivo ni el de sesión del layout.

**Riesgo específico:** mover el registro del SW a DEV reintroduce el JS viejo,
errores de hidratación y hot-reload roto que motivaron el guard actual.

**Verificación:** con `npm run dev`, encolar a mano un item, cortar señal,
reconectar y confirmar que desaparece de IndexedDB; comprobar que no se
registró ningún service worker en DEV.

---

## Orden sugerido

1. **#3** — desbloquea probar los otros dos sin desplegar.
2. **#2** — evita perder capturas por expiración de token.
3. **#1** — cierra el feedback y los conflictos antes de que la vista nueva
   empiece a encolar.

Los tres son cambios de código: presentar plan y esperar autorización para cada
uno, con su commit atómico y su registro en `historial-cambios/`.

## Criterio para arrancar las vistas de Operaciones

- El ciclo «capturar sin señal → reconectar → ACK → cola vacía» se puede
  reproducir en `npm run dev`.
- Un 401 se recupera sin intervención; un 409 no se reintenta infinitamente.
- La UI muestra el estado por registro, no solo el total.
- Sin pushes ni PR salvo orden explícita.

## Contexto / fuera de este plan

- El dump `svr_erp_export/svr_erp_sin_postgis.sql` aún no incluye la columna
  `idempotencia_key`; el job `integration` de CI fallará el `migrate diff`
  hasta regenerarlo (deuda ya registrada en
  `historial-cambios/2026-11-18-pwa-idempotencia-reportes-api.md`).
- Hoy ninguna vista llama a `encolar()`: la cola está vacía y no se pierde
  información, pero tampoco se ejerce.
- No se probó el flujo en un teléfono ni en APK.
