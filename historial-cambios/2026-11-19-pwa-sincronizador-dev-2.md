# Sincronizador PWA pasa por el apiClient: refresh del 401 heredado (tarea #2 del plan de saneamiento offline)

**Fecha:** 2026-11-19
**Autor:** agente
**Plan de origen:** `docs-planes/docs-pwa/PLAN-SINCRONIZACION-OFFLINE-PWA-2026-11-19.md` (punto 2)

## Cambios realizados
- `puertoPorDefecto` en `lib/pwa/sincronizador.ts` dejó su `fetch` crudo y ahora llama a `apiClient.post(item.endpoint, { ...item.payload, idempotenciaKey: item.id })`, mapeando `{ ok: res.success === true }` (el envoltorio `TransformInterceptor` hace que `success` ↔ 2xx).
- Lo que gana de gratis por `request()` de `lib/api.ts` (sin tocar ese archivo):
  - **401 → refresh único**: respeta `isRefreshing` + cola `refreshSubscribers` y la promesa compartida `refreshEnCurso` (rotación del refresh token). Reintenta UNA vez con el token nuevo; si el refresh falla, limpia sesión y redirige a `/` (mismo comportamiento del resto de la app).
  - **Error de red**: `request()` lanza el mensaje de conexión amigable; el `try/catch` por item de `sincronizarAhora` ya lo captura y hace `marcarError`.
  - El `Content-Type` y la URL base los pone `apiClient`.
- La firma de `PuertoEnvio` no cambia; `API_BASE_URL` sigue exportado en `lib/api.ts` (queda como export legítimo, el sincronizador ya no lo usa).

## Cosas nuevas
- Segunda tarea del plan de saneamiento ejecutada; queda #1 (estado por registro y trato del 409).

## Archivos tocados
- `apps/web/src/lib/pwa/sincronizador.ts`
- `historial-cambios/2026-11-19-pwa-sincronizador-dev-2.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit` en `apps/web`: 0 errores.
- `npm run lint` en `apps/web`: 0 errores, 37 warnings preexistentes (deuda conocida, no bloquean).
- `git diff --check`: sin errores.
- **Smoke manual pendiente:** con `npm run dev` + API en `:3001`, item en la cola con access token expirado → al reconectar señal el item debe salir tras UN refresh (verificable en Network: un POST a `/auth/refresh` + el POST del item con Authorization nuevo). Sesión muerta (refresh revocado) → redirect a `/`.

## Pendientes y riesgos
- **Cola sobrevive a la sesión muerta:** el redirect de `request()` no pasa por logout, así que `limpiarCola()` (AuthProvider:228) no corre; un item pendiente podría enviarse con el token del usuario que entre después. Caso real pero la cola está hoy vacía; su manejo se decide en la tarea #1 (estados/conflictos).
- No se probó en teléfono ni APK; hoy ninguna vista llama a `encolar()`.
- Sin push: el commit queda local, como indica la regla del repo.
