# Sincronizador PWA: URL real de la API y key de idempotencia en el body

**Fecha:** 2026-11-18
**Autor:** agente

## Cambios realizados
- `API_BASE_URL` ahora se exporta desde `lib/api.ts` (mismo valor de siempre: `NEXT_PUBLIC_API_URL` o `http://localhost:3001/api`) y el sincronizador lo usa en vez de `fetch('/api' + item.endpoint)`, que caía en el servidor de Next en el puerto 3000, donde no hay API.
- El sincronizador envía `idempotenciaKey: item.id` dentro del body. El header `X-Idempotencia-Key` se quitó: el `ValidationPipe` global (`whitelist` + `forbidNonWhitelisted`) solo inspecciona el body, así que el header nunca llegaba al DTO y daba falsa sensación de idempotencia.
- `ReporteCampoCreateInput` declara `idempotenciaKey?: string` para que el contrato del front coincida con el DTO nuevo del API.
- Se actualizó el comment del sincronizador con la convención: todo endpoint conectado a la cola debe declarar y respetar `idempotenciaKey`.

## Cosas nuevas
- Nada nuevo: se corrigen dos defectos del envío existente (destino y llave de idempotencia).

## Archivos tocados
- `apps/web/src/lib/api.ts` (export de `API_BASE_URL` + campo opcional en `ReporteCampoCreateInput`)
- `apps/web/src/lib/pwa/sincronizador.ts` (URL absoluta, key en body, sin header, comment)
- `historial-cambios/2026-11-18-pwa-idempotencia-sincronizador.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit` en `apps/web`: 0 errores.
- `npm run lint` en `apps/web`: 0 errores, 37 warnings preexistentes (deuda conocida, no bloquean).
- `git diff --check`: sin errores.
- No se corrió el flujo end-to-end desde el teléfono: hoy ninguna vista llama a `encolar()` y no hay APK.

## Pendientes y riesgos
- **Convención nueva:** el sincronizador inyecta `idempotenciaKey` en todos los payloads. Hoy solo `reportes_campo` consume la cola y ya la acepta; cualquier endpoint futuro con whitelist estricto que no la declare responderá 400 y el elemento quedará en `error` para reintentar.
- **401 sin refresh:** el sincronizador sigue usando `getAccessToken()` directamente y no pasa por el refresh automático del `apiClient`. Si el access token expira, el elemento queda en error hasta que otra pantalla refresque la sesión. Queda para arreglarse por separado.
- `NEXT_PUBLIC_API_URL` se hornea en build: si el valor de producción apunta a otro host, el sincronizador hereda ese valor igual que el `apiClient`. CORS ya se controla en `main.ts` por lista de orígenes.
- Sin push: el commit queda local, como indica la regla del repo.
